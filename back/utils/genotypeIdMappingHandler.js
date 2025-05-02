const db = require("../models");
const logger = require("../middlewares/logger");

const genotypeIdMappingHandler = async (req, res) => {
  try {
    const { genotypeIds } = req.body;

    if (!genotypeIds || genotypeIds.length === 0) {
      res.status(400).send({ message: "genotypeId list is required" });
      logger.warn("genotypeId list was empty or not provided.");
      return;
    }

    // Query the database to map genotypeIds to sample accessions
    const sampleAccessions = await db.SampleAccession.findAll({
      where: {
        Sample: genotypeIds,
      },
    });

    if (sampleAccessions.length === 0) {
      res.status(404).send({
        message:
          "Mapping for given genotypeIds not found. Ensure genotypeIds are imported.",
      });
      logger.info("No accessions found for the provided list.");
      return;
    }

    // Map the results to an array of accessions
    const accessions = sampleAccessions.map((sa) => sa.Accession);

    // Send the updated request body
    res.status(200).send(accessions);
  } catch (error) {
    logger.error("Error fetching samples:", error);
    res.status(500).send({ message: "Internal server error" });
  }
};

module.exports = genotypeIdMappingHandler;
