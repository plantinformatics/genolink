const fs = require("fs");
const csvParser = require("csv-parser");
const db = require("../models");

// Get path to the CSV file from command-line args
const csvFilePath = process.argv[2];
if (!csvFilePath) {
  console.error("Please provide the path to the CSV file.");
  console.error("Usage: node scripts/uploadAccessionFigs.js <path-to-csv>");
  process.exit(1);
}

// Step 1: Parse CSV and collect staging data
const parseCSV = (filePath) => {
  return new Promise((resolve, reject) => {
    const staging = [];
    fs.createReadStream(filePath)
      .pipe(csvParser())
      .on("data", (data) => {
        const accession = data.accession?.trim();
        const figName = data.fig?.trim();
        if (accession && figName) {
          staging.push({ accession, figName });
        } else {
          console.warn("Skipped invalid row:", data);
        }
      })
      .on("end", () => resolve(staging))
      .on("error", reject);
  });
};

(async () => {
  try {
    await db.sequelize.authenticate();
    console.log("Database connected");

    // Step 2: Parse the file
    const stagingData = await parseCSV(csvFilePath);
    if (stagingData.length === 0) {
      console.log("No valid rows found in the CSV.");
      process.exit(0);
    }

    // Step 3: Find unique fig names from CSV
    const uniqueFigs = [...new Set(stagingData.map((row) => row.figName))];

    // Step 4: Find existing figs in DB
    const existingFigs = await db.Fig.findAll({
      where: { fig_name: uniqueFigs },
    });

    const existingFigMap = {};
    existingFigs.forEach((fig) => {
      existingFigMap[fig.fig_name] = fig.id;
    });

    // Step 5: Find and insert new figs
    const newFigs = uniqueFigs.filter((name) => !existingFigMap[name]);

    const newFigRecords = await db.Fig.bulkCreate(
      newFigs.map((name) => ({ fig_name: name })),
      { returning: true }
    );

    newFigRecords.forEach((fig) => {
      existingFigMap[fig.fig_name] = fig.id;
    });

    // Step 6: Enrich staging with fig_id
    const finalStaging = stagingData.map((row) => ({
      accession_id: row.accession,
      fig_id: existingFigMap[row.figName],
    }));

    // Step 7: Deduplicate (check if already in DB)
    const existingLinks = await db.FigAccessionLink.findAll({
      where: {
        [db.Sequelize.Op.or]: finalStaging.map((row) => ({
          accession_id: row.accession_id,
          fig_id: row.fig_id,
        })),
      },
    });

    const existingLinkSet = new Set(
      existingLinks.map((link) => `${link.accession_id}-${link.fig_id}`)
    );

    const toInsert = finalStaging.filter(
      (row) => !existingLinkSet.has(`${row.accession_id}-${row.fig_id}`)
    );

    // Step 8: Insert new links
    if (toInsert.length === 0) {
      console.log("No new accession-fig links to insert.");
    } else {
      const created = await db.FigAccessionLink.bulkCreate(toInsert);
      console.log(`Inserted ${created.length} new accession-fig links.`);
    }

    process.exit(0);
  } catch (err) {
    console.error("Error:", err);
    process.exit(1);
  }
})();
