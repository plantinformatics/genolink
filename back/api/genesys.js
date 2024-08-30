const express = require("express");
const router = express.Router();
const axios = require("axios");
const config = require("../config/appConfig");
const logger = require("../middlewares/logger");
let token = "";

///////////////////////////////////////////////////////////////////////////////////////////////////
router.post("/login", (req, res) => {
  if (req.body && req.body.token) {
    token = req.body.token;
    logger.info("Login token received and stored."); // Log successful token receipt
    res.send("Token received");
  } else {
    logger.warn("Login attempt failed - No token provided."); // Log warning for no token provided
    res.status(400).json({ message: "No token provided." });
  }
});

///////////////////////////////////////////////////////////////////////////////////////////////////
router.post("/accession/filters", async (req, res) => {
  let url = `${config.genesysServer}/filter`;

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

    let url = `${config.genesysServer}/query`;
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
