const express = require("express");
const router = express.Router();
const multer = require("multer");
const upload = multer({ dest: "uploads/" });
const db = require("../models");
const logger = require("../middlewares/logger");

const createSampleAccessionsHandler = require("../utils/createSampleAccessionsHandler");
const accessionMappingHandler = require("../utils/accessionMappingHandler");
const genotypeIdMappingHandler = require("../utils/genotypeIdMappingHandler");

router.post(
  "/createSampleAccessions",
  upload.single("file"),
  createSampleAccessionsHandler
);

router.post("/accessionMapping", accessionMappingHandler);

router.post("/genotypIdMapping", genotypeIdMappingHandler);

router.get("/getAllAccessions", async (req, res) => {
  try {
    const totalAccessions = await db.SampleAccession.count();

    const accessionsWithSamples = await db.SampleAccession.findAll({
      attributes: ["Accession", "Sample"], // Include Sample alongside Accession
    });

    const accessions = accessionsWithSamples.map((sa) => sa.Accession);
    const samples = accessionsWithSamples.map((sa) => sa.Sample);

    res.status(200).send({
      genotypedAccessions: accessions,
      samples,
      totalAccessions,
    });
    logger.info("Fetched all accessions and samples successfully.");
  } catch (error) {
    logger.error("Error fetching all accessions and samples:", error);
    res.status(500).send({ message: "Internal server error" });
  }
});

module.exports = router;
