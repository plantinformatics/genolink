const express = require("express");
const router = express.Router();
const axios = require("axios");
const config = require("../config/appConfig");
const logger = require("../middlewares/logger");
const generateGenesysToken = require("../utils/generateGenesysToken");
const sampleNameToAccession = require("../utils/sampleNameToAccession");


let cachedToken = null;

const getToken = async () => {
  try {
    const token = await generateGenesysToken();
    return token;
  } catch (error) {
    console.error("Failed to get token:", error.message);
  }
};

const getCachedToken = async () => {
  if (!cachedToken) {
    cachedToken = await getToken();
  }
  return cachedToken;
};

///////////////////////////////////////////////////////////////////////////////////////////////////
router.post("/accession/filters", async (req, res) => {
  let url = `${config.genesysServer}/api/v1/acn/filter`;

  const queryParams = [];

  if (req.query.p) queryParams.push(`p=${req.query.p}`);
  if (req.query.l) queryParams.push(`l=${req.query.l}`);
  if (req.query.s) queryParams.push(`s=${req.query.s}`);
  if (req.query.d) queryParams.push(`d=${req.query.d}`);
  if (req.query.f) queryParams.push(`d=${req.query.f}`);

  if (queryParams.length > 0) {
    url += `?${queryParams.join("&")}`;
  }

  const sendRequestWithRetry = async () => {
    try {
      const token = await getCachedToken();
      const header = {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          Accept: "application/json, text/plain, */*",
          Origin: config.genolinkServer,
        },
      };

      // Attempt the request
      return await axios.post(url, req.body, header);
    } catch (error) {
      if (error.response && error.response.status === 401) {
        // If token is invalid, fetch a new token and retry
        cachedToken = await getToken(); // Refresh token
        const header = {
          headers: {
            Authorization: `Bearer ${cachedToken}`,
            "Content-Type": "application/json",
            Accept: "application/json, text/plain, */*",
            Origin: config.genolinkServer,
          },
        };
        return await axios.post(url, req.body, header); // Retry with new token
      }
      throw error; // Rethrow other errors
    }
  };

  try {
    const response = await sendRequestWithRetry();
    res.send(response.data);
  } catch (error) {
    logger.error(`API Error in /accession/filters: ${error}`);
    res.status(500).send("API request failed: " + error.message);
  }
});
///////////////////////////////////////////////////////////////////////////////////////////////////
router.post("/accession/query", async (req, res) => {
  try {
    let body = req.body
    const { genotypeIds } = body;
    if (Array.isArray(genotypeIds) && genotypeIds.length > 0) {
      body = {
        ...body,
        accessionNumbers: [
          ...(body.accessionNumbers || []),
          ...genotypeIds.map(Id => sampleNameToAccession(Id))
        ]
      };
    } else if (!genotypeIds && body.accessionNumbers) {
      body = {
        ...body,
        accessionNumbers: [...(body.accessionNumbers || [])]
      };
    } else {
      throw new Error('Either genotypeIds or accessionNumbers must be provided.');
    }

    const queryParams = [];

    if (req.query.p) queryParams.push(`p=${req.query.p}`);
    if (req.query.l) queryParams.push(`l=${req.query.l}`);
    if (req.query.s) queryParams.push(`s=${req.query.s}`);
    if (req.query.d) queryParams.push(`d=${req.query.d}`);
    if (req.query.f) queryParams.push(`d=${req.query.f}`);
    if (req.query.select) queryParams.push(`select=${req.query.select}`);
    else {
      queryParams.push("select=instituteCode,accessionNumber,institute.fullName,taxonomy.taxonName,cropName,countryOfOrigin.name,lastModifiedDate,acquisitionDate,doi,institute.id,accessionName,institute.owner.name,genus,taxonomy.grinTaxonomySpecies.speciesName,taxonomy.grinTaxonomySpecies.name,crop.name,taxonomy.grinTaxonomySpecies.id,taxonomy.grinTaxonomySpecies.name,uuid,institute.owner.lastModifiedDate,institute.owner.createdDate,aliases")
    }

    let url = `${config.genesysServer}/api/v1/acn/query`;

    if (queryParams.length > 0) {
      url += `?${queryParams.join("&")}`;
    }
    const sendRequestWithRetry = async () => {
      try {
        const token = await getCachedToken();
        const header = {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
            Accept: "application/json, text/plain, */*",
            Origin: config.genolinkServer,
          },
        };

        return await axios.post(url, body, header);
      } catch (error) {
        if (error.response && error.response.status === 401) {
          cachedToken = await getToken();
          const header = {
            headers: {
              Authorization: `Bearer ${cachedToken}`,
              "Content-Type": "application/json",
              Accept: "application/json, text/plain, */*",
              Origin: config.genolinkServer,
            },
          };
          return await axios.post(url, body, header);
        }
        throw error;
      }
    };

    const response = await sendRequestWithRetry();
    res.send(response.data);
  } catch (error) {
    logger.error(`API Error in /accession/query: ${error}`);
    res.status(500).send("API request failed: " + error);
  }
});

module.exports = router;
