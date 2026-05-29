const express = require("express");
const router = express.Router();
const axios = require("axios");
const logger = require("../middlewares/logger");
const config = require("../config/appConfig");
const rawBase = process.env.BASE_PATH || "";
const BASE_PATH = rawBase.replace(/\/+$/, "");

const crypto = require("crypto");

const gigwaSessions = new Map();
const GIGWA_SESSION_TTL_MS = 4 * 60 * 60 * 1000; // 4 hours

const createGigwaSession = ({ selectedGigwaServer, token }) => {
  const gigwaSessionId = crypto.randomUUID();

  gigwaSessions.set(gigwaSessionId, {
    selectedGigwaServer,
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

  if (session.selectedGigwaServer !== selectedGigwaServer) {
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
    `${selectedGigwaServer}/gigwa/rest/gigwa/generateToken`,
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
      `${selectedGigwaServer}/gigwa/rest/brapi/v2/programs`,
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
      `${selectedGigwaServer}/gigwa/rest/brapi/v2/search/variantsets`,
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
      `${selectedGigwaServer}/gigwa/rest/brapi/v2/search/variants`,
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
      `${selectedGigwaServer}/gigwa/rest/brapi/v2/search/samples`,
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
      `${selectedGigwaServer}/gigwa/rest/brapi/v2/references`,
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
      `${selectedGigwaServer}/gigwa/rest/brapi/v2/referencesets`,
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
  const { accessions, accessionNames, selectedGigwaServer } = req.body;
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
    const token = getGigwaTokenFromBody(req.body);
    const samplesObj = await axios
      .post(
        `${config.genolinkServer}${BASE_PATH}/api/internalApi/mapAccessionToGenotypeId`,
        {
          Accessions: accessions,
        },
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
                (obj) => obj.Accession === key,
              ).map((obj) => `${value}§${key}§${obj.Sample}`);
            })
        : [];
    const numberOfMappedAccessions = Array.from(new Set(Accessions)).length;
    const numberOfGenesysAccessions = accessions.length;

    const variantSetsResponse = await axios.get(
      `${selectedGigwaServer}/gigwa/rest/brapi/v2/variantsets`,
      {
        headers: { Authorization: `Bearer ${token}` },
      },
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
      },
    );
    const response = searchResponse.data;

    const genotypeIdsForSorting = [];
    const seen = new Set();

    response.result.data.forEach((item) => {
      const genotypeId = item.germplasmDbId.split("§")[1];
      if (!seen.has(genotypeId)) {
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

    const uniqueSamplePresence = new Set(
      response.result.data.map(
        (individual) => individual.germplasmDbId.split("§")[1],
      ),
    );

    const numberOfPresentAccessions = uniqueSamplePresence.size;

    res.send({
      response,
      variantSetDbIds,
      datasetNames,
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
        `Unhandled API error in /searchSamplesInDatasets: ${error.message}`,
      );
      res.status(500).send("API request failed: " + error.message);
    }
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
      `${selectedGigwaServer}/gigwa/rest/brapi/v2/search/allelematrix`,
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
    { timeoutMs = 600000, intervalMs = 2000 },
  ) => {
    const deadline = Date.now() + timeoutMs;
    let lastLen = -1,
      stableCount = 0;

    const headOnce = async () => {
      const resp = await axios.head(url, {
        headers,
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
        await new Promise((r) => setTimeout(r, intervalMs));
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
        validateStatus: () => true,
      });
      const fbuf = Buffer.from(first.data || []);
      const startOK =
        first.status === 206 &&
        fbuf.length >= 2 &&
        fbuf[0] === 0x50 &&
        fbuf[1] === 0x4b;
      if (!startOK) {
        await new Promise((r) => setTimeout(r, intervalMs));
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
        validateStatus: () => true,
      });
      const lbuf = Buffer.from(last.data || []);
      const tailOK =
        last.status === 206 &&
        lbuf.includes(Buffer.from([0x50, 0x4b, 0x05, 0x06]));
      if (!tailOK) {
        await new Promise((r) => setTimeout(r, intervalMs));
        continue;
      }

      if (len === lastLen) stableCount++;
      else {
        stableCount = 0;
        lastLen = len;
      }
      if (stableCount >= 1) return;
      await new Promise((r) => setTimeout(r, intervalMs));
    }
    throw new Error("Timed out waiting for ZIP");
  };

  try {
    const {
      variantList = [],
      selectedSamplesDetails = [],
      linkagegroups = "",
      start = -1,
      end = -1,
      selectedGigwaServer,
      username,
      password,
    } = req.body;

    if (!selectedGigwaServer) {
      return res
        .status(400)
        .json({ error: "Please specify Gigwa server in your payload" });
    }

    const baseUrl = selectedGigwaServer.replace(/\/$/, "");
    const assemblyHeader = "0";

    const token = getGigwaTokenFromBody(req.body);
    let cookieHeader = "";

    if (!token) {
      const gen = await axios.post(
        `${baseUrl}/gigwa/rest/gigwa/generateToken`,
        username && password ? { username, password } : undefined,
        {
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
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
        `${baseUrl}/gigwa/rest/gigwa/generateToken`,
        undefined,
        { headers: { Accept: "application/json" }, validateStatus: () => true },
      );
      const setCookie = probe.headers?.["set-cookie"] || [];
      cookieHeader = extractJSessionId(setCookie) || "";
    }

    const sampleList = selectedSamplesDetails
      .map((s) => (s.germplasmDbId || "").split("§")[1])
      .filter(Boolean);

    const joinedVariantList = Array.isArray(variantList)
      ? variantList.join(";")
      : String(variantList || "").trim();
    const variantSetId = selectedSamplesDetails[0]?.studyDbId || "AGG_BARLEY§1";

    const body = {
      variantSetId,
      searchMode: 3,
      getGT: true,
      referenceName: linkagegroups || "",
      selectedVariantTypes: "",
      alleleCount: "",
      start: start ? start : -1,
      end: end ? end : -1,
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
      `${baseUrl}/gigwa/rest/gigwa/exportData`,
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
      timeoutMs: 600000,
      intervalMs: 2000,
    });

    // Full download
    const zipResp = await axios.get(downloadUrl, {
      headers: dlHeaders,
      responseType: "arraybuffer",
      decompress: false,
      validateStatus: () => true,
    });

    const buf = Buffer.from(zipResp.data || []);
    const isZip =
      zipResp.status === 200 &&
      buf.length >= 4 &&
      buf[0] === 0x50 &&
      buf[1] === 0x4b &&
      buf[2] === 0x03 &&
      buf[3] === 0x04;
    if (!isZip) {
      const t = Buffer.from(zipResp.data || []).toString("utf8");
      return res.status(zipResp.status).send(t || "Failed to fetch ZIP");
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
    return res.status(200).end(buf);
  } catch (error) {
    if (error?.response) {
      const txt = Buffer.from(error.response.data || []).toString("utf8");
      return res
        .status(error.response.status)
        .send(txt || error.response.statusText);
    }
    return res
      .status(500)
      .send("API request failed: " + (error?.message || "Unknown error"));
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
      `${selectedGigwaServer}/gigwa/rest/brapi/v2/variantsets`,
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
      `${selectedGigwaServer}/gigwa/rest/brapi/v2/search/samples`,
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
