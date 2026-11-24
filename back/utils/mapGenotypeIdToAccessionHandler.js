const db = require("../models");
const logger = require("../middlewares/logger");

const normalizeGenotypeIds = (genotypeIds) =>
  genotypeIds.map((value) => value.replace(/"/g, ""));

const findGenotypeIdToAccessionMappings = async (genotypeIds) =>
  db.SampleAccession.findAll({
    attributes: ["Accession", "Sample"],
    where: {
      Sample: normalizeGenotypeIds(genotypeIds),
    },
    raw: true,
  });

const mapGenotypeIdToAccessionHandler = async (req, res) => {
  try {
    const { genotypeIds } = req.body;

    if (!Array.isArray(genotypeIds) || genotypeIds.length === 0) {
      res.status(400).send({ message: "genotypeId list is required" });
      logger.warn("genotypeId list was empty or not provided.");
      return;
    }

    const sampleAccessions =
      await findGenotypeIdToAccessionMappings(genotypeIds);

    if (sampleAccessions.length === 0) {
      res.status(404).send({
        message: "Mapping for given genotypeIds not found.",
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

module.exports = mapGenotypeIdToAccessionHandler;
module.exports.findGenotypeIdToAccessionMappings =
  findGenotypeIdToAccessionMappings;
