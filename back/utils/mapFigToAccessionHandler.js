const db = require("../models");
const logger = require("../middlewares/logger");

const mapFigToAccessionHandler = async (req, res) => {
  try {
    let { figs } = req.body;
    if (!figs) {
      res.status(400).send({ message: "Fig name(s) are required." });
      logger.warn("Fig input was empty or not provided.");
      return;
    }

    if (typeof figs === "string") {
      figs = [figs];
    }

    if (!Array.isArray(figs) || figs.length === 0) {
      res.status(400).send({ message: "A list of fig names is required." });
      logger.warn("Fig list is not an array or is empty.");
      return;
    }

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

    const linkRecords = await db.FigAccessionLink.findAll({
      where: {
        fig_id: figIds,
      },
      attributes: ["accession_id"],
      group: ["accession_id"],
    });

    if (linkRecords.length === 0) {
      res
        .status(404)
        .send({ message: "No accessions linked to provided figs." });
      logger.info("No accessions linked to provided fig IDs.");
      return;
    }

    const accessions = linkRecords.map((rec) => rec.accession_id);

    res.status(200).send(accessions);
  } catch (error) {
    logger.error("Error fetching accessions by fig:", error);
    res.status(500).send({ message: "Internal server error" });
  }
};

module.exports = mapFigToAccessionHandler;
