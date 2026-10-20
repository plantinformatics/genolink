const fs = require("fs");

const csvParser = require("csv-parser");

const db = require("../models");
const {
  parseDatasetDois,
  setDatasetDois,
} = require("../utils/datasetDoiCsv");
const {
  reconcileSampleAccession,
} = require("../utils/reconcileSampleAccession");
const { parsePreferredAlias } = require("../utils/preferredAliasCsv");

const csvFilePath = process.argv[2];

if (!csvFilePath) {
  console.error("Please provide the path to the CSV file.");
  console.error("Usage: node scripts/uploadSampleAccessions.js <path-to-csv>");
  process.exit(1);
}

const VALID_STATUSES = ["Completed", "Pending", "Excluded", "TBC"];

const parseCSV = (filePath) => {
  return new Promise((resolve, reject) => {
    const sampleAccessions = [];

    fs.createReadStream(filePath)
      .pipe(csvParser())
      .on("data", (data) => {
        const accession = data.accession?.trim();
        const sample = data.sample?.trim() || null;
        const status = data.status?.trim();
        const hasServerUrl = Object.prototype.hasOwnProperty.call(
          data,
          "serverUrl",
        );
        const serverUrl = hasServerUrl ? data.serverUrl?.trim() || null : null;
        const { supplied: hasDatasetDois, dois: datasetDois } =
          parseDatasetDois(data);
        const { supplied: hasPreferredAlias, value: preferredAlias } =
          parsePreferredAlias(data);

        if (!accession) {
          console.warn("Skipped row with missing accession:", data);
          return;
        }

        if (!VALID_STATUSES.includes(status)) {
          console.warn(
            `Invalid status "${status}" for accession ${accession}. Skipped.`,
          );
          return;
        }

        sampleAccessions.push({
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
      .on("end", () => resolve(sampleAccessions))
      .on("error", reject);
  });
};

(async () => {
  let transaction;
  try {
    await db.sequelize.authenticate();

    const sampleAccessions = await parseCSV(csvFilePath);

    if (sampleAccessions.length === 0) {
      console.log("No valid entries found.");
      return;
    }

    transaction = await db.sequelize.transaction();
    const summary = {
      created: 0,
      updated: 0,
      "resolved-placeholder": 0,
      removedPlaceholders: 0,
    };

    for (const row of sampleAccessions) {
      const result = await reconcileSampleAccession({
        db,
        incoming: row,
        transaction,
        setDatasetDois,
      });
      summary[result.action] += 1;
      summary.removedPlaceholders += result.removedPlaceholders;
    }

    await transaction.commit();

    console.log(
      `${summary.created} created, ${summary.updated} updated, ` +
        `${summary["resolved-placeholder"]} placeholders resolved, ` +
        `${summary.removedPlaceholders} extra placeholders removed.`,
    );
    process.exit(0);
  } catch (err) {
    if (transaction) await transaction.rollback();
    console.error("Error inserting sample accessions:", err);
    process.exit(1);
  }
})();
