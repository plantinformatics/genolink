const express = require("express");
const router = express.Router();
const axios = require("axios");
const generateGigwaToken = require("../utils/generateGigwaToken");
const checkCredentials = require("../middlewares/checkCredentials");
const logger = require('../middlewares/logger');
const config = require("../config/appConfig");

// Get a filtered list of breeding programs
///////////////////////////////////////////////////////////////////////////////////////////////////
router.get("/brapi/v2/programs", checkCredentials, async (req, res) => {
  try {
    const token = await generateGigwaToken(req);

    const params = req.query;

    const response = await axios.get(
      `${config.gigwaServer}/gigwa/rest/brapi/v2/programs`,
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
router.post(
  "/brapi/v2/search/variantsets",
  checkCredentials,
  async (req, res) => {
    try {
      const token = await generateGigwaToken(req);
      const response = await axios.post(
        `${config.gigwaServer}/gigwa/rest/brapi/v2/search/variantsets`,
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
  }
);

// Get a filtered list of VariantSets
///////////////////////////////////////////////////////////////////////////////////////////////////
router.get("/brapi/v2/variantsets", checkCredentials, async (req, res) => {
  try {
    const token = await generateGigwaToken(req);

    const params = req.query;

    const response = await axios.get(
      `${config.gigwaServer}/gigwa/rest/brapi/v2/variantsets`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        params,
      }
    );

    res.send(response.data); 
  } catch (error) {
    logger.error(`API Error in /brapi/v2/variantsets: ${error.message}`);
    res.status(500).send("API request failed: " + error);
  }
});

// Return a filtered list of Sample objects
///////////////////////////////////////////////////////////////////////////////////////////////////
router.post("/brapi/v2/search/samples", checkCredentials, async (req, res) => {
  try {
    const token = await generateGigwaToken(req);

    const response = await axios.post(
      `${config.gigwaServer}/gigwa/rest/brapi/v2/search/samples`,
      req.body,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
      }
    );

    res.send(response.data);
  } catch (error) {
    if (error.response) {
      logger.error(`API Error in /brapi/v2/search/samples: ${error.response.status} - ${JSON.stringify(error.response.data)}`);
      
      const errorMessage = error.response.data.metadata.status.map(status => status.message).join(', ');
      
      res.status(error.response.status).send({
        message: errorMessage,
        status: error.response.status
      });
    } else if (error.request) {
      logger.error('API Error in /brapi/v2/search/samples: No response received');
      res.status(500).send("API request failed: No response received");
    } else {
      logger.error(`API Error in /brapi/v2/search/samples: ${error.message}`);
      res.status(500).send("API request failed: " + error.message);
    }
  }
});

// Gets a filtered list of Reference object
///////////////////////////////////////////////////////////////////////////////////////////////////
router.get("/brapi/v2/references", checkCredentials, async (req, res) => {
  try {
    const token = await generateGigwaToken(req);

    const params = req.query;

    const response = await axios.get(
      `${config.gigwaServer}/gigwa/rest/brapi/v2/references`,
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
      logger.error(`API Error in /brapi/v2/references: ${error.response.status} - ${JSON.stringify(error.response.data)}`);
      
      const errorMessage = error.response.data.metadata.status.map(status => status.message).join(', ');
      
      res.status(error.response.status).send({
        message: errorMessage,
        status: error.response.status
      });
    } else if (error.request) {
      logger.error('API Error in /brapi/v2/references: No response received');
      res.status(500).send("API request failed: No response received");
    } else {
      logger.error(`API Error in /brapi/v2/references: ${error.message}`);
      res.status(500).send("API request failed: " + error.message);
    }
  }
});

// Gets ReferenceSets
///////////////////////////////////////////////////////////////////////////////////////////////////
router.get("/brapi/v2/referencesets", checkCredentials, async (req, res) => {
  try {
    const token = await generateGigwaToken(req);

    const params = req.query;

    const response = await axios.get(
      `${config.gigwaServer}/gigwa/rest/brapi/v2/referencesets`,
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
      logger.error(`API Error in /brapi/v2/referencesets: ${error.response.status} - ${JSON.stringify(error.response.data)}`);
      
      const errorMessage = error.response.data.metadata.status.map(status => status.message).join(', ');
      
      res.status(error.response.status).send({
        message: errorMessage,
        status: error.response.status
      });
    } else if (error.request) {
      logger.error('API Error in /brapi/v2/referencesets: No response received');
      res.status(500).send("API request failed: No response received");
    } else {
      logger.error(`API Error in /brapi/v2/referencesets: ${error.message}`);
      res.status(500).send("API request failed: " + error.message);
    }
  }
});

///////////////////////////////////////////////////////////////////////////////////////////////////
router.post(
  "/ga4gh/variants/variantid/:variantid",
  checkCredentials,
  async (req, res) => {
    try {
      const token = await generateGigwaToken(req);
      response = await axios.get(
        `${config.gigwaServer}/gigwa/rest/ga4gh/variants/${req.params.variantid}`,
        {
          headers: {
            assembly: "0",
            Authorization: `Bearer ${token}`,
          },
        }
      );
      res.send(response.data);
    } catch (error) {
      logger.error(`API Error in /ga4gh/variants/variantid/:variantid: ${error.message}`);
      res.status(500).send("API request failed: " + error);
    }
  }
);
///////////////////////////////////////////////////////////////////////////////////////////////////
router.post("/ga4gh/variants/search", checkCredentials, async (req, res) => {
  try {
    const token = await generateGigwaToken(req);

    const samplesDetails = req.body.selectedSamplesDetails;
    const sampleList = req.body.selectedSamplesDetails.map((sample) =>
      sample.sampleName.split("-").slice(0, -2).join("-")
    );
    const callsetIds = samplesDetails.map(
      (item) => `${item.sampleDbId}§${item.germplasmDbId.split("§")[1]}`
    );
    const variantList = req.body.variantList;
    const joinedVariantList = variantList.join(";");
    const body = {
      username: req.body.username,
      password: req.body.password,
      alleleCount: "",
      annotationFieldThresholds: {},
      annotationFieldThresholds2: {},
      callSetIds: callsetIds ? callsetIds : [],
      callSetIds2: [],
      discriminate: false,
      end: req.body.end || -1,
      geneName: "",
      getGT: true,
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
      start: req.body.start || -1,
      variantEffect: "",
      variantSetId: `${samplesDetails[0]?.studyDbId}`,
      // variantSetId: "Database1§1",
    };

    response = await axios.post(
      `${config.gigwaServer}/gigwa/rest/ga4gh/variants/search`,
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
router.post("/searchSamplesInDatasets", checkCredentials, async (req, res) => {
  const accessions = req.body.accessions;

  if (!accessions || accessions.length === 0) {
    logger.error("No accessions provided");
    return res.status(400).send({ message: "No accessions provided" });
  }

  try {
    const token = await generateGigwaToken(req);

    const samplesObj = await axios.post(`${config.genolinkServer}/api/internalApi/accessionMapping`, {
      Accessions: accessions,
    }).then((response) => response.data);

    const samples = samplesObj.Samples.map((obj) => obj.Sample);
    const numberOfMappedAccessions = samples.length; 
    const numberOfGenesysAccessions = accessions.length;

    const variantSetsResponse = await axios.get(`${config.gigwaServer}/gigwa/rest/brapi/v2/variantsets`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    const variantSets = variantSetsResponse.data.result.data;
    const studyDbIds = variantSets.map((vs) => vs.studyDbId);

    const sampleNames = [];
    for (const vs of variantSets) {
      const parts = vs.variantSetDbId.split("§").slice(1); // Skip the database part
      for (const sample of samples) {
        sampleNames.push(`${sample}-${parts.join("-")}`);
      }
    }

    const searchResponse = await axios.post(`${config.gigwaServer}/gigwa/rest/brapi/v2/search/samples`, {
      sampleNames,
      studyDbIds,
    }, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const response = searchResponse.data;
    const numberOfPresentAccessions = searchResponse.data.result.data.length;
    res.send({response, numberOfGenesysAccessions, numberOfPresentAccessions, numberOfMappedAccessions});
  } catch (error) {
    if (error.response && error.response.data && error.response.data.message) {
      logger.error(`Error in dataset search - ${error.response.data.message}`);
      return res.status(error.response.status).send({ message: error.response.data.message });
    } else if (error.response && error.response.status === 403) {
      logger.warn("Access denied during dataset search. Credentials issue.");
      return res.status(403).send({ message: "Access denied. Please check your credentials." });
    } else {
      logger.error(`Unhandled API error in /searchSamplesInDatasets: ${error.message}`);
      res.status(500).send("API request failed: " + error.message);
    }
  }
});

///////////////////////////////////////////////////////////////////////////////////////////////////
router.post(
  "/brapi/v2/search/allelematrix",
  checkCredentials,
  async (req, res) => {
    try {
      const token = await generateGigwaToken(req);
      const response = await axios.post(
        `${config.gigwaServer}/gigwa/rest/brapi/v2/search/allelematrix`,
        req.body,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
        }
      );
      res.send(response.data);
    } catch (error) {
      if (error.response) {
        logger.error(`API Error in /brapi/v2/search/allelematrix: ${error.response.status} - ${JSON.stringify(error.response.data)}`);
        
        const errorMessage = error.response.data.metadata.status.map(status => status.message).join(', ');
        
        res.status(error.response.status).send({
          message: errorMessage,
          status: error.response.status
        });
      } else if (error.request) {
        logger.error('API Error in /brapi/v2/search/allelematrix: No response received');
        res.status(500).send("API request failed: No response received");
      } else {
        logger.error(`API Error in /brapi/v2/search/allelematrix: ${error.message}`);
        res.status(500).send("API request failed: " + error.message);
      }
    }
  }
);

///////////////////////////////////////////////////////////////////////////////////////////////////
router.post('/exportData', checkCredentials, async (req, res) => {
  try {
    const token = await generateGigwaToken(req);

    const { username, password, variantList, selectedSamplesDetails, variantPage, linkagegroups, start, end, pageSize } = req.body;

    const sampleList = selectedSamplesDetails.map(sample =>
      sample.sampleName.split("-").slice(0, -2).join("-")
    );
    const callsetIds = selectedSamplesDetails.map(
      item => `${item.sampleDbId}§${item.germplasmDbId.split("§")[1]}`
    );
    const joinedVariantList = variantList.join(";");

    const body = {
      username: username,
      password: password,
      alleleCount: "",
      annotationFieldThresholds: {},
      annotationFieldThresholds2: {},
      callSetIds: callsetIds ? callsetIds : [],
      callSetIds2: [],
      discriminate: false,
      end: end || -1,
      exportedIndividuals: sampleList || [],
      exportFormat: "VCF",
      geneName: "",
      getGT: true,
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
      pageSize: pageSize || 1000,
      pageToken: variantPage ? `${variantPage}` : "0",
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

    const response = await axios.post(`${config.gigwaServer}/gigwa/rest/gigwa/exportData`, body, {
      headers: {
        assembly: "0",
        Authorization: `Bearer ${token}`,
      },
      responseType: 'arraybuffer'
    });

    res.send(response.data);
  } catch (error) {
    logger.error(`API Error in /exportData: ${error.message}`);
    res.status(500).send('API request failed: ' + error.message);
  }
});

module.exports = router;
