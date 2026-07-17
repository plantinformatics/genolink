const express = require("express");
const router = express.Router();
const axios = require("axios");
const { pipeline } = require("node:stream/promises");
const logger = require("../middlewares/logger");
const config = require("../config/appConfig");
const {
  requireAllowedGigwaServer,
} = require("../utils/gigwaServerAllowlist");
const {
  getGenotypeMappingsByAccessions,
} = require("../utils/genotypeMappingResolver");
const rawBase = process.env.BASE_PATH || "";
const BASE_PATH = rawBase.replace(/\/+$/, "");

const normaliseGigwaBaseUrl = (selectedGigwaServer) => {
  return requireAllowedGigwaServer(selectedGigwaServer, config.gigwaServers);
};

const buildGigwaRestUrl = (selectedGigwaServer, path) => {
  const baseUrl = normaliseGigwaBaseUrl(selectedGigwaServer);
  const cleanPath = String(path || "").replace(/^\/+/, "");

  return `${baseUrl}/gigwa/rest/${cleanPath}`;
};

const crypto = require("crypto");

router.use((req, res, next) => {
  const selectedGigwaServer =
    req.body?.selectedGigwaServer ?? req.query?.selectedGigwaServer;

  if (!selectedGigwaServer) return next();

  try {
    normaliseGigwaBaseUrl(selectedGigwaServer);
    return next();
  } catch (error) {
    return res.status(error.statusCode || 400).json({ error: error.message });
  }
});

const gigwaSessions = new Map();
const GIGWA_SESSION_TTL_MS = 4 * 60 * 60 * 1000; // 4 hours

const createGigwaSession = ({ selectedGigwaServer, token }) => {
  const gigwaSessionId = crypto.randomUUID();

  gigwaSessions.set(gigwaSessionId, {
    selectedGigwaServer: normaliseGigwaBaseUrl(selectedGigwaServer),
    token,
    createdAt: Date.now(),
  });

  return gigwaSessionId;
};

const getGigwaSessionToken = ({ gigwaSessionId, selectedGigwaServer }) => {
  if (!gigwaSessionId) {
    throw new Error("Gigwa session ID is required.");
  }

  const session = gigwaSessions.get(gigwaSessionId);

  if (!session) {
    throw new Error("Gigwa session expired or not found.");
  }

  if (Date.now() - session.createdAt > GIGWA_SESSION_TTL_MS) {
    gigwaSessions.delete(gigwaSessionId);
    throw new Error("Gigwa session expired.");
  }

  const normalisedSelectedGigwaServer =
    normaliseGigwaBaseUrl(selectedGigwaServer);

  if (session.selectedGigwaServer !== normalisedSelectedGigwaServer) {
    throw new Error("Gigwa session does not match selected Gigwa server.");
  }

  return session.token;
};

const generateGigwaToken = async ({
  selectedGigwaServer,
  username = "",
  password = "",
}) => {
  const requestBody = username && password ? { username, password } : undefined;

  const tokenResponse = await axios.post(
    buildGigwaRestUrl(selectedGigwaServer, "gigwa/generateToken"),
    requestBody,
    {
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      timeout: 60000,
    },
  );

  const token = tokenResponse.data?.token;

  if (!token) {
    throw new Error("Gigwa token response did not include token");
  }

  return token;
};

const getGigwaTokenFromBody = (body) => {
  const { selectedGigwaServer, gigwaSessionId } = body;

  if (!selectedGigwaServer) {
    throw new Error("Please specify Gigwa server in your payload");
  }

  return getGigwaSessionToken({
    selectedGigwaServer,
    gigwaSessionId,
  });
};

const getGigwaTokenFromQuery = (query) => {
  const { selectedGigwaServer, gigwaSessionId } = query;

  if (!selectedGigwaServer) {
    throw new Error("Please specify Gigwa server in your payload");
  }

  return getGigwaSessionToken({
    selectedGigwaServer,
    gigwaSessionId,
  });
};

const validateExportDataBody = (body) => {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return { error: "Request body must be a JSON object." };
  }

  const {
    variantList = [],
    selectedCallSetDetails,
    linkagegroups = "",
    start = -1,
    end = -1,
    selectedGigwaServer,
    gigwaSessionId,
  } = body;

  if (
    typeof selectedGigwaServer !== "string" ||
    !selectedGigwaServer.trim()
  ) {
    return { error: "selectedGigwaServer must be a non-empty string." };
  }

  if (typeof gigwaSessionId !== "string" || !gigwaSessionId.trim()) {
    return { error: "gigwaSessionId must be a non-empty string." };
  }

  if (!Array.isArray(variantList)) {
    return { error: "variantList must be an array of strings." };
  }

  if (variantList.some((variant) => typeof variant !== "string")) {
    return { error: "Every variantList entry must be a string." };
  }

  if (
    !Array.isArray(selectedCallSetDetails) ||
    selectedCallSetDetails.length === 0
  ) {
    return { error: "selectedCallSetDetails must be a non-empty array." };
  }

  if (
    selectedCallSetDetails.some(
      (detail) => !detail || typeof detail !== "object" || Array.isArray(detail),
    )
  ) {
    return { error: "Every selectedCallSetDetails entry must be an object." };
  }

  const variantSetId = selectedCallSetDetails[0].studyDbId;
  if (typeof variantSetId !== "string" || !variantSetId.trim()) {
    return {
      error:
        "The first selectedCallSetDetails entry must contain a non-empty studyDbId.",
    };
  }

  if (
    selectedCallSetDetails.some(
      (detail) =>
        detail.germplasmDbId !== undefined &&
        typeof detail.germplasmDbId !== "string",
    )
  ) {
    return {
      error: "germplasmDbId must be a string when provided.",
    };
  }

  if (typeof linkagegroups !== "string") {
    return { error: "linkagegroups must be a string." };
  }

  const parseCoordinate = (value, fieldName) => {
    if (value === "" || value === null) return { value: -1 };

    const parsedValue =
      typeof value === "number"
        ? value
        : typeof value === "string" && /^-?\d+$/.test(value.trim())
          ? Number(value)
          : NaN;

    if (!Number.isSafeInteger(parsedValue) || parsedValue < -1) {
      return {
        error: `${fieldName} must be -1 or a non-negative integer.`,
      };
    }

    return { value: parsedValue };
  };

  const parsedStart = parseCoordinate(start, "start");
  if (parsedStart.error) return parsedStart;

  const parsedEnd = parseCoordinate(end, "end");
  if (parsedEnd.error) return parsedEnd;

  if (
    parsedStart.value !== -1 &&
    parsedEnd.value !== -1 &&
    parsedStart.value > parsedEnd.value
  ) {
    return { error: "start must be less than or equal to end." };
  }

  return {
    value: {
      ...body,
      variantList,
      selectedCallSetDetails,
      linkagegroups,
      start: parsedStart.value,
      end: parsedEnd.value,
      selectedGigwaServer: selectedGigwaServer.trim(),
      gigwaSessionId: gigwaSessionId.trim(),
    },
  };
};

let activeExportCount = 0;

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

    const token = await generateGigwaToken({
      selectedGigwaServer,
      username,
      password,
    });

    const gigwaSessionId = createGigwaSession({
      selectedGigwaServer,
      token,
    });

    res.send({ gigwaSessionId });
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
    const token = getGigwaTokenFromBody(req.body);

    const params = req.body;

    const response = await axios.get(
      buildGigwaRestUrl(selectedGigwaServer, "brapi/v2/programs"),
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        params,
      },
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
    const token = getGigwaTokenFromBody(req.body);

    const response = await axios.post(
      buildGigwaRestUrl(selectedGigwaServer, "brapi/v2/search/variantsets"),
      req.body,
      {
        headers: {
          authorization: `Bearer ${token}`,
        },
      },
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
    const token = getGigwaTokenFromBody(req.body);
    const response = await axios.post(
      buildGigwaRestUrl(selectedGigwaServer, "brapi/v2/search/variants"),
      req.body,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      },
    );

    res.send(response.data);
  } catch (error) {
    if (error.response) {
      logger.error(
        `API Error in /brapi/v2/search/variants: ${
          error.response.status
        } - ${JSON.stringify(error.response.data)}`,
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
        "API Error in /brapi/v2/search/variants: No response received",
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
    const token = getGigwaTokenFromBody(req.body);
    const response = await axios.post(
      buildGigwaRestUrl(selectedGigwaServer, "brapi/v2/search/samples"),
      req.body,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      },
    );

    res.send(response.data);
  } catch (error) {
    if (error.response) {
      logger.error(
        `API Error in /brapi/v2/search/samples: ${
          error.response.status
        } - ${JSON.stringify(error.response.data)}`,
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
        "API Error in /brapi/v2/search/samples: No response received",
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

    const token = getGigwaTokenFromQuery(req.query);

    const response = await axios.get(
      buildGigwaRestUrl(selectedGigwaServer, "brapi/v2/references"),
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        params,
      },
    );

    res.send(response.data);
  } catch (error) {
    if (error.response) {
      logger.error(
        `API Error in /brapi/v2/references: ${
          error.response.status
        } - ${JSON.stringify(error.response.data)}`,
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

    const token = getGigwaTokenFromQuery(req.query);
    const response = await axios.get(
      buildGigwaRestUrl(selectedGigwaServer, "brapi/v2/referencesets"),
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        params,
      },
    );

    res.send(response.data);
  } catch (error) {
    if (error.response) {
      logger.error(
        `API Error in /brapi/v2/referencesets: ${
          error.response.status
        } - ${JSON.stringify(error.response.data)}`,
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
        "API Error in /brapi/v2/referencesets: No response received",
      );
      res.status(500).send("API request failed: No response received");
    } else {
      logger.error(`API Error in /brapi/v2/referencesets: ${error.message}`);
      res.status(500).send("API request failed: " + error.message);
    }
  }
});

///////////////////////////////////////////////////////////////////////////////////////////////////
router.post("/searchSamplesInDatasets", async (req, res) => {
  const { accessions, accessionNames, selectedGigwaServer, accessionDoiPairs } =
    req.body;
  if (!selectedGigwaServer) {
    return res
      .status(400)
      .json({ error: "Please specify Gigwa server in your payload" });
  }

  if (!accessions || accessions.length === 0) {
    logger.error("No accessions provided");
    return res.status(400).send({ message: "No accessions provided" });
  }

  const runApiStep = async (stepName, apiCall) => {
    try {
      return await apiCall();
    } catch (error) {
      error.stepName = stepName;
      throw error;
    }
  };

  try {
    const token = getGigwaTokenFromBody(req.body);

    const samplesObj = await runApiStep(
      "Map accessions to genotype IDs",
      async () => {
        return await getGenotypeMappingsByAccessions(accessions);
      },
    );

    if (!samplesObj?.Samples || !Array.isArray(samplesObj.Samples)) {
      logger.error("Invalid response from genotype mapping resolver", {
        samplesObj,
      });

      return res.status(500).send({
        message:
          "Invalid response from genotype mapping resolver. Expected Samples array.",
        step: "Map accessions to genotype IDs",
      });
    }
    const genotypeIds = samplesObj.Samples.map((obj) => obj.Sample).filter(
      Boolean,
    );
    const Accessions = samplesObj.Samples.map((obj) => obj.Accession).filter(
      Boolean,
    );

    const accessionByGenotypeId = new Map(
      samplesObj.Samples.map((item) => [item.Sample, item.Accession]),
    );

    const doiByAccession = new Map(
      (accessionDoiPairs || []).map((item) => [item.accessionNumber, item.doi]),
    );

    const accessionPlusAccessionName =
      accessionNames && Object.keys(accessionNames).length > 0
        ? Object.entries(accessionNames)
            .filter(([key]) => Accessions.includes(key))
            .flatMap(([key, value]) => {
              return samplesObj.Samples.filter(
                (obj) => obj.Accession === key,
              ).map((obj) => `${value}§${key}§${obj.Sample}`);
            })
        : [];

    const numberOfMappedAccessions = Array.from(new Set(Accessions)).length;
    const numberOfGenesysAccessions = accessions.length;

    const variantSetsResponse = await runApiStep(
      "Fetch variant sets from Gigwa",
      async () => {
        return await axios.get(
          buildGigwaRestUrl(selectedGigwaServer, "brapi/v2/variantsets"),
          {
            headers: { Authorization: `Bearer ${token}` },
          },
        );
      },
    );

    const variantSets = variantSetsResponse.data?.result?.data;

    if (!Array.isArray(variantSets)) {
      logger.error("Invalid response from variantsets API", {
        responseData: variantSetsResponse.data,
      });

      return res.status(500).send({
        message: "Invalid response from Gigwa variantsets API.",
        step: "Fetch variant sets from Gigwa",
      });
    }

    const programDbIds = [
      ...new Set(variantSets.map((vs) => vs.variantSetDbId.split("§")[0])),
    ];

    const germplasmDbIds = [];

    for (const programId of programDbIds) {
      for (const genotypeId of genotypeIds) {
        germplasmDbIds.push(`${programId}§${genotypeId}`);
      }
    }

    const callsetSearchResponse = await runApiStep(
      "Search callsets in Gigwa",
      async () => {
        return await axios.post(
          buildGigwaRestUrl(selectedGigwaServer, "brapi/v2/search/callsets"),
          { germplasmDbIds },
          {
            headers: { Authorization: `Bearer ${token}` },
          },
        );
      },
    );

    const callsetResponse = callsetSearchResponse.data?.result?.data;

    if (!Array.isArray(callsetResponse)) {
      logger.error("Invalid response from callsets API", {
        responseData: callsetSearchResponse.data,
      });

      return res.status(500).send({
        message: "Invalid response from Gigwa callsets API.",
        step: "Search callsets in Gigwa",
      });
    }

    const sampleDbIds = callsetResponse.map((callset) => callset.sampleDbId);

    const sampleSearchResponse = await runApiStep(
      "Search samples in Gigwa",
      async () => {
        return await axios.post(
          buildGigwaRestUrl(selectedGigwaServer, "brapi/v2/search/samples"),
          { sampleDbIds },
          {
            headers: { Authorization: `Bearer ${token}` },
          },
        );
      },
    );

    const sampleResponse = sampleSearchResponse.data?.result?.data;

    if (!Array.isArray(sampleResponse)) {
      logger.error("Invalid response from samples API", {
        responseData: sampleSearchResponse.data,
      });

      return res.status(500).send({
        message: "Invalid response from Gigwa samples API.",
        step: "Search samples in Gigwa",
      });
    }

    const germplasmBySampleDbId = new Map(
      sampleResponse.map((s) => [s.sampleDbId, s.germplasmDbId]),
    );

    const studyDbIds = [
      ...new Set(
        callsetResponse
          .filter((callset) => callset.variantSetDbIds?.length)
          .map((callset) =>
            callset.variantSetDbIds[0].split("§").slice(0, 2).join("§"),
          ),
      ),
    ];

    let studyNamesByStudyDbId = new Map();

    if (studyDbIds.length > 0) {
      const studySearchResponse = await runApiStep(
        "Search studies in Gigwa",
        async () => {
          return await axios.post(
            buildGigwaRestUrl(selectedGigwaServer, "brapi/v2/search/studies"),
            { studyDbIds },
            {
              headers: { Authorization: `Bearer ${token}` },
            },
          );
        },
      );

      const studyResponse = studySearchResponse.data?.result?.data;

      if (!Array.isArray(studyResponse)) {
        logger.error("Invalid response from studies API", {
          responseData: studySearchResponse.data,
        });

        return res.status(500).send({
          message: "Invalid response from Gigwa studies API.",
          step: "Search studies in Gigwa",
        });
      }

      studyNamesByStudyDbId = new Map(
        studyResponse.map((study) => [study.studyDbId, study.studyName]),
      );
    }

    const combinedResult = callsetResponse.map((cs) => {
      const germplasmDbId = germplasmBySampleDbId.get(cs.sampleDbId) ?? null;
      const genotypeId = germplasmDbId?.split("§")[1] ?? null;

      const accessionNumber =
        genotypeId != null
          ? (accessionByGenotypeId.get(String(genotypeId)) ?? null)
          : null;

      const doi =
        accessionNumber != null
          ? (doiByAccession.get(accessionNumber) ?? null)
          : null;

      const studyDbId = cs.variantSetDbIds?.length
        ? cs.variantSetDbIds[0].split("§").slice(0, 2).join("§")
        : null;

      return {
        ...cs,
        germplasmDbId,
        accessionNumber,
        doi,
        studyDbId,
        studyName:
          studyDbId != null
            ? (studyNamesByStudyDbId.get(studyDbId) ?? null)
            : null,
        selectedGigwaServer: normaliseGigwaBaseUrl(selectedGigwaServer),
      };
    });

    const targetVariantSetDbIds = [
      ...new Set(callsetResponse.flatMap((cs) => cs.variantSetDbIds || [])),
    ];

    const genotypeIdsForSorting = [];
    const seen = new Set();

    sampleResponse.forEach((item) => {
      const genotypeId = item.germplasmDbId?.split("§")[1];

      if (genotypeId && !seen.has(genotypeId)) {
        seen.add(genotypeId);
        genotypeIdsForSorting.push(genotypeId);
      }
    });

    accessionPlusAccessionName.sort((a, b) => {
      const genotypeIdA = a.split("§")[2];
      const genotypeIdB = b.split("§")[2];

      const indexA = genotypeIdsForSorting.indexOf(genotypeIdA);
      const indexB = genotypeIdsForSorting.indexOf(genotypeIdB);

      return indexA - indexB;
    });

    const uniqueGermplasmPresence = [
      ...new Set(
        sampleResponse
          .map((individual) => individual.germplasmDbId?.split("§")[1])
          .filter(Boolean),
      ),
    ];

    const presentAccessions = [
      ...new Set(
        combinedResult.map((item) => item.accessionNumber).filter(Boolean),
      ),
    ];

    const numberOfPresentAccessions = presentAccessions.length;
    return res.send({
      combinedResult,
      uniqueGermplasmPresence,
      datasetNames: targetVariantSetDbIds,
      numberOfGenesysAccessions,
      numberOfPresentAccessions,
      numberOfMappedAccessions,
      accessionPlusAccessionName,
    });
  } catch (error) {
    const step = error.stepName || "Unknown step";

    const status = error.response?.status || 500;

    const apiMessage =
      error.response?.data?.message ||
      error.response?.data?.error ||
      error.response?.data?.metadata?.status?.[0]?.message ||
      error.message ||
      "Unknown API error";

    logger.error(`Error in /searchSamplesInDatasets at step: ${step}`, {
      step,
      status,
      message: apiMessage,
      url: error.config?.url,
      method: error.config?.method,
      responseData: error.response?.data,
    });

    if (status === 403) {
      return res.status(403).send({
        message: "Access denied. Please check your credentials.",
        step,
        url: error.config?.url,
      });
    }

    return res.status(status).send({
      message: apiMessage,
      step,
      url: error.config?.url,
    });
  }
});

///////////////////////////////////////////////////////////////////////////////////////////////////
router.post("/brapi/v2/search/allelematrix", async (req, res) => {
  try {
    const { selectedGigwaServer } = req.body;
    if (!selectedGigwaServer) {
      return res
        .status(400)
        .json({ error: "Please specify Gigwa server in your payload" });
    }

    const token = getGigwaTokenFromBody(req.body);

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
      buildGigwaRestUrl(selectedGigwaServer, "brapi/v2/search/allelematrix"),
      req.body,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      },
    );
    res.send(response.data);
  } catch (error) {
    if (error.response) {
      logger.error(
        `API Error in /brapi/v2/search/allelematrix: ${
          error.response.status
        } - ${JSON.stringify(error.response.data)}`,
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
        "API Error in /brapi/v2/search/allelematrix: No response received",
      );
      res.status(500).send("API request failed: No response received");
    } else {
      logger.error(
        `API Error in /brapi/v2/search/allelematrix: ${error.message}`,
      );
      res.status(500).send("API request failed: " + error.message);
    }
  }
});

///////////////////////////////////////////////////////////////////////////////////////////////////
router.post("/exportData", async (req, res) => {
  // Function to extract JSESSIONID from cookies
  const extractJSessionId = (setCookie) => {
    if (!Array.isArray(setCookie)) return "";
    for (const c of setCookie) {
      const m = /(?:^|;\s*)JSESSIONID=([^;]+)/i.exec(c);
      if (m && m[1]) return `JSESSIONID=${m[1]}`;
    }
    return "";
  };

  // Function to wait for the ZIP file to be complete
  const waitForZipComplete = async (
    url,
    headers,
    { timeoutMs, intervalMs, signal, getRequestTimeout },
  ) => {
    const deadline = Date.now() + timeoutMs;
    let lastLen = -1,
      stableCount = 0;

    const waitForNextPoll = () =>
      new Promise((resolve, reject) => {
        const timer = setTimeout(() => {
          signal.removeEventListener("abort", handleAbort);
          resolve();
        }, intervalMs);

        const handleAbort = () => {
          clearTimeout(timer);
          const error = new Error("Export cancelled");
          error.code = "ERR_CANCELED";
          reject(error);
        };

        signal.addEventListener("abort", handleAbort, { once: true });
        if (signal.aborted) handleAbort();
      });

    const headOnce = async () => {
      const resp = await axios.head(url, {
        headers,
        timeout: getRequestTimeout(),
        signal,
        validateStatus: () => true,
      });
      return {
        status: resp.status,
        len: Number(resp.headers["content-length"] || -1),
      };
    };

    while (Date.now() < deadline) {
      const { status, len } = await headOnce();
      if (status !== 200 || len <= 0) {
        await waitForNextPoll();
        continue;
      }

      // First 2 bytes must be 'PK'
      const first = await axios.get(url, {
        headers: {
          ...headers,
          Range: "bytes=0-1",
          "Accept-Encoding": "identity",
        },
        responseType: "arraybuffer",
        decompress: false,
        timeout: getRequestTimeout(),
        signal,
        validateStatus: () => true,
      });
      const fbuf = Buffer.from(first.data || []);
      const startOK =
        first.status === 206 &&
        fbuf.length >= 2 &&
        fbuf[0] === 0x50 &&
        fbuf[1] === 0x4b;
      if (!startOK) {
        await waitForNextPoll();
        continue;
      }

      // EOCD must be in the last <= 66KB
      const tailSize = Math.min(65536, len);
      const startByte = len - tailSize;
      const last = await axios.get(url, {
        headers: {
          ...headers,
          Range: `bytes=${startByte}-${len - 1}`,
          "Accept-Encoding": "identity",
        },
        responseType: "arraybuffer",
        decompress: false,
        timeout: getRequestTimeout(),
        signal,
        validateStatus: () => true,
      });
      const lbuf = Buffer.from(last.data || []);
      const tailOK =
        last.status === 206 &&
        lbuf.includes(Buffer.from([0x50, 0x4b, 0x05, 0x06]));
      if (!tailOK) {
        await waitForNextPoll();
        continue;
      }

      if (len === lastLen) stableCount++;
      else {
        stableCount = 0;
        lastLen = len;
      }
      if (stableCount >= 1) return;
      await waitForNextPoll();
    }
    const error = new Error("Timed out waiting for ZIP");
    error.code = "EXPORT_TIMEOUT";
    throw error;
  };

  let exportSlotAcquired = false;
  let exportTimedOut = false;
  let clientDisconnected = false;
  let overallTimeoutId;
  let exportAbortController;
  let handleClientDisconnect;

  try {
    const validation = validateExportDataBody(req.body);
    if (validation.error) {
      return res.status(400).json({ error: validation.error });
    }

    if (activeExportCount >= config.exportMaxConcurrent) {
      res.setHeader("Retry-After", "5");
      return res.status(503).json({
        error: "The export service is busy. Please try again shortly.",
      });
    }

    activeExportCount += 1;
    exportSlotAcquired = true;

    exportAbortController = new AbortController();
    handleClientDisconnect = () => {
      if (!res.writableEnded) {
        clientDisconnected = true;
        exportAbortController.abort();
      }
    };
    res.once("close", handleClientDisconnect);
    if (res.destroyed && !res.writableEnded) handleClientDisconnect();

    const exportDeadline = Date.now() + config.exportTotalTimeoutMs;
    overallTimeoutId = setTimeout(() => {
      exportTimedOut = true;
      exportAbortController.abort();
    }, config.exportTotalTimeoutMs);
    overallTimeoutId.unref?.();

    const getRequestTimeout = () =>
      Math.max(
        1,
        Math.min(
          config.exportUpstreamTimeoutMs,
          exportDeadline - Date.now(),
        ),
      );

    const {
      variantList = [],
      selectedCallSetDetails = [],
      linkagegroups = "",
      start = -1,
      end = -1,
      selectedGigwaServer,
      username,
      password,
    } = validation.value;

    const baseUrl = normaliseGigwaBaseUrl(selectedGigwaServer);
    const assemblyHeader = "0";

    let token = getGigwaTokenFromBody(validation.value);
    let cookieHeader = "";

    if (!token) {
      const gen = await axios.post(
        buildGigwaRestUrl(selectedGigwaServer, "gigwa/generateToken"),
        username && password ? { username, password } : undefined,
        {
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          timeout: getRequestTimeout(),
          signal: exportAbortController.signal,
          validateStatus: () => true,
        },
      );
      if (gen.status < 200 || gen.status >= 300) {
        const msg =
          typeof gen.data === "string" ? gen.data : JSON.stringify(gen.data);
        return res.status(gen.status).send(msg || "Failed to generate token");
      }
      token = typeof gen.data === "string" ? gen.data : gen.data?.token || "";
      const setCookie = gen.headers?.["set-cookie"] || [];
      cookieHeader = extractJSessionId(setCookie) || "";
    } else {
      const probe = await axios.post(
        buildGigwaRestUrl(selectedGigwaServer, "gigwa/generateToken"),

        undefined,
        {
          headers: { Accept: "application/json" },
          timeout: getRequestTimeout(),
          signal: exportAbortController.signal,
          validateStatus: () => true,
        },
      );
      const setCookie = probe.headers?.["set-cookie"] || [];
      cookieHeader = extractJSessionId(setCookie) || "";
    }

    const sampleList = selectedCallSetDetails
      .map((s) => (s.germplasmDbId || "").split("§")[1])
      .filter(Boolean);

    const joinedVariantList = Array.isArray(variantList)
      ? variantList.join(";")
      : String(variantList || "").trim();
    const variantSetId = selectedCallSetDetails[0].studyDbId;

    const body = {
      variantSetId,
      searchMode: 3,
      getGT: false,
      referenceName: linkagegroups || "",
      selectedVariantTypes: "",
      alleleCount: "",
      start,
      end,
      variantEffect: "",
      geneName: "",
      callSetIds: [],
      discriminate: [],
      groupName: [],
      pageSize: 100,
      pageToken: "0",
      sortBy: "",
      sortDir: "asc",
      selectedVariantIds: joinedVariantList,
      gtPattern: [],
      mostSameRatio: [],
      minMaf: [],
      maxMaf: [],
      minMissingData: [],
      maxMissingData: [],
      minHeZ: [],
      maxHeZ: [],
      annotationFieldThresholds: [],
      additionalCallSetIds: [],
      keepExportOnServer: false,
      exportFormat: "VCF",
      exportedIndividuals: sampleList,
      metadataFields: [],
    };
    const postResp = await axios.post(
      buildGigwaRestUrl(selectedGigwaServer, "gigwa/exportData"),
      body,
      {
        headers: {
          "Content-Type": "application/json;charset=UTF-8",
          Authorization: `Bearer ${token}`,
          "X-Requested-With": "XMLHttpRequest",
          Accept: "text/plain,*/*",
          assembly: assemblyHeader,
          ...(cookieHeader ? { Cookie: cookieHeader } : {}),
        },
        responseType: "text",
        timeout: getRequestTimeout(),
        signal: exportAbortController.signal,
        validateStatus: () => true,
      },
    );

    if (postResp.status < 200 || postResp.status >= 300) {
      const txt =
        typeof postResp.data === "string"
          ? postResp.data
          : JSON.stringify(postResp.data);
      return res.status(postResp.status).send(txt || "Upstream error");
    }

    const pathText = String(postResp.data || "").trim();
    if (!pathText.startsWith("/gigwa/") || !pathText.endsWith(".zip")) {
      return res
        .status(502)
        .send(pathText || "Unexpected payload from /exportData");
    }

    // Poll until complete
    const origin = new URL(baseUrl).origin;
    const downloadUrl = `${origin}${pathText}`;
    const dlHeaders = {
      Authorization: `Bearer ${token}`,
      assembly: assemblyHeader,
      Accept: "application/zip,application/octet-stream,*/*",
      "Accept-Encoding": "identity",
      ...(cookieHeader ? { Cookie: cookieHeader } : {}),
    };
    await waitForZipComplete(downloadUrl, dlHeaders, {
      timeoutMs: Math.max(1, exportDeadline - Date.now()),
      intervalMs: config.exportPollIntervalMs,
      signal: exportAbortController.signal,
      getRequestTimeout,
    });

    // Full download
    const zipResp = await axios.get(downloadUrl, {
      headers: dlHeaders,
      responseType: "stream",
      decompress: false,
      timeout: getRequestTimeout(),
      signal: exportAbortController.signal,
      validateStatus: () => true,
    });

    if (zipResp.status !== 200) {
      zipResp.data.destroy();
      return res.status(zipResp.status).send("Failed to fetch ZIP");
    }

    res.setHeader("Content-Encoding", "identity");
    res.setHeader(
      "Content-Type",
      zipResp.headers["content-type"] || "application/zip",
    );
    res.setHeader(
      "Content-Disposition",
      zipResp.headers["content-disposition"] ||
        'attachment; filename="export.zip"',
    );
    if (zipResp.headers["content-length"])
      res.setHeader("Content-Length", zipResp.headers["content-length"]);
    res.status(200);
    await pipeline(zipResp.data, res);
    return;
  } catch (error) {
    if (clientDisconnected) return;

    if (res.headersSent) {
      res.destroy(error);
      return;
    }

    if (
      exportTimedOut ||
      error?.code === "ECONNABORTED" ||
      error?.code === "EXPORT_TIMEOUT"
    ) {
      return res.status(504).json({
        error: "The export timed out while waiting for Gigwa.",
      });
    }

    if (error?.response) {
      const txt = Buffer.from(error.response.data || []).toString("utf8");
      return res
        .status(error.response.status)
        .send(txt || error.response.statusText);
    }
    return res
      .status(500)
      .send("API request failed: " + (error?.message || "Unknown error"));
  } finally {
    if (overallTimeoutId) clearTimeout(overallTimeoutId);
    if (handleClientDisconnect) {
      res.removeListener("close", handleClientDisconnect);
    }

    if (exportSlotAcquired) {
      activeExportCount -= 1;
    }
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
    let samples;
    let accessions;
    const token = getGigwaTokenFromBody(req.body);
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
          `${config.genolinkServer}${BASE_PATH}/api/internalApi/mapAccessionToGenotypeId`,
          {
            Accessions: accessions,
          },
        )
        .then((response) =>
          response.data.Samples.map((obj) => obj.Sample || []),
        );
    }

    const variantSetsResponse = await axios.get(
      buildGigwaRestUrl(selectedGigwaServer, "brapi/v2/variantsets"),
      {
        headers: { Authorization: `Bearer ${token}` },
      },
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
      buildGigwaRestUrl(selectedGigwaServer, "brapi/v2/search/samples"),
      {
        sampleNames,
        studyDbIds,
      },
      {
        headers: { Authorization: `Bearer ${token}` },
      },
    );
    const SamplesDatasetInfo = searchResponse.data.result.data.map((sample) => {
      const sampleName = sample.sampleName;
      const callSetDbId = sample.sampleDbId;
      const variantSetDbId = variantSetDbIds.filter((variantSetDbId) =>
        variantSetDbId.includes(sample.studyDbId),
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
