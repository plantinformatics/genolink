const db = require("../models");
const logger = require("../middlewares/logger");

const normalizePreferredAliases = (preferredAliases) =>
  preferredAliases
    .filter((value) => typeof value === "string")
    .map((value) => value.replace(/"/g, "").trim())
    .filter(Boolean);

const findPreferredAliasToAccessionMappings = async (preferredAliases) =>
  db.SampleAccession.findAll({
    attributes: ["Accession", "PreferredAlias"],
    where: {
      PreferredAlias: normalizePreferredAliases(preferredAliases),
    },
    raw: true,
  });

const mapPreferredAliasToAccessionHandler = async (req, res) => {
  try {
    const { preferredAliases } = req.body;

    if (!Array.isArray(preferredAliases) || preferredAliases.length === 0) {
      res.status(400).send({ message: "preferredAlias list is required" });
      logger.warn("preferredAlias list was empty or not provided.");
      return;
    }

    const sampleAccessions =
      await findPreferredAliasToAccessionMappings(preferredAliases);

    if (sampleAccessions.length === 0) {
      res.status(404).send({
        message: "Mapping for given preferredAliases not found.",
      });
      logger.info("No accessions found for the provided preferred aliases.");
      return;
    }

    res.status(200).send([
      ...new Set(sampleAccessions.map((row) => row.Accession)),
    ]);
  } catch (error) {
    logger.error("Error fetching preferred aliases:", error);
    res.status(500).send({ message: "Internal server error" });
  }
};

module.exports = mapPreferredAliasToAccessionHandler;
module.exports.findPreferredAliasToAccessionMappings =
  findPreferredAliasToAccessionMappings;
