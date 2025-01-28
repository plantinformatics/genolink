const express = require("express");
const router = express.Router();
const axios = require("axios");
const generateGerminateToken = require("../utils/generateGerminateToken");
const checkCredentials = require("../middlewares/checkCredentials");
const config = require("../config/appConfig");
const logger = require("../middlewares/logger");

// list all callsets
///////////////////////////////////////////////////////////////////////////////////////////////////

router.post("/brapi/v2/callsets", checkCredentials, async (req, res) => {
  try {
    const token = await generateGerminateToken(req);
    const response = await axios.get(
      `${config.germinateServer}/api/brapi/v2/callsets`,
      {
        headers: {
          authorization: `Bearer ${token}`,
        },
      }
    );
    res.send(response.data);
  } catch (error) {
    logger.error(`API Error in /brapi/v2/callsets: ${error.message}`);
    res.status(500).send("API request failed: " + error);
  }
});

// list all datasets
///////////////////////////////////////////////////////////////////////////////////////////////////

router.post("/brapi/v2/variantsets", checkCredentials, async (req, res) => {
  try {
    const token = await generateGerminateToken(req);
    const response = await axios.get(
      `${config.germinateServer}/api/brapi/v2/variantsets`,
      {
        headers: {
          authorization: `Bearer ${token}`,
        },
      }
    );
    res.send(response.data);
  } catch (error) {
    logger.error(`API Error in /brapi/v2/variantsets: ${error.message}`);
    res.status(500).send("API request failed: " + error);
  }
});

// list all variants
///////////////////////////////////////////////////////////////////////////////////////////////////

router.post("/brapi/v2/variants", checkCredentials, async (req, res) => {
  try {
    const token = await generateGerminateToken(req);
    const response = await axios.get(
      `${config.germinateServer}/api/brapi/v2/variants`,
      {
        headers: {
          authorization: `Bearer ${token}`,
        },
      }
    );
    res.send(response.data);
  } catch (error) {
    logger.error(`API Error in /brapi/v2/variants: ${error.message}`);
    res.status(500).send("API request failed: " + error);
  }
});

// list all variants in a dataset
///////////////////////////////////////////////////////////////////////////////////////////////////

router.post(
  "/brapi/v2/variants/:variantSetDbId",
  checkCredentials,
  async (req, res) => {
    try {
      const token = await generateGerminateToken(req);
      const response = await axios.get(
        `${config.germinateServer}/api/brapi/v2/variants`,
        {
          headers: {
            authorization: `Bearer ${token}`,
          },
        }
      );

      response.data.result.data = response.data.result.data.filter(
        (variant) =>
          variant.variantDbId.split("-")[0] == req.params.variantSetDbId
      );

      res.send(response.data);
    } catch (error) {
      logger.error(
        `API Error in /brapi/v2/variants/:variantSetDbId: ${error.message}`
      );
      res.status(500).send("API request failed: " + error);
    }
  }
);

// list all calls for desire sample
///////////////////////////////////////////////////////////////////////////////////////////////////

router.post("/brapi/v2/callset/calls", checkCredentials, async (req, res) => {
  try {
    const token = await generateGerminateToken(req);
    const sampleObj = await axios
      .post(`${config.genolinkServer}/api/internalApi/accessionMapping`, {
        Accessions: req.body.accession,
      })
      .then((response) => response.data);
    const sampleName = sampleObj.Samples.map((obj) => obj.Sample);
    const desiredCallSetDbId = await axios
      .get(`${config.germinateServer}/api/brapi/v2/callsets`, {
        headers: {
          authorization: `Bearer ${token}`,
        },
      })
      .then((response) => {
        return response.data.result.data
          .filter((sample) => sample.callSetName == sampleName)
          .map((sample) => sample.callSetDbId)[0];
      });
    const response = await axios.get(
      `${config.germinateServer}/api/brapi/v2/callsets/${desiredCallSetDbId}/calls`,
      {
        headers: {
          authorization: `Bearer ${token}`,
        },
      }
    );
    res.send({ data: response.data, sample: sampleName });
  } catch (error) {
    logger.error(`API Error in /brapi/v2/callset/calls: ${error.message}`);
    res.status(500).send("API request failed: " + error);
  }
});

// list all calls for desire sample in specified specified positions and specified chromosomes
///////////////////////////////////////////////////////////////////////////////////////////////////

router.post(
  "/brapi/v2/callset/calls/chromosome/:chromosome/position/:positionStart/:positionEnd",
  checkCredentials,
  async (req, res) => {
    try {
      const token = await generateGerminateToken(req);
      const sampleObj = await axios
        .post(`${config.genolinkServer}/api/internalApi/accessionMapping`, {
          Accessions: req.body.accession,
        })
        .then((response) => response.data);
      const sampleName = sampleObj.Samples.map((obj) => obj.Sample);
      const desiredCallSetDbId = await axios
        .get(`${config.germinateServer}/api/brapi/v2/callsets`, {
          headers: {
            authorization: `Bearer ${token}`,
          },
        })
        .then(
          (response) =>
            response.data.result.data
              .filter((sample) => sampleName.includes(sample.callSetName))
              .map((sample) => sample.callSetDbId)[0]
        );

      const response = await axios.get(
        `${config.germinateServer}/api/brapi/v2/callsets/${desiredCallSetDbId}/calls/chromosome/${req.params.chromosome}/position/${req.params.positionStart}/${req.params.positionEnd}`,
        {
          headers: {
            authorization: `Bearer ${token}`,
          },
        }
      );
      res.send({ data: response.data, sample: sampleName });
    } catch (error) {
      logger.error(
        `API Error in /brapi/v2/callset/calls/chromosome/:chromosome/position/:positionStart/:positionEnd: ${error.message}`
      );
      res.status(500).send("API request failed: " + error);
    }
  }
);

// list all calls for desire sample in specified chromosome and specified positions
///////////////////////////////////////////////////////////////////////////////////////////////////

router.post(
  "/brapi/v2/callset/calls/position/:positionStart/:positionEnd",
  checkCredentials,
  async (req, res) => {
    try {
      const token = await generateGerminateToken(req);

      const sampleObj = await axios
        .post(`${config.genolinkServer}/api/internalApi/accessionMapping`, {
          Accessions: req.body.accession,
        })
        .then((response) => response.data);
      const sampleName = sampleObj.Samples.map((obj) => obj.Sample);

      const desiredCallSetDbId = await axios
        .get(`${config.germinateServer}/api/brapi/v2/callsets`, {
          headers: {
            authorization: `Bearer ${token}`,
          },
        })
        .then(
          (response) =>
            response.data.result.data
              .filter((sample) => sampleName.includes(sample.callSetName))
              .map((sample) => sample.callSetDbId)[0]
        );
      const response = await axios.get(
        `${config.germinateServer}/api/brapi/v2/callsets/${desiredCallSetDbId}/calls/position/${req.params.positionStart}/${req.params.positionEnd}`,
        {
          headers: {
            authorization: `Bearer ${token}`,
          },
        }
      );
      res.send({ data: response.data, sample: sampleName });
    } catch (error) {
      logger.error(
        `API Error in /brapi/v2/callset/calls/position/:positionStart/:positionEnd: ${error.message}`
      );
      res.status(500).send("API request failed: " + error);
    }
  }
);

// list all calls for desire sample in specified chromosome
///////////////////////////////////////////////////////////////////////////////////////////////////

router.post(
  "/brapi/v2/callset/calls/chromosome/:chromosome",
  checkCredentials,
  async (req, res) => {
    try {
      const token = await generateGerminateToken(req);
      const sampleObj = await axios
        .post(`${config.genolinkServer}/api/internalApi/accessionMapping`, {
          Accessions: req.body.accession,
        })
        .then((response) => response.data);
      const sampleName = sampleObj.Samples.map((obj) => obj.Sample);
      const desiredCallSetDbId = await axios
        .get(`${config.germinateServer}/api/brapi/v2/callsets`, {
          headers: {
            authorization: `Bearer ${token}`,
          },
        })
        .then(
          (response) =>
            response.data.result.data
              .filter((sample) => sampleName.includes(sample.callSetName))
              .map((sample) => sample.callSetDbId)[0]
        );

      const response = await axios.get(
        `${config.germinateServer}/api/brapi/v2/callsets/${desiredCallSetDbId}/calls/chromosome/${req.params.chromosome}`,
        {
          headers: {
            authorization: `Bearer ${token}`,
          },
        }
      );
      res.send({ data: response.data, sample: sampleName });
    } catch (error) {
      logger.error(
        `API Error in /brapi/v2/callset/calls/chromosome/:chromosome: ${error.message}`
      );
      res.status(500).send("API request failed: " + error);
    }
  }
);

// list all calls for desire sample
///////////////////////////////////////////////////////////////////////////////////////////////////

router.post(
  "/brapi/v2/callset/calls/mapid/:mapid",
  checkCredentials,
  async (req, res) => {
    try {
      const token = await generateGerminateToken(req);

      const sampleObj = await axios
        .post(`${config.genolinkServer}/api/internalApi/accessionMapping`, {
          Accessions: req.body.accession,
        })
        .then((response) => response.data);
      const sampleName = sampleObj.Samples.map((obj) => obj.Sample);
      const desiredCallSetDbId = await axios
        .get(`${config.germinateServer}/api/brapi/v2/callsets`, {
          headers: {
            authorization: `Bearer ${token}`,
          },
        })
        .then(
          (response) =>
            response.data.result.data
              .filter((sample) => sampleName.includes(sample.callSetName))
              .map((sample) => sample.callSetDbId)[0]
        );

      const response = await axios.get(
        `${config.germinateServer}/api/brapi/v2/callsets/${desiredCallSetDbId}/calls/mapid/${req.params.mapid}`,
        {
          headers: {
            authorization: `Bearer ${token}`,
          },
        }
      );
      res.send({ data: response.data, sample: sampleName });
    } catch (error) {
      logger.error(`API Error in /brapi/v2/callset/calls/mapid/:mapid: ${error.message}`);
      res.status(500).send("API request failed: " + error);
    }
  }
);

// list all CHROMs
///////////////////////////////////////////////////////////////////////////////////////////////////

router.post(
  "/brapi/v2/maps/:mapid/linkagegroups",
  checkCredentials,
  async (req, res) => {
    try {
      const token = await generateGerminateToken(req);
      const response = await axios.get(
        `${config.germinateServer}/api/brapi/v2/maps/${req.params.mapid}/linkagegroups`,
        {
          headers: {
            authorization: `Bearer ${token}`,
          },
        }
      );
      res.send(response.data);
    } catch (error) {
      logger.error(`API Error in /brapi/v2/maps/:mapid/linkagegroups: ${error.message}`);
      res.status(500).send("API request failed: " + error);
    }
  }
);

// list all maps
///////////////////////////////////////////////////////////////////////////////////////////////////

router.post("/brapi/v2/maps", checkCredentials, async (req, res) => {
  try {
    const token = await generateGerminateToken(req);
    const response = await axios.get(
      `${config.germinateServer}/api/brapi/v2/maps`,
      {
        headers: {
          authorization: `Bearer ${token}`,
        },
      }
    );
    res.send(response.data);
  } catch (error) {
    logger.error(`API Error in /brapi/v2/maps: ${error.message}`);
    res.status(500).send("API request failed: " + error);
  }
});

router.post('/brapi/v2/callsets/chromosomes', async (req, res) => {
  try {
    const token = await generateGerminateToken(req);

    const sampleObj = await axios
      .post(`${config.genolinkServer}/api/internalApi/accessionMapping`, {
        Accessions: req.body.accession,
      })
      .then((response) => response.data);
    const sampleName = sampleObj.Samples.map((obj) => obj.Sample);

    const desiredCallSetDbId = await axios
      .get(`${config.germinateServer}/api/brapi/v2/callsets`, {
        headers: {
          authorization: `Bearer ${token}`,
        },
      })
      .then(
        (response) =>
          response.data.result.data
            .filter((sample) => sampleName.includes(sample.callSetName))
            .map((sample) => sample.callSetDbId)[0]
      );
    const response = await axios.get(
      `${config.germinateServer}/api/brapi/v2/callsets/${desiredCallSetDbId}/chromosomes`,
      {
        headers: {
          authorization: `Bearer ${token}`,
        },
      }
    );
    res.send({ chromosomes: response.data});
  } catch (error) {
    logger.error(
      `API Error in /brapi/v2/callset/chromosomes: ${error.message}`
    );
    res.status(500).send("API request failed: " + error);
  }
}
)

module.exports = router;
