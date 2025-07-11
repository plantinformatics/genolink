const db = require("../models");
const logger = require("../middlewares/logger");

const figMappingHandler = async (req, res) => {
  try {
    const { figs } = req.body;

    if (!figs || !Array.isArray(figs) || figs.length === 0) {
      res.status(400).send({ message: "A list of fig names is required." });
      logger.warn("fig list was empty or not provided.");
      return;
    }

    // Step 1: Get matching fig records
    const figRecords = await db.Fig.findAll({
      where: {
        fig_name: figs,
      },
      attributes: ["id"],
    });

    if (figRecords.length === 0) {
      res.status(404).send({ message: "No matching figs found." });
      logger.info("No fig records found for provided fig names.");
      return;
    }

    const figIds = figRecords.map((fig) => fig.id);

    // Step 2: Get accessions linked to these fig IDs
    const linkRecords = await db.FigAccessionLink.findAll({
      where: {
        fig_id: figIds,
      },
      attributes: ["accession_id"],
      group: ["accession_id"], // to avoid duplicates
    });

    if (linkRecords.length === 0) {
      res
        .status(404)
        .send({ message: "No accessions linked to provided figs." });
      logger.info("No accessions linked to provided fig IDs.");
      return;
    }

    const accessions = linkRecords.map((rec) => rec.accession_id);

    // Step 3: Return unique accessions
    res.status(200).send(accessions);
  } catch (error) {
    logger.error("Error fetching accessions by fig:", error);
    res.status(500).send({ message: "Internal server error" });
  }
};

module.exports = figMappingHandler;
