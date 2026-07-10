const logger = require("../middlewares/logger");
const {
  resolveDatasetInfoForAccessions,
} = require("./datasetDoiResolver");

async function datasetDoiHandler(req, res) {
  try {
    const { accessions } = req.body ?? {};

    if (!Array.isArray(accessions)) {
      return res.status(400).json({
        message: "Body must include an 'accessions' array.",
      });
    }

    const cleaned = [
      ...new Set(
        accessions
          .filter((accession) => typeof accession === "string")
          .map((accession) => accession.trim())
          .filter(Boolean),
      ),
    ];

    const datasetInfoByAccession = resolveDatasetInfoForAccessions(cleaned);

    res.status(200).json(datasetInfoByAccession);
    logger.info(
      `Resolved dataset DOI metadata for ${cleaned.length} accessions.`,
    );
  } catch (error) {
    logger.error("Error resolving dataset DOI metadata:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}

module.exports = datasetDoiHandler;
