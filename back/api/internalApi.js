const express = require("express");
const router = express.Router();
const db = require("../models");
const logger = require("../middlewares/logger");
const { Parser } = require("json2csv");

const accessionMappingHandler = require("../utils/accessionMappingHandler");
const genotypeIdMappingHandler = require("../utils/genotypeIdMappingHandler");
const figMappingHandler = require("../utils/figMappingHandler");

router.post("/accessionMapping", accessionMappingHandler);

router.post("/genotypIdMapping", genotypeIdMappingHandler);

router.post("/figMapping", figMappingHandler);

router.get("/getAllAccessionsCsv", async (req, res) => {
  try {
    const accessionsWithSamples = await db.SampleAccession.findAll({
      attributes: ["Accession", "Sample"],
      raw: true,
    });

    if (!accessionsWithSamples || accessionsWithSamples.length === 0) {
      return res.status(404).send("No data found.");
    }

    const json2csvParser = new Parser({ fields: ["Accession", "Sample"] });
    const csv = json2csvParser.parse(accessionsWithSamples);

    res.header("Content-Type", "text/csv");
    res.attachment("sample_accessions.csv");
    res.status(200).send(csv);
    logger.info("Exported Sample ↔ Accession data as CSV successfully.");
  } catch (error) {
    logger.error("Error exporting Sample ↔ Accession CSV:", error);
    res.status(500).send({ message: "Internal server error" });
  }
});

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

router.get("/getAllFigs", async (req, res) => {
  try {
    const figRecords = await db.Fig.findAll({
      attributes: ["fig_name"],
      order: [["fig_name", "ASC"]],
    });

    const figs = figRecords.map((fig) => fig.fig_name);

    res.status(200).send({ figs });
    logger.info("Fetched all fig names successfully.");
  } catch (error) {
    logger.error("Error fetching fig names:", error);
    res.status(500).send({ message: "Internal server error" });
  }
});

router.post("/getFigsByAccessions", async (req, res) => {
  try {
    const { accessionIds } = req.body;

    if (
      !accessionIds ||
      !Array.isArray(accessionIds) ||
      accessionIds.length === 0
    ) {
      return res
        .status(400)
        .send({ message: "A list of accession IDs is required." });
    }

    const links = await db.FigAccessionLink.findAll({
      where: { accession_id: accessionIds },
      attributes: ["accession_id", "fig_id"],
    });

    if (links.length === 0) {
      return res.status(200).send({});
    }

    const figIds = [...new Set(links.map((link) => link.fig_id))];

    const figs = await db.Fig.findAll({
      where: { id: figIds },
      attributes: ["id", "fig_name"],
    });

    const figMap = {};
    figs.forEach((fig) => {
      figMap[fig.id] = fig.fig_name;
    });

    const result = {};
    links.forEach((link) => {
      if (!result[link.accession_id]) {
        result[link.accession_id] = [];
      }
      result[link.accession_id].push(figMap[link.fig_id]);
    });

    res.status(200).send(result);
    logger.info("Fetched figs for provided accession IDs successfully.");
  } catch (error) {
    logger.error("Error fetching figs by accession IDs:", error);
    res.status(500).send({ message: "Internal server error" });
  }
});

module.exports = router;
