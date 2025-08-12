const db = require("../models");
const logger = require("../middlewares/logger");

const mapAccessionToGenotypeIdHandler = async (req, res) => {
  try {
    const { Accessions } = req.body;

    if (!Accessions || Accessions.length === 0) {
      res.status(400).send({ message: "Accessions list is required" });
      logger.warn("Accession list was empty or not provided.");
      return;
    }

    // Find all SampleAccessions where the Accession is in the provided list and Status is "Completed"
    const sampleAccessions = await db.SampleAccession.findAll({
      where: {
        Accession: Accessions,
        Status: "Completed", // Only fetch accessions with status "Completed"
      },
    });

    if (sampleAccessions.length === 0) {
      res.status(404).send({
        message:
          "Mapping for given accessions not found or no completed accessions. Ensure accessions and samples are imported.",
      });
      logger.info(
        "No sample accessions found for the provided list or none are completed."
      );
      return;
    }

    // Map the results to an array of sample names
    const samples = sampleAccessions.map((sa) => ({
      Accession: sa.Accession,
      Sample: sa.Sample,
    }));

    res.status(200).send({ Samples: samples });
    logger.info(
      `Accessions mapped successfully for request: ${JSON.stringify(req.body)}`
    );
  } catch (error) {
    logger.error("Error fetching samples:", error);
    res.status(500).send({ message: "Internal server error" });
  }
};

module.exports = mapAccessionToGenotypeIdHandler;
