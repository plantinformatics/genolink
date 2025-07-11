const fs = require("fs");
const csvParser = require("csv-parser");
const db = require("../models");

// Get file path from command line argument
const csvFilePath = process.argv[2];

if (!csvFilePath) {
  console.error("Please provide the path to the CSV file.");
  console.error("Usage: node scripts/uploadSampleAccessions.js <path-to-csv>");
  process.exit(1);
}

// Utility function to clean unwanted characters
const cleanText = (text) => {
  return text
    ?.replace(/^\uFEFF/, "") // Remove BOM
    .replace(/[\u200B\u00A0]/g, "") // Remove zero-width & non-breaking spaces
    .replace(/\s+/g, " ") // Collapse multiple spaces
    .trim();
};

const parseCSV = (filePath) => {
  return new Promise((resolve, reject) => {
    const sampleAccessions = [];
    fs.createReadStream(filePath)
      .pipe(csvParser())
      .on("data", (data) => {
        const record = {
          Accession: cleanText(data.accession),
          Sample: cleanText(data.sample),
        };
        if (record.Accession && record.Sample) {
          sampleAccessions.push(record);
        } else {
          console.warn("Skipped invalid row:", record);
        }
      })
      .on("end", () => resolve(sampleAccessions))
      .on("error", reject);
  });
};

(async () => {
  try {
    await db.sequelize.authenticate();
    console.log("DB connected.");

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
