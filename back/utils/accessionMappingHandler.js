const db = require("../models"); // Adjust this path to where your Sequelize models are initialized
const logger = require("../middlewares/logger"); // Assuming logger is in the 'middlewares' directory

const accessionMappingHandler = async (req, res) => {
  try {
    const { Accessions } = req.body; // Expecting an array of accessions

    if (!Accessions || Accessions.length === 0) {
      res.status(400).send({ message: "Accessions list is required" });
      logger.warn("Accession list was empty or not provided.");
      return;
    }

    // Find all SampleAccessions where the Accession is in the provided list
    const sampleAccessions = await db.SampleAccession.findAll({
      where: {
        Accession: Accessions,
      },
    });

    if (sampleAccessions.length === 0) {
      res
        .status(404)
        .send({
          message:
            "Mapping for given accessions not found. Ensure accessions and samples are imported.",
        });
      logger.info("No sample accessions found for the provided list.");
      return;
    }

    // Map the results to an array of sample names
    const samples = sampleAccessions.map((sa) => ({
      Accession: sa.Accession,
      Sample: sa.Sample,
    }));
    res.status(200).send({ Samples: samples });
    logger.info(`Accessions mapped successfully for request: ${JSON.stringify(req.body)}`);
  } catch (error) {
    logger.error("Error fetching samples:", error);
    res.status(500).send({ message: "Internal server error" });
  }
};

module.exports = accessionMappingHandler;
