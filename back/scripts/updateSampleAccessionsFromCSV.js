const fs = require("fs");
const csvParser = require("csv-parser");
const db = require("../models");
const { Op } = require("sequelize");
const {
  parseDatasetDois,
  setDatasetDois,
} = require("../utils/datasetDoiCsv");
const {
  PLACEHOLDER_STATUSES,
  reconcileSampleAccession,
} = require("../utils/reconcileSampleAccession");
const { parsePreferredAlias } = require("../utils/preferredAliasCsv");

const csvFilePath = process.argv[2];
const isDryRun = process.argv.includes("--dry");

if (!csvFilePath) {
  console.error("Please provide the path to the CSV file.");
  console.error(
    "Usage: node scripts/updateSampleAccessionsFromCSV.js <path-to-csv> [--dry]",
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

        const hasServerUrl = Object.prototype.hasOwnProperty.call(
          raw,
          "serverUrl",
        );

        const serverUrl = hasServerUrl ? normalize(raw.serverUrl) : undefined;
        const { supplied: hasDatasetDois, dois: datasetDois } =
          parseDatasetDois(raw);
        const { supplied: hasPreferredAlias, value: preferredAlias } =
          parsePreferredAlias(raw);

        if (!accession) {
          console.warn("Skipped row with missing accession:", raw);
          return;
        }
        if (!status || !VALID_STATUSES.includes(status)) {
          console.warn(
            `Invalid status "${raw.status}" for accession ${accession}. Skipped.`,
          );
          return;
        }

        rows.push({
          Accession: accession,
          Sample: sample,
          Status: status,
          hasServerUrl,
          ServerUrl: serverUrl,
          hasDatasetDois,
          datasetDois,
          hasPreferredAlias,
          PreferredAlias: preferredAlias,
        });
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

    // Deduplicate by accession and sample (last matching CSV row wins).
    const byAccessionAndSample = new Map();
    for (const row of csvRows) {
      byAccessionAndSample.set(
        `${row.Accession}\u0000${row.Sample || ""}`,
        row,
      );
    }

    const accessions = [
      ...new Set(
        [...byAccessionAndSample.values()].map((row) => row.Accession),
      ),
    ];

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
    for (const incoming of byAccessionAndSample.values()) {
      const acc = incoming.Accession;
      const rows = grouped.get(acc);
      if (!rows || rows.length === 0) continue;

      // Try exact (Accession, Sample) match first (normalized compare)
      const exact = rows.find(
        (r) => normalize(r.Sample) === normalize(incoming.Sample),
      );

      const placeholder = rows.find(
        (r) =>
          normalize(r.Sample) === null &&
          PLACEHOLDER_STATUSES.includes(r.Status),
      );
      const target = exact || (incoming.Sample ? placeholder : null);

      const oldSampleN = normalize(target?.Sample);
      const newSampleN = normalize(incoming.Sample);

      const oldStatusN = normalize(target?.Status);
      const newStatusN = normalize(incoming.Status);

      const oldServerUrlN = normalize(target?.ServerUrl);

      const newServerUrlN = normalize(incoming.ServerUrl);

      const serverUrlChanged =
        incoming.hasServerUrl && oldServerUrlN !== newServerUrlN;

      const oldPreferredAliasN = normalize(target?.PreferredAlias);
      const newPreferredAliasN = normalize(incoming.PreferredAlias);
      const preferredAliasChanged =
        incoming.hasPreferredAlias &&
        oldPreferredAliasN !== newPreferredAliasN;

      let datasetDoisChanged = false;
      if (incoming.hasDatasetDois && target) {
        const currentDatasetDois = await target.getDatasetDois({
          attributes: ["Doi"],
          joinTableAttributes: [],
        });
        const oldDois = currentDatasetDois.map((row) => row.Doi).sort();
        const newDois = [...incoming.datasetDois].sort();
        datasetDoisChanged =
          oldDois.length !== newDois.length ||
          oldDois.some((doi, index) => doi !== newDois[index]);
      } else if (incoming.hasDatasetDois) {
        datasetDoisChanged = incoming.datasetDois.length > 0;
      }

      const needsPlaceholderCleanup =
        newSampleN !== null &&
        rows.some(
          (row) =>
            row.id !== target?.id &&
            normalize(row.Sample) === null &&
            PLACEHOLDER_STATUSES.includes(row.Status),
        );

      // Only enqueue if something actually changes
      if (
        !target ||
        oldSampleN !== newSampleN ||
        oldStatusN !== newStatusN ||
        serverUrlChanged ||
        preferredAliasChanged ||
        datasetDoisChanged ||
        needsPlaceholderCleanup
      ) {
        plan.push({
          target,
          incoming,
          meta: {
            id: target?.id ?? null,
            Accession: acc,
            fromSample: target?.Sample ?? null,
            toSample: incoming.Sample,
            fromStatus: target?.Status ?? null,
            toStatus: incoming.Status,
            hasServerUrl: incoming.hasServerUrl,
            fromServerUrl: target?.ServerUrl ?? null,
            toServerUrl: incoming.ServerUrl,
            hasPreferredAlias: incoming.hasPreferredAlias,
            fromPreferredAlias: target?.PreferredAlias ?? null,
            toPreferredAlias: incoming.PreferredAlias,
            datasetDoisChanged,
            toDatasetDois: incoming.datasetDois,
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

      const serverUrlPreview = m.hasServerUrl
        ? ` | ServerUrl: ${m.fromServerUrl ?? "NULL"} -> ${
            m.toServerUrl ?? "NULL"
          }`
        : "";

      const datasetDoiPreview = m.datasetDoisChanged
        ? ` | Dataset DOIs -> ${m.toDatasetDois.join("; ") || "NONE"}`
        : "";

      const preferredAliasPreview = m.hasPreferredAlias
        ? ` | PreferredAlias: ${m.fromPreferredAlias ?? "NULL"} -> ${
            m.toPreferredAlias ?? "NULL"
          }`
        : "";

      console.log(
        `${i + 1}. [${m.Accession}] id=${m.id ?? "NEW"} Sample: ${
          m.fromSample ?? "NULL"
        } -> ${m.toSample ?? "NULL"} | Status: ${m.fromStatus} -> ${
          m.toStatus
        }${serverUrlPreview}${preferredAliasPreview}${datasetDoiPreview}`,
      );
    });
    if (plan.length > 15) console.log(`...and ${plan.length - 15} more`);

    if (isDryRun) {
      console.log("Dry run only. No changes written.");
      process.exit(0);
    }

    t = await db.sequelize.transaction();

    const summary = {
      created: 0,
      updated: 0,
      "resolved-placeholder": 0,
      removedPlaceholders: 0,
    };

    for (const { incoming } of plan) {
      const result = await reconcileSampleAccession({
        db,
        incoming,
        transaction: t,
        setDatasetDois,
      });
      summary[result.action] += 1;
      summary.removedPlaceholders += result.removedPlaceholders;
    }

    await t.commit();
    console.log(
      `${summary.created} created, ${summary.updated} updated, ` +
        `${summary["resolved-placeholder"]} placeholders resolved, ` +
        `${summary.removedPlaceholders} extra placeholders removed.`,
    );
    process.exit(0);
  } catch (err) {
    if (t) await t.rollback();
    console.error("Error updating sample accessions:", err);
    process.exit(1);
  }
})();
