const fs = require("fs");
const csvParser = require("csv-parser");
const db = require("../models");
const { Op } = require("sequelize");

const csvFilePath = process.argv[2];
const isDryRun = process.argv.includes("--dry");

if (!csvFilePath) {
  console.error("Please provide the path to the CSV file.");
  console.error(
    "Usage: node scripts/updateSampleAccessionsFromCSV.js <path-to-csv> [--dry]"
  );
  process.exit(1);
}

const normalize = (v) => {
  if (v === undefined || v === null) return null;
  const s = String(v).trim().replace(/\s+/g, " ");
  return s === "" ? null : s;
};

const VALID_STATUSES = ["Completed", "Pending", "Excluded", "TBC"];
const normalizeStatus = (v) => {
  const s = normalize(v);
  if (!s) return null;
  const low = s.toLowerCase();
  if (low === "completed") return "Completed";
  if (low === "pending") return "Pending";
  if (low === "excluded") return "Excluded";
  if (low === "tbc") return "TBC";
  return null; // invalid
};

function parseCSV(filePath) {
  return new Promise((resolve, reject) => {
    const rows = [];
    fs.createReadStream(filePath)
      .pipe(csvParser())
      .on("data", (raw) => {
        const accession = normalize(raw.accession);
        const sample = normalize(raw.sample);
        const status = normalizeStatus(raw.status);

        if (!accession) {
          console.warn("Skipped row with missing accession:", raw);
          return;
        }
        if (!status || !VALID_STATUSES.includes(status)) {
          console.warn(
            `Invalid status "${raw.status}" for accession ${accession}. Skipped.`
          );
          return;
        }

        rows.push({ Accession: accession, Sample: sample, Status: status });
      })
      .on("end", () => resolve(rows))
      .on("error", reject);
  });
}

(async () => {
  let t;
  try {
    await db.sequelize.authenticate();

    const csvRows = await parseCSV(csvFilePath);
    if (csvRows.length === 0) {
      console.log("No valid CSV rows to process.");
      process.exit(0);
    }

    // Deduplicate by Accession (last one in the file wins)
    const byAccession = new Map();
    for (const r of csvRows) byAccession.set(r.Accession, r);

    const accessions = [...byAccession.keys()];

    // Fetch existing rows for those accessions
    const existing = await db.SampleAccession.findAll({
      where: { Accession: { [Op.in]: accessions } },
      order: [
        ["updatedAt", "DESC"],
        ["createdAt", "DESC"],
      ],
    });

    if (existing.length === 0) {
      console.log("No matching accessions found in DB for provided CSV file.");
      process.exit(0);
    }

    // Group existing rows by Accession
    const grouped = new Map();
    for (const row of existing) {
      const key = row.Accession;
      if (!grouped.has(key)) grouped.set(key, []);
      grouped.get(key).push(row);
    }

    // Build an update plan (only if changes are needed)
    const plan = [];
    for (const [acc, incoming] of byAccession.entries()) {
      const rows = grouped.get(acc);
      if (!rows || rows.length === 0) continue;

      // Try exact (Accession, Sample) match first (normalized compare)
      const exact = rows.find(
        (r) => normalize(r.Sample) === normalize(incoming.Sample)
      );

      let target = exact || rows.find((r) => r.Sample == null) || rows[0];

      const oldSampleN = normalize(target.Sample);
      const newSampleN = normalize(incoming.Sample);

      const oldStatusN = normalize(target.Status);
      const newStatusN = normalize(incoming.Status);

      // Only enqueue if something actually changes
      if (oldSampleN !== newSampleN || oldStatusN !== newStatusN) {
        plan.push({
          target,
          incoming,
          meta: {
            id: target.id,
            Accession: acc,
            fromSample: target.Sample,
            toSample: incoming.Sample,
            fromStatus: target.Status,
            toStatus: incoming.Status,
          },
        });
      }
    }

    if (plan.length === 0) {
      console.log("Nothing to update. All matching rows are already in sync.");
      process.exit(0);
    }

    // Preview
    console.log(`Planned updates: ${plan.length}`);
    plan.slice(0, 15).forEach((p, i) => {
      const m = p.meta;
      console.log(
        `${i + 1}. [${m.Accession}] id=${m.id} Sample: ${
          m.fromSample ?? "NULL"
        } -> ${m.toSample ?? "NULL"} | Status: ${m.fromStatus} -> ${m.toStatus}`
      );
    });
    if (plan.length > 15) console.log(`...and ${plan.length - 15} more`);

    if (isDryRun) {
      console.log("Dry run only. No changes written.");
      process.exit(0);
    }

    t = await db.sequelize.transaction();

    for (const { target, incoming } of plan) {
      const desiredSampleN = normalize(incoming.Sample);
      const targetSampleN = normalize(target.Sample);

      // Build change set (only changed fields)
      const changes = {};
      if (targetSampleN !== desiredSampleN) {
        // If switching Sample, check for unique (Accession, Sample) clash
        if (desiredSampleN) {
          const clash = await db.SampleAccession.findOne({
            where: {
              Accession: target.Accession,
              Sample: incoming.Sample, // use the raw (already normalized by parse) value
              id: { [Op.ne]: target.id },
            },
            transaction: t,
            lock: t.LOCK.UPDATE,
          });

          if (clash) {
            // Another row already has this (Accession, Sample).
            // Update ONLY its Status; leave the current target's Sample as-is to avoid unique violation.
            const clashStatusN = normalize(clash.Status);
            if (clashStatusN !== normalize(incoming.Status)) {
              await clash.update(
                { Status: incoming.Status },
                { transaction: t }
              );
            }
            // Skip changing the target in this case.
            continue;
          }
        }

        changes.Sample = incoming.Sample; // set to normalized CSV value (trimmed, collapsed spaces)
      }

      if (normalize(target.Status) !== normalize(incoming.Status)) {
        changes.Status = incoming.Status;
      }

      if (Object.keys(changes).length === 0) continue; // safety

      await target.update(changes, { transaction: t });
    }

    await t.commit();
    console.log(`Updated ${plan.length} row(s).`);
    process.exit(0);
  } catch (err) {
    if (t) await t.rollback();
    console.error("Error updating sample accessions:", err);
    process.exit(1);
  }
})();
