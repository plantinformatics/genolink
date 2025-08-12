const fs = require("fs");
const csvParser = require("csv-parser");
const db = require("../models");

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

        if (!accession) {
          console.warn("Skipped row with missing accession:", data);
          return;
        }

        if (!VALID_STATUSES.includes(status)) {
          console.warn(
            `Invalid status "${status}" for accession ${accession}. Skipped.`
          );
          return;
        }

        sampleAccessions.push({
          Accession: accession,
          Sample: sample,
          Status: status,
        });
      })
      .on("end", () => resolve(sampleAccessions))
      .on("error", reject);
  });
};

(async () => {
  try {
    await db.sequelize.authenticate();

    const sampleAccessions = await parseCSV(csvFilePath);

    if (sampleAccessions.length === 0) {
      console.log("No valid entries found.");
      return;
    }

    const created = await db.SampleAccession.bulkCreate(sampleAccessions, {
      ignoreDuplicates: true,
    });

    console.log(`${created.length} sample accessions inserted.`);
    process.exit(0);
  } catch (err) {
    console.error("Error inserting sample accessions:", err);
    process.exit(1);
  }
})();
