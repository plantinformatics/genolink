const db = require("../models");
const fs = require("fs");
const csvParser = require("csv-parser");
const logger = require("../middlewares/logger");

const createSampleAccessionsHandler = async (req, res) => {
  // Check if multer already encountered an error
  if (req.fileValidationError) {
    logger.error("File validation error:", req.fileValidationError);
    return res.status(400).send({ message: req.fileValidationError });
  }

  if (!req.file && !req.body.sampleAccessions) {
    logger.warn("No file uploaded and no sample accessions provided in body.");
    return res.status(400).send({
      message: "No file uploaded and no sample accessions provided in body.",
    });
  }

    // Check if the file is a CSV
    if (req.file && req.file.mimetype !== 'text/csv') {
      logger.error("Invalid file type:", req.file.mimetype);
      return res.status(400).send({ message: "Please upload a CSV file." });
    }

  try {
    if (req.file) {
      const sampleAccessions = [];
      fs.createReadStream(req.file.path)
        .pipe(csvParser())  // Simplified: Rely on default behavior for headers and delimiters.
        .on("data", (data) => {
          const record = {
            Accession: data.accession.trim(),  // Ensure property names match the CSV headers exactly.
            Sample: data.sample.trim()
          };
          if (record.Accession && record.Sample) {
            sampleAccessions.push(record);
          } else {
            logger.error("Invalid data entry skipped:", record);
          }
        })
        .on("end", async () => {
          try {
            const createdRecords = await db.SampleAccession.bulkCreate(
              sampleAccessions
            );
            return res.status(201).send(createdRecords);
          } catch (bulkCreateError) {
            logger.error(
              "Error during the bulk create operation:",
              bulkCreateError
            );
            return res
              .status(500)
              .send({ message: "Error during the bulk create operation." });
          }
        });
    } else if (req.body.sampleAccessions) {
      const { sampleAccessions } = req.body;

      if (sampleAccessions.length === 0) {
        logger.warn("A list of sample accessions is required.");
        return res
          .status(400)
          .send({ message: "A list of sample accessions is required" });
      }

      const isValid = sampleAccessions.every((sa) => sa.Accession && sa.Sample);
      if (!isValid) {
        logger.warn("Each item must have an Accession and a Sample.");
        return res
          .status(400)
          .send({ message: "Each item must have an Accession and a Sample" });
      }

      try {
        const createdRecords = await db.SampleAccession.bulkCreate(
          sampleAccessions
        );
        logger.info("Sample accessions provided in body created successfully.");
        res.status(201).send(createdRecords);
      } catch (bulkCreateError) {
        logger.error(
          "Error during the bulk create operation:",
          bulkCreateError
        );
        return res
          .status(500)
          .send({ message: "Error during the bulk create operation." });
      }
    }
  } catch (error) {
    logger.error("Error processing request:", error);
    if (error instanceof multer.MulterError) {
      // A Multer error occurred when uploading.
      logger.error(`Multer uploading error: ${error.message}`);
      return res
        .status(500)
        .send({ message: `Multer uploading error: ${error.message}` });
    } else {
      // An unknown error occurred when uploading.
      logger.error("Unknown server error occurred.");
      return res
        .status(500)
        .send({ message: "Unknown server error occurred." });
    }
  }
};

module.exports = createSampleAccessionsHandler;
