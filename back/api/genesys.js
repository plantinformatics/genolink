const express = require("express");
const router = express.Router();
const axios = require("axios");
const config = require("../config/appConfig");
const logger = require("../middlewares/logger");
const generateGenesysToken = require("../utils/generateGenesysToken");

const getToken = async () => {
  try {
      const token = await generateGenesysToken();
      return token;
  } catch (error) {
      console.error("Failed to get token:", error.message);
  }
};


///////////////////////////////////////////////////////////////////////////////////////////////////
router.post("/accession/filters", async (req, res) => {
  let url = `${config.genesysServer}/api/v1/acn/filter`;

  const token = await getToken();

  const queryParams = [];

  if (req.query.p) queryParams.push(`p=${req.query.p}`);
  if (req.query.l) queryParams.push(`l=${req.query.l}`);
  if (req.query.s) queryParams.push(`s=${req.query.s}`);
  if (req.query.d) queryParams.push(`d=${req.query.d}`);
  if (req.query.f) queryParams.push(`d=${req.query.f}`);

  if (queryParams.length > 0) {
    url += `?${queryParams.join("&")}`;
  }

  const header = {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      Accept: "application/json, text/plain, */*",
      Origin: config.genolinkServer,
    },
  };

  try {
    const response = await axios.post(url, req.body, header);
    res.send(response.data);
  } catch (error) {
    logger.error(`API Error in /accession/filters: ${error}`);
    res.status(500).send("API request failed: " + error);
  }
});

///////////////////////////////////////////////////////////////////////////////////////////////////
router.post("/accession/query", async (req, res) => {
  try {
    const token = await getToken();
    let url = `${config.genesysServer}/api/v1/acn/query`;
    const queryParams = [];

    if (req.query.p) queryParams.push(`p=${req.query.p}`);
    if (req.query.l) queryParams.push(`l=${req.query.l}`);
    if (req.query.s) queryParams.push(`s=${req.query.s}`);
    if (req.query.d) queryParams.push(`d=${req.query.d}`);
    if (req.query.f) queryParams.push(`d=${req.query.f}`);
    if (req.query.select) queryParams.push(`select=${req.query.select}`);

    if (queryParams.length > 0) {
      url += `?${queryParams.join("&")}`;
    }
    const header = {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        Accept: "application/json, text/plain, */*",
        Origin: config.genolinkServer,
      },
    };
    let response = await axios.post(url, req.body, header);
    res.send(response.data);
  } catch (error) {
    logger.error(`API Error in /accession/query: ${error}`);
    res.status(500).send("API request failed: " + error);
  }
});

module.exports = router;
