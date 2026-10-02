const fs = require("fs");

const csvParser = require("csv-parser");

const db = require("../models");
const {
  parseDatasetDois,
  setDatasetDois,
} = require("../utils/datasetDoiCsv");

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
        const serverUrl = data.serverUrl?.trim() || null;
        const { supplied: hasDatasetDois, dois: datasetDois } =
          parseDatasetDois(data);

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
          ServerUrl: serverUrl,
          hasDatasetDois,
          datasetDois,
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
    let inserted = 0;

    for (const row of sampleAccessions) {
      const { hasDatasetDois, datasetDois, ...values } = row;
      const [sampleAccession, created] = await db.SampleAccession.findOrCreate({
        where: { Accession: values.Accession, Sample: values.Sample },
        defaults: values,
        transaction,
      });

      if (created) inserted += 1;
      if (hasDatasetDois) {
        await setDatasetDois(db, sampleAccession, datasetDois, transaction);
      }
    }

    await transaction.commit();

    console.log(`${inserted} sample accessions inserted.`);
    process.exit(0);
  } catch (err) {
    if (transaction) await transaction.rollback();
    console.error("Error inserting sample accessions:", err);
    process.exit(1);
  }
})();
