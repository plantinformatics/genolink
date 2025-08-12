const express = require("express");
const router = express.Router();
const axios = require("axios");
const logger = require("../middlewares/logger");
const config = require("../config/appConfig");

// Get Gigwa Servers
///////////////////////////////////////////////////////////////////////////////////////////////////
router.get("/gigwaServers", (req, res) => {
  res.json(config.gigwaServers);
});
// Generate Gigwa Token
///////////////////////////////////////////////////////////////////////////////////////////////////
router.post("/generateGigwaToken", async (req, res) => {
  try {
    const { username, password, selectedGigwaServer } = req.body;
    if (!selectedGigwaServer) {
      return res
        .status(400)
        .json({ error: "Please specify Gigwa server in your payload" });
    }

    const requestBody =
      username && password ? { username, password } : undefined;

    const tokenResponse = await axios.post(
      `${selectedGigwaServer}/gigwa/rest/gigwa/generateToken`,
      requestBody,
      {
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
      }
    );

    const token = tokenResponse.data.token;
    res.send({ token });
  } catch (error) {
    const status = error.response?.status || 500;

    logger.error(`Login failed: ${error.message || error}`);
    return res.status(status).json({
      error:
        status === 403 || status === 401
          ? "Invalid username or password"
          : "Login failed: " + (error.message || "Unknown error"),
    });
  }
});

// Get a filtered list of breeding programs
///////////////////////////////////////////////////////////////////////////////////////////////////
router.post("/brapi/v2/programs", async (req, res) => {
  try {
    const { selectedGigwaServer } = req.body;
    if (!selectedGigwaServer) {
      return res
        .status(400)
        .json({ error: "Please specify Gigwa server in your payload" });
    }
    let token = "";
    if (req.body.gigwaToken) {
      token = req.body.gigwaToken;
    } else {
      token = await axios.post(
        `${selectedGigwaServer}/gigwa/rest/gigwa/generateToken`,
        req.body.username && req.body.password
          ? { username: req.body.username, password: req.body.password }
          : undefined,
        {
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
        }
      );
    }

    const params = req.body;

    const response = await axios.get(
      `${selectedGigwaServer}/gigwa/rest/brapi/v2/programs`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        params,
      }
    );

    res.send(response.data);
  } catch (error) {
    logger.error(`API Error in /brapi/v2/programs: ${error.message}`);
    res.status(500).send("API request failed: " + error);
  }
});

// Return a filtered list of VariantSets objects
///////////////////////////////////////////////////////////////////////////////////////////////////
router.post("/brapi/v2/search/variantsets", async (req, res) => {
  try {
    const { selectedGigwaServer } = req.body;
    if (!selectedGigwaServer) {
      return res
        .status(400)
        .json({ error: "Please specify Gigwa server in your payload" });
    }
    let token = "";
    if (req.body.gigwaToken) {
      token = req.body.gigwaToken;
    } else {
      token = await axios.post(
        `${selectedGigwaServer}/gigwa/rest/gigwa/generateToken`,
        req.body.username && req.body.password
          ? { username: req.body.username, password: req.body.password }
          : undefined,
        {
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
        }
      );
    }

    const response = await axios.post(
      `${selectedGigwaServer}/gigwa/rest/brapi/v2/search/variantsets`,
      req.body,
      {
        headers: {
          authorization: `Bearer ${token}`,
        },
      }
    );

    res.send(response.data);
  } catch (error) {
    logger.error(`API Error in /brapi/v2/search/variantsets: ${error.message}`);
    res.status(500).send("API request failed: " + error);
  }
});

// Return a list of filtered Variants
///////////////////////////////////////////////////////////////////////////////////////////////////
router.post("/brapi/v2/search/variants", async (req, res) => {
  try {
    const { selectedGigwaServer } = req.body;
    if (!selectedGigwaServer) {
      return res
        .status(400)
        .json({ error: "Please specify Gigwa server in your payload" });
    }
    let token = "";
    if (req.body.gigwaToken) {
      token = req.body.gigwaToken;
    } else {
      token = await axios.post(
        `${selectedGigwaServer}/gigwa/rest/gigwa/generateToken`,
        req.body.username && req.body.password
          ? { username: req.body.username, password: req.body.password }
          : undefined,
        {
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
        }
      );
    }
    const response = await axios.post(
      `${selectedGigwaServer}/gigwa/rest/brapi/v2/search/variants`,
      req.body,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );

    res.send(response.data);
  } catch (error) {
    if (error.response) {
      logger.error(
        `API Error in /brapi/v2/search/variants: ${
          error.response.status
        } - ${JSON.stringify(error.response.data)}`
      );

      const errorMessage = error.response.data.metadata?.status
        .map((status) => status.message)
        .join(", ");

      res.status(error.response.status).send({
        message: errorMessage,
        status: error.response.status,
      });
    } else if (error.request) {
      logger.error(
        "API Error in /brapi/v2/search/variants: No response received"
      );
      res.status(500).send("API request failed: No response received");
    } else {
      logger.error(`API Error in /brapi/v2/search/variants: ${error.message}`);
      res.status(500).send("API request failed: " + error.message);
    }
  }
});

// Return a filtered list of Sample objects
///////////////////////////////////////////////////////////////////////////////////////////////////
router.post("/brapi/v2/search/samples", async (req, res) => {
  try {
    const { selectedGigwaServer } = req.body;
    if (!selectedGigwaServer) {
      return res
        .status(400)
        .json({ error: "Please specify Gigwa server in your payload" });
    }
    let token = "";
    if (req.body.gigwaToken) {
      token = req.body.gigwaToken;
    } else {
      token = await axios.post(
        `${selectedGigwaServer}/gigwa/rest/gigwa/generateToken`,
        req.body.username && req.body.password
          ? { username: req.body.username, password: req.body.password }
          : undefined,
        {
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
        }
      );
    }
    const response = await axios.post(
      `${selectedGigwaServer}/gigwa/rest/brapi/v2/search/samples`,
      req.body,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );

    res.send(response.data);
  } catch (error) {
    if (error.response) {
      logger.error(
        `API Error in /brapi/v2/search/samples: ${
          error.response.status
        } - ${JSON.stringify(error.response.data)}`
      );

      const errorMessage = error.response.data.metadata?.status
        .map((status) => status.message)
        .join(", ");

      res.status(error.response.status).send({
        message: errorMessage,
        status: error.response.status,
      });
    } else if (error.request) {
      logger.error(
        "API Error in /brapi/v2/search/samples: No response received"
      );
      res.status(500).send("API request failed: No response received");
    } else {
      logger.error(`API Error in /brapi/v2/search/samples: ${error.message}`);
      res.status(500).send("API request failed: " + error.message);
    }
  }
});

// Gets a filtered list of Reference object
///////////////////////////////////////////////////////////////////////////////////////////////////
router.get("/brapi/v2/references", async (req, res) => {
  try {
    const { selectedGigwaServer } = req.query;
    if (!selectedGigwaServer) {
      return res
        .status(400)
        .json({ error: "Please specify Gigwa server in your payload" });
    }
    const params = req.query;

    let token = "";
    if (params.gigwaToken) {
      token = params.gigwaToken;
    } else {
      token = await axios.post(
        `${selectedGigwaServer}/gigwa/rest/gigwa/generateToken`,
        params.username && params.password
          ? { username: params.username, password: params.password }
          : undefined,
        {
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
        }
      );
    }

    const response = await axios.get(
      `${selectedGigwaServer}/gigwa/rest/brapi/v2/references`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        params,
      }
    );

    res.send(response.data);
  } catch (error) {
    if (error.response) {
      logger.error(
        `API Error in /brapi/v2/references: ${
          error.response.status
        } - ${JSON.stringify(error.response.data)}`
      );

      const errorMessage = error.response.data.metadata?.status
        .map((status) => status.message)
        .join(", ");

      res.status(error.response.status).send({
        message: errorMessage,
        status: error.response.status,
      });
    } else if (error.request) {
      logger.error("API Error in /brapi/v2/references: No response received");
      res.status(500).send("API request failed: No response received");
    } else {
      logger.error(`API Error in /brapi/v2/references: ${error.message}`);
      res.status(500).send("API request failed: " + error.message);
    }
  }
});

// Gets ReferenceSets
///////////////////////////////////////////////////////////////////////////////////////////////////
router.get("/brapi/v2/referencesets", async (req, res) => {
  try {
    const params = req.query;
    const { selectedGigwaServer } = params;
    if (!selectedGigwaServer) {
      return res
        .status(400)
        .json({ error: "Please specify Gigwa server in your payload" });
    }

    let token = "";
    if (params.gigwaToken) {
      token = params.gigwaToken;
    } else {
      token = await axios.post(
        `${selectedGigwaServer}/gigwa/rest/gigwa/generateToken`,
        params.username && params.password
          ? { username: params.username, password: params.password }
          : undefined,
        {
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
        }
      );
    }
    const response = await axios.get(
      `${selectedGigwaServer}/gigwa/rest/brapi/v2/referencesets`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        params,
      }
    );

    res.send(response.data);
  } catch (error) {
    if (error.response) {
      logger.error(
        `API Error in /brapi/v2/referencesets: ${
          error.response.status
        } - ${JSON.stringify(error.response.data)}`
      );

      const errorMessage = error.response.data.metadata?.status
        .map((status) => status.message)
        .join(", ");

      res.status(error.response.status).send({
        message: errorMessage,
        status: error.response.status,
      });
    } else if (error.request) {
      logger.error(
        "API Error in /brapi/v2/referencesets: No response received"
      );
      res.status(500).send("API request failed: No response received");
    } else {
      logger.error(`API Error in /brapi/v2/referencesets: ${error.message}`);
      res.status(500).send("API request failed: " + error.message);
    }
  }
});

///////////////////////////////////////////////////////////////////////////////////////////////////
router.post("/ga4gh/variants/variantid/:variantid", async (req, res) => {
  try {
    const { selectedGigwaServer } = req.body;
    if (!selectedGigwaServer) {
      return res
        .status(400)
        .json({ error: "Please specify Gigwa server in your payload" });
    }
    let token = "";
    if (req.body.gigwaToken) {
      token = req.body.gigwaToken;
    } else {
      token = await axios.post(
        `${selectedGigwaServer}/gigwa/rest/gigwa/generateToken`,
        req.body.username && req.body.password
          ? { username: req.body.username, password: req.body.password }
          : undefined,
        {
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
        }
      );
    }

    const response = await axios.get(
      `${selectedGigwaServer}/gigwa/rest/ga4gh/variants/${req.params.variantid}`,
      {
        headers: {
          assembly: "0",
          Authorization: `Bearer ${token}`,
        },
      }
    );
    res.send(response.data);
  } catch (error) {
    logger.error(
      `API Error in /ga4gh/variants/variantid/:variantid: ${error.message}`
    );
    res.status(500).send("API request failed: " + error);
  }
});
///////////////////////////////////////////////////////////////////////////////////////////////////
router.post("/ga4gh/variants/search", async (req, res) => {
  try {
    let token = "";
    const { selectedGigwaServer } = req.body;
    if (!selectedGigwaServer) {
      return res
        .status(400)
        .json({ error: "Please specify Gigwa server in your payload" });
    }
    if (req.body.gigwaToken) {
      token = req.body.gigwaToken;
    } else {
      token = await axios.post(
        `${selectedGigwaServer}/gigwa/rest/gigwa/generateToken`,
        req.body.username && req.body.password
          ? { username: req.body.username, password: req.body.password }
          : undefined,
        {
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
        }
      );
    }
    const samplesDetails = req.body.selectedSamplesDetails;
    const sampleList = req.body.sampleVcfNames;
    const callsetIds = samplesDetails.map(
      (item) => `${item.sampleDbId}§${item.germplasmDbId.split("§")[1]}`
    );
    const variantList = req.body.variantList;
    const joinedVariantList = variantList.join(";");
    const body = {
      alleleCount: "",
      annotationFieldThresholds: {},
      annotationFieldThresholds2: {},
      callSetIds: callsetIds ? callsetIds : [],
      callSetIds2: [],
      discriminate: false,
      end: req.body.posEnd || -1,
      geneName: "",
      getGT: false,
      gtPattern: "Any",
      gtPattern2: "Any",
      maxHeZ: 100,
      maxHeZ2: 100,
      maxMaf: 50,
      maxMaf2: 50,
      maxMissingData: 100,
      maxMissingData2: 100,
      minHeZ: 0,
      minHeZ2: 0,
      minMaf: 0,
      minMaf2: 0,
      minMissingData: 0,
      minMissingData2: 0,
      mostSameRatio: "100",
      mostSameRatio2: "100",
      pageSize: req.body.pageSize || 1000,
      pageToken: req.body.variantPage ? `${req.body.variantPage}` : "0",
      // "chr1A;chr1B"
      referenceName: req.body.linkagegroups || "",
      searchMode: 3,
      selectedVariantIds: joinedVariantList,
      selectedVariantTypes: "",
      sortBy: "",
      sortDir: "asc",
      start: req.body.posStart || -1,
      variantEffect: "",
      variantSetId: `${samplesDetails[0]?.studyDbId}`,
      // variantSetId: "Database1§1",
    };
    response = await axios.post(
      `${selectedGigwaServer}/gigwa/rest/ga4gh/variants/search`,
      body,
      {
        headers: {
          assembly: "0",
          Authorization: `Bearer ${token}`,
        },
      }
    );
    const responseData = {
      desiredSamples: sampleList,
      data: response.data,
    };
    res.send(responseData);
  } catch (error) {
    logger.error(`API Error in /ga4gh/variants/search: ${error.message}`);
    res.status(500).send("API request failed: " + error);
  }
});

///////////////////////////////////////////////////////////////////////////////////////////////////
router.post("/searchSamplesInDatasets", async (req, res) => {
  const { accessions, accessionNames, selectedGigwaServer } = req.body;
  let token = "";
  if (!selectedGigwaServer) {
    return res
      .status(400)
      .json({ error: "Please specify Gigwa server in your payload" });
  }
  if (!accessions || accessions.length === 0) {
    logger.error("No accessions provided");
    return res.status(400).send({ message: "No accessions provided" });
  }

  try {
    if (req.body.gigwaToken) {
      token = req.body.gigwaToken;
    } else {
      token = await axios.post(
        `${selectedGigwaServer}/gigwa/rest/gigwa/generateToken`,
        req.body.username && req.body.password
          ? { username: req.body.username, password: req.body.password }
          : undefined,
        {
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
        }
      );
    }
    const samplesObj = await axios
      .post(
        `${config.genolinkServer}/api/internalApi/mapAccessionToGenotypeId`,
        {
          Accessions: accessions,
        }
      )
      .then((response) => response.data);

    const samples = samplesObj.Samples.map((obj) => obj.Sample || []);
    const Accessions = samplesObj.Samples.map((obj) => obj.Accession || []);

    const accessionPlusAccessionName =
      accessionNames && Object.keys(accessionNames).length > 0
        ? Object.entries(accessionNames)
            .filter(([key]) => Accessions.includes(key))
            .flatMap(([key, value]) => {
              return samplesObj.Samples.filter(
                (obj) => obj.Accession === key
              ).map((obj) => `${value}§${key}§${obj.Sample}`);
            })
        : [];
    const numberOfMappedAccessions = Array.from(new Set(Accessions)).length;
    const numberOfGenesysAccessions = accessions.length;

    const variantSetsResponse = await axios.get(
      `${selectedGigwaServer}/gigwa/rest/brapi/v2/variantsets`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    const variantSets = variantSetsResponse.data.result.data;
    const datasetNames = variantSets.map((vs) => vs.variantSetName);
    const variantSetDbIds = variantSets.map((vs) => vs.variantSetDbId);
    const studyDbIds = variantSets.map((vs) => vs.studyDbId);
    const sampleNames = [];
    for (const vs of variantSets) {
      const parts = vs.variantSetDbId.split("§").slice(1);
      for (const sample of samples) {
        sampleNames.push(`${sample}-${parts.join("-")}`);
      }
    }
    const searchResponse = await axios.post(
      `${selectedGigwaServer}/gigwa/rest/brapi/v2/search/samples`,
      {
        sampleNames,
        studyDbIds,
      },
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    const response = searchResponse.data;

    const uniqueSamplePresence = new Set(
      response.result.data.map(
        (individual) => individual.germplasmDbId.split("§")[1]
      )
    );

    const numberOfPresentAccessions = uniqueSamplePresence.size;

    res.send({
      response,
      variantSetDbIds,
      datasetNames,
      vcfSamples: samples,
      numberOfGenesysAccessions,
      numberOfPresentAccessions,
      numberOfMappedAccessions,
      accessionPlusAccessionName,
    });
  } catch (error) {
    if (error.response && error.response.data && error.response.data.message) {
      logger.error(`Error in dataset search - ${error.response.data.message}`);
      return res
        .status(error.response.status)
        .send({ message: error.response.data.message });
    } else if (error.response && error.response.status === 403) {
      logger.warn("Access denied during dataset search. Credentials issue.");
      return res
        .status(403)
        .send({ message: "Access denied. Please check your credentials." });
    } else {
      logger.error(
        `Unhandled API error in /searchSamplesInDatasets: ${error.message}`
      );
      res.status(500).send("API request failed: " + error.message);
    }
  }
});

///////////////////////////////////////////////////////////////////////////////////////////////////
router.post("/brapi/v2/search/allelematrix", async (req, res) => {
  try {
    let token = "";
    const { selectedGigwaServer } = req.body;
    if (!selectedGigwaServer) {
      return res
        .status(400)
        .json({ error: "Please specify Gigwa server in your payload" });
    }

    if (req.body.gigwaToken) {
      token = req.body.gigwaToken;
    } else {
      token = await axios.post(
        `${selectedGigwaServer}/gigwa/rest/gigwa/generateToken`,
        req.body.username && req.body.password
          ? { username: req.body.username, password: req.body.password }
          : undefined,
        {
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
        }
      );
    }

    if (!req.body.dataMatrixAbbreviations) {
      req.body.dataMatrixAbbreviations = ["GT"];
    }
    if (!req.body.pagination) {
      if (req.body.page) {
        req.body.pagination = [
          { dimension: "variants", page: req.body.page, pageSize: 1000 },
          { dimension: "callsets", page: 0, pageSize: 10000 },
        ];
      } else {
        req.body.pagination = [
          { dimension: "variants", page: 0, pageSize: 1000 },
          { dimension: "callsets", page: 0, pageSize: 10000 },
        ];
      }
    }
    const response = await axios.post(
      `${selectedGigwaServer}/gigwa/rest/brapi/v2/search/allelematrix`,
      req.body,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );
    res.send(response.data);
  } catch (error) {
    if (error.response) {
      logger.error(
        `API Error in /brapi/v2/search/allelematrix: ${
          error.response.status
        } - ${JSON.stringify(error.response.data)}`
      );

      const errorMessage = error.response.data.metadata?.status
        .map((status) => status.message)
        .join(", ");

      res.status(error.response.status).send({
        message: errorMessage,
        status: error.response.status,
      });
    } else if (error.request) {
      logger.error(
        "API Error in /brapi/v2/search/allelematrix: No response received"
      );
      res.status(500).send("API request failed: No response received");
    } else {
      logger.error(
        `API Error in /brapi/v2/search/allelematrix: ${error.message}`
      );
      res.status(500).send("API request failed: " + error.message);
    }
  }
});

///////////////////////////////////////////////////////////////////////////////////////////////////
router.post("/exportData", async (req, res) => {
  try {
    let token = "";
    const {
      variantList,
      selectedSamplesDetails,
      linkagegroups,
      start,
      end,
      selectedGigwaServer,
    } = req.body;
    if (!selectedGigwaServer) {
      return res
        .status(400)
        .json({ error: "Please specify Gigwa server in your payload" });
    }
    if (req.body.gigwaToken) {
      token = req.body.gigwaToken;
    } else {
      token = await axios.post(
        `${selectedGigwaServer}/gigwa/rest/gigwa/generateToken`,
        req.body.username && req.body.password
          ? { username: req.body.username, password: req.body.password }
          : undefined,
        {
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
        }
      );
    }
    const sampleList = selectedSamplesDetails.map(
      (sample) => sample.germplasmDbId.split("§")[1]
    );

    const joinedVariantList = variantList.join(";");

    const body = {
      alleleCount: "",
      annotationFieldThresholds: {},
      annotationFieldThresholds2: {},
      callSetIds: [],
      callSetIds2: [],
      discriminate: false,
      end: end || -1,
      exportedIndividuals: sampleList,
      exportFormat: "VCF",
      geneName: "",
      getGT: false,
      gtPattern: "Any",
      gtPattern2: "Any",
      keepExportOnServer: false,
      maxHeZ: 100,
      maxHeZ2: 100,
      maxMaf: 50,
      maxMaf2: 50,
      maxMissingData: 100,
      maxMissingData2: 100,
      metadataFields: [],
      minHeZ: 0,
      minHeZ2: 0,
      minMaf: 0,
      minMaf2: 0,
      minMissingData: 0,
      minMissingData2: 0,
      mostSameRatio: "100",
      mostSameRatio2: "100",
      pageSize: 100,
      pageToken: "0",
      referenceName: linkagegroups || "",
      searchMode: 3,
      selectedVariantIds: joinedVariantList,
      selectedVariantTypes: "",
      sortBy: "",
      sortDir: "asc",
      start: start || -1,
      variantEffect: "",
      variantSetId: `${selectedSamplesDetails[0]?.studyDbId}`,
    };
    const response = await axios.post(
      `${selectedGigwaServer}/gigwa/rest/gigwa/exportData`,
      body,
      {
        headers: {
          assembly: "0",
          Authorization: `Bearer ${token}`,
        },
        responseType: "arraybuffer",
      }
    );

    res.send(response.data);
  } catch (error) {
    logger.error(`API Error in /exportData: ${error.message}`);
    res.status(500).send("API request failed: " + error.message);
  }
});
//////////////////////////////////////////////////////////////////////////
router.post("/samplesDatasetInfo", async (req, res) => {
  try {
    const { selectedGigwaServer } = req.body;
    if (!selectedGigwaServer) {
      return res
        .status(400)
        .json({ error: "Please specify Gigwa server in your payload" });
    }
    let token = "";
    let samples;
    let accessions;
    if (req.body.gigwaToken) {
      token = req.body.gigwaToken;
    } else {
      token = await axios.post(
        `${selectedGigwaServer}/gigwa/rest/gigwa/generateToken`,
        req.body.username && req.body.password
          ? { username: req.body.username, password: req.body.password }
          : undefined,
        {
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
        }
      );
    }
    if (!req.body.Samples && !req.body.Accessions) {
      throw new Error("Please provide Samples list or Accessions list");
    } else if (Array.isArray(req.body.Samples)) {
      if (typeof req.body.Samples[0] === "string") {
        samples = req.body.Samples;
      } else if (typeof req.body.Samples[0] === "object") {
        samples = req.body.Samples.map((obj) => obj.Sample || []);
      } else {
        throw new Error("Invalid Samples format");
      }
    } else if (!req.body.Samples && Array.isArray(req.body.Accessions)) {
      if (typeof req.body.Accessions[0] === "string") {
        accessions = req.body.Accessions;
      } else if (typeof req.body.Accessions[0] === "object") {
        accessions = req.body.Accessions.map((obj) => obj.Accession || []);
      } else {
        throw new Error("Invalid Accessions format");
      }
    } else {
      throw new Error("Samples must be an array");
    }

    if (!samples && accessions.length > 0) {
      samples = await axios
        .post(
          `${config.genolinkServer}/api/internalApi/mapAccessionToGenotypeId`,
          {
            Accessions: accessions,
          }
        )
        .then((response) =>
          response.data.Samples.map((obj) => obj.Sample || [])
        );
    }

    const variantSetsResponse = await axios.get(
      `${selectedGigwaServer}/gigwa/rest/brapi/v2/variantsets`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    const variantSets = variantSetsResponse.data.result.data;
    const variantSetDbIds = variantSets.map((vs) => vs.variantSetDbId);
    const studyDbIds = variantSets.map((vs) => vs.studyDbId);
    const sampleNames = [];
    for (const vs of variantSets) {
      const parts = vs.variantSetDbId.split("§").slice(1);
      for (const sample of samples) {
        sampleNames.push(`${sample}-${parts.join("-")}`);
      }
    }
    const searchResponse = await axios.post(
      `${selectedGigwaServer}/gigwa/rest/brapi/v2/search/samples`,
      {
        sampleNames,
        studyDbIds,
      },
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    const SamplesDatasetInfo = searchResponse.data.result.data.map((sample) => {
      const sampleName = sample.sampleName;
      const callSetDbId = sample.sampleDbId;
      const variantSetDbId = variantSetDbIds.filter((variantSetDbId) =>
        variantSetDbId.includes(sample.studyDbId)
      );

      return { sampleName, callSetDbId, variantSetDbId };
    });
    res.send(SamplesDatasetInfo);
  } catch (error) {
    logger.error(`API Error in /passportQuery: ${error}`);
    res.status(500).send("API request failed: " + error);
  }
});

module.exports = router;
