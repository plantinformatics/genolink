const express = require("express");
const router = express.Router();
const db = require("../models");
const logger = require("../middlewares/logger");
const { Op } = require("sequelize");
// const { Parser } = require("json2csv");

// const accessionMappingHandler = require("../utils/accessionMappingHandler");
const mapAccessionToGenotypeIdHandler = require("../utils/mapAccessionToGenotypeIdHandler");
// const genotypeIdMappingHandler = require("../utils/genotypeIdMappingHandler");
const mapGenotypeIdToAccessionHandler = require("../utils/mapGenotypeIdToAccessionHandler");
const datasetDoiHandler = require("../utils/datasetDoiHandler");

// router.post("/accessionMapping", accessionMappingHandler);
router.post("/mapAccessionToGenotypeId", mapAccessionToGenotypeIdHandler);

// router.post("/genotypIdMapping", genotypeIdMappingHandler);
router.post("/mapGenotypIdToAccession", mapGenotypeIdToAccessionHandler);

router.post("/accession-dataset-info", datasetDoiHandler);

// router.get("/getAllAccessionsCsv", async (req, res) => {
//   try {
//     const accessionsWithSamples = await db.SampleAccession.findAll({
//       attributes: ["Accession", "Sample"],
//       raw: true,
//     });

//     if (!accessionsWithSamples || accessionsWithSamples.length === 0) {
//       return res.status(404).send("No data found.");
//     }

//     const json2csvParser = new Parser({ fields: ["Accession", "Sample"] });
//     const csv = json2csvParser.parse(accessionsWithSamples);

//     res.header("Content-Type", "text/csv");
//     res.attachment("sample_accessions.csv");
//     res.status(200).send(csv);
//     logger.info("Exported Sample ↔ Accession data as CSV successfully.");
//   } catch (error) {
//     logger.error("Error exporting Sample ↔ Accession CSV:", error);
//     res.status(500).send({ message: "Internal server error" });
//   }
// });

// router.get("/getAllAccessions", async (req, res) => {
//   try {
//     const totalAccessions = await db.SampleAccession.count();

//     const accessionsWithSamples = await db.SampleAccession.findAll({
//       attributes: ["Accession", "Sample"], // Include Sample alongside Accession
//     });

//     const accessions = accessionsWithSamples.map((sa) => sa.Accession);
//     const samples = accessionsWithSamples.map((sa) => sa.Sample);

//     res.status(200).send({
//       genotypedAccessions: accessions,
//       samples,
//       totalAccessions,
//     });
//     logger.info("Fetched all accessions and samples successfully.");
//   } catch (error) {
//     logger.error("Error fetching all accessions and samples:", error);
//     res.status(500).send({ message: "Internal server error" });
//   }
// });

router.get("/getGenotypeStatus", async (req, res) => {
  try {
    const rows = await db.SampleAccession.findAll({
      attributes: ["Accession", "Sample", "Status", "ServerUrl"],
      raw: true,
    });

    res.status(200).json({ rows });

    logger.info(
      "Fetched all accessions, samples, statuses, and server URLs successfully.",
    );
  } catch (error) {
    logger.error("Error fetching accessions:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

router.post("/getGenotypeStatusByAccessions", async (req, res) => {
  try {
    const { accessions } = req.body ?? {};

    if (!Array.isArray(accessions) || accessions.length === 0) {
      return res.status(400).json({
        message: "Body must include a non-empty 'accessions' array.",
      });
    }

    const cleaned = [
      ...new Set(
        accessions
          .filter((x) => typeof x === "string")
          .map((s) => s.trim())
          .filter(Boolean),
      ),
    ];

    if (cleaned.length === 0) {
      return res.status(400).json({
        message: "No valid accession strings provided.",
      });
    }

    const CHUNK_SIZE = 1000;
    const chunks = [];
    for (let i = 0; i < cleaned.length; i += CHUNK_SIZE) {
      chunks.push(cleaned.slice(i, i + CHUNK_SIZE));
    }

    const results = [];
    for (const chunk of chunks) {
      const rows = await db.SampleAccession.findAll({
        attributes: ["Accession", "Status"],
        where: { Accession: { [Op.in]: chunk } },
        raw: true,
      });
      results.push(...rows);
    }

    const statusByAccession = new Map(
      results.map((r) => [r.Accession, r.Status]),
    );
    const rows = cleaned.map((acc) => ({
      accession: acc,
      status: statusByAccession.has(acc) ? statusByAccession.get(acc) : null,
    }));

    res.status(200).json({ rows });
    logger.info(
      `Fetched statuses for ${cleaned.length} accessions (found ${results.length}).`,
    );
  } catch (error) {
    logger.error("Error fetching genotype statuses by accessions:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

module.exports = router;
