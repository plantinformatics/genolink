const express = require('express');
const router = express.Router();
const multer = require('multer');
const upload = multer({ dest: "uploads/" });
const db = require("../models");

const createSampleAccessionsHandler = require('../utils/createSampleAccessionsHandler');
const accessionMappingHandler = require('../utils/accessionMappingHandler');

router.post(
  "/createSampleAccessions",
  upload.single("file"),
  createSampleAccessionsHandler
);

router.post("/accessionMapping", accessionMappingHandler);

router.get("/getAllAccessions", async (req, res) => {
  try {

    const totalAccessions = await db.SampleAccession.count();

    const sampleAccessions = await db.SampleAccession.findAll({
      attributes: ['Accession'], 
    });
    const accessions = sampleAccessions.map(sa =>
      sa.Accession
    );

    res.status(200).send({ genotypedAccessions: accessions, totalAccessions });
    logger.info("Fetched all accessions successfully.");
  } catch (error) {
    logger.error("Error fetching all accessions:", error);
    res.status(500).send({ message: "Internal server error" });
  }
});

module.exports = router;

