const logger = require("../middlewares/logger");
const {
  resolvePreferredAliasesForAccessions,
} = require("./preferredAliasResolver");

async function preferredAliasHandler(req, res) {
  try {
    const { accessions } = req.body ?? {};

    if (!Array.isArray(accessions)) {
      return res.status(400).json({
        message: "Body must include an 'accessions' array.",
      });
    }

    const preferredAliases =
      await resolvePreferredAliasesForAccessions(accessions);

    res.status(200).json(preferredAliases);
  } catch (error) {
    logger.error("Error resolving preferred aliases:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}

module.exports = preferredAliasHandler;
