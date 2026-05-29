const express = require("express");
const router = express.Router();
const axios = require("axios");
const https = require("https");

const config = require("../config/appConfig");
const logger = require("../middlewares/logger");
const sampleNameToAccession = require("../utils/sampleNameToAccession");
const country2Region = require("../shared-data/Country2Region.json");
const { Op } = require("sequelize");
const db = require("../models");

// Force IPv4 for Genesys API calls because the production server has no IPv6 route,
// and Node may attempt IPv6 connections which can cause AggregateError/ENETUNREACH.
const genesysHttpsAgent = new https.Agent({
  family: 4,
  keepAlive: true,
});

const GENESYS_TIMEOUT_MS = 60000;

const oidcConfig = {
  client_id: process.env.VITE_Genesys_OIDC_CLIENT_ID,
  client_secret: process.env.VITE_Genesys_OIDC_CLIENT_SECRET,
};

let cachedToken = null;
let cachedTokenExpiresAt = 0;

const TOKEN_LIFETIME_MS = 3 * 24 * 60 * 60 * 1000; // 3 days
const TOKEN_REFRESH_BUFFER_MS = 10 * 60 * 1000; // refresh 10 minutes early

const getErrorDetails = (error) => ({
  message: error.message,
  name: error.name,
  code: error.code,
  cause: error.cause,
  errors: error.errors,
  url: error.config?.url,
  method: error.config?.method,
  responseStatus: error.response?.status,
  responseData: error.response?.data,
});

const generateGenesysToken = async () => {
  try {
    const url = `${config.genesysServer}/oauth/token`;

    const body = new URLSearchParams({
      grant_type: "client_credentials",
      client_id: oidcConfig.client_id,
      client_secret: oidcConfig.client_secret,
    });

    const response = await axios.post(url, body.toString(), {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Accept: "application/json, text/plain, */*",
      },
      httpsAgent: genesysHttpsAgent,
      timeout: GENESYS_TIMEOUT_MS,
    });

    const { access_token } = response.data;

    if (!access_token) {
      throw new Error("Genesys token response did not include access_token");
    }

    return access_token;
  } catch (error) {
    logger.error(
      `Error fetching Genesys token: ${
        error.response
          ? `${error.response.status} - ${JSON.stringify(error.response.data)}`
          : JSON.stringify(getErrorDetails(error), null, 2)
      }`,
    );

    throw error;
  }
};

const getToken = async () => {
  const token = await generateGenesysToken();

  if (!token) {
    throw new Error("generateGenesysToken returned empty token");
  }

  return token;
};

const getCachedToken = async () => {
  const now = Date.now();

  if (!cachedToken || now >= cachedTokenExpiresAt - TOKEN_REFRESH_BUFFER_MS) {
    cachedToken = await getToken();
    cachedTokenExpiresAt = now + TOKEN_LIFETIME_MS;
  }

  return cachedToken;
};

const buildGenesysRequestOptions = (token) => ({
  headers: {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
    Accept: "application/json, text/plain, */*",
    Origin: config.genolinkServer,
  },
  httpsAgent: genesysHttpsAgent,
  timeout: GENESYS_TIMEOUT_MS,
});

const postToGenesysWithRetry = async (url, body) => {
  try {
    const token = await getCachedToken();

    return await axios.post(url, body, buildGenesysRequestOptions(token));
  } catch (error) {
    if (error.response && error.response.status === 401) {
      cachedToken = await getToken();
      cachedTokenExpiresAt = Date.now() + TOKEN_LIFETIME_MS;

      return await axios.post(
        url,
        body,
        buildGenesysRequestOptions(cachedToken),
      );
    }

    throw error;
  }
};

const buildQueryString = (params = {}) => {
  const queryParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      queryParams.set(key, value);
    }
  });

  const queryString = queryParams.toString();
  return queryString ? `?${queryString}` : "";
};

const transformInitialToFinal = (initialbody) => {
  const finalbody = {};

  finalbody._text = initialbody._text || "";

  if (initialbody.institute) {
    finalbody.institute = { code: initialbody.institute };
  }

  if (initialbody.startCreatedDate || initialbody.endCreatedDate) {
    finalbody.createdDate = {};

    if (initialbody.startCreatedDate) {
      finalbody.createdDate.ge = initialbody.startCreatedDate;
    }

    if (initialbody.endCreatedDate) {
      finalbody.createdDate.le = initialbody.endCreatedDate;
    }
  }

  if (initialbody.crop) {
    finalbody.crop = initialbody.crop;
  }

  if (initialbody.taxonomy) {
    finalbody.taxonomy = { genus: initialbody.taxonomy };
  }

  if (initialbody.countryOfOrigin) {
    finalbody.countryOfOrigin = { code3: initialbody.countryOfOrigin };
  }

  if (initialbody.sampStat) {
    finalbody.sampStat = [...initialbody.sampStat];
  }

  if (initialbody.storage) {
    finalbody.storage = initialbody.storage;
  }

  return finalbody;
};

async function fetchAllAccessionNumbers(finalbody) {
  const baseUrl = `${config.genesysServer}/api/v1/acn/query`;
  const limit = 10000;
  const allAccessionNumbers = [];

  try {
    const firstUrl = `${baseUrl}?p=0&l=${limit}&select=accessionNumber`;
    const firstResponse = await postToGenesysWithRetry(firstUrl, finalbody);

    const totalPages = firstResponse.data.totalPages || 1;
    const pageData = firstResponse.data.content || [];

    allAccessionNumbers.push(...pageData.map((entry) => entry.accessionNumber));

    for (let page = 1; page < totalPages; page++) {
      const pageUrl = `${baseUrl}?p=${page}&l=${limit}&select=accessionNumber`;
      const response = await postToGenesysWithRetry(pageUrl, finalbody);
      const content = response.data.content || [];

      allAccessionNumbers.push(
        ...content.map((entry) => entry.accessionNumber),
      );
    }

    return allAccessionNumbers;
  } catch (error) {
    logger.error(
      `Error fetching accession numbers: ${JSON.stringify(
        getErrorDetails(error),
        null,
        2,
      )}`,
    );

    return [];
  }
}

router.get("/passportFilter/possibleValues", async (req, res) => {
  const url = `${config.genesysServer}/api/v1/acn/filter`;

  try {
    const result = await postToGenesysWithRetry(url, { _text: " " });
    const suggestions = result.data.suggestions;

    const output = {
      _text: "anything",
      institute: suggestions["institute.code"]?.terms.map((t) => t.term) || [],
      crop: suggestions["crop.shortName"]?.terms.map((t) => t.term) || [],
      taxonomy: suggestions["taxonomy.genus"]?.terms.map((t) => t.term) || [],
      OriginOfMaterial:
        suggestions["countryOfOrigin.code3"]?.terms.map((t) => t.term) || [],
      BiologicalStatus: suggestions["sampStat"]?.terms.map((t) => t.term) || [],
      TypeOfGermplasmStorage:
        suggestions["storage"]?.terms.map((t) => t.term) || [],
    };

    res.send(output);
  } catch (error) {
    logger.error(
      `API Error in /passportFilter/possibleValues: ${JSON.stringify(
        getErrorDetails(error),
        null,
        2,
      )}`,
    );

    res.status(error.response?.status || 500).send({
      message: "Genesys possible values request failed",
      error: getErrorDetails(error),
    });
  }
});

router.post("/accession/filters", async (req, res) => {
  const queryString = buildQueryString({
    p: req.query.p,
    l: req.query.l,
    s: req.query.s,
    d: req.query.d,
    f: req.query.f,
  });

  const url = `${config.genesysServer}/api/v1/acn/filter${queryString}`;

  try {
    const response = await postToGenesysWithRetry(url, req.body);
    res.send(response.data);
  } catch (error) {
    logger.error(
      `API Error in /accession/filters: ${JSON.stringify(
        getErrorDetails(error),
        null,
        2,
      )}`,
    );

    res.status(error.response?.status || 500).send({
      message: "Genesys accession filters request failed",
      error: getErrorDetails(error),
    });
  }
});

router.post("/accession/query", async (req, res) => {
  try {
    let body = req.body || {};
    const { genotypeIds } = body;

    if (Array.isArray(genotypeIds) && genotypeIds.length > 0) {
      body = {
        ...body,
        accessionNumbers: [
          ...(body.accessionNumbers || []),
          ...genotypeIds.map((id) => sampleNameToAccession(id)),
        ],
      };
    } else if (!genotypeIds && body.accessionNumbers) {
      body = {
        ...body,
        accessionNumbers: [...(body.accessionNumbers || [])],
      };
    }

    const accToGid = new Map();

    if (Array.isArray(genotypeIds)) {
      for (const gid of genotypeIds) {
        const acc = sampleNameToAccession(gid);
        if (!acc) continue;

        if (!accToGid.has(acc)) {
          accToGid.set(acc, []);
        }

        accToGid.get(acc).push(gid);
      }
    }

    const queryParams = new URLSearchParams();

    if (req.query.p) queryParams.set("p", req.query.p);
    if (req.query.l) queryParams.set("l", req.query.l);
    if (req.query.s) queryParams.set("s", req.query.s);
    if (req.query.d) queryParams.set("d", req.query.d);
    if (req.query.f) queryParams.set("f", req.query.f);

    if (req.query.select) {
      const selectFields = [
        "accessionNumber",
        "countryOfOrigin.codeNum",
        ...String(req.query.select)
          .split(",")
          .map((field) => field.trim())
          .filter(Boolean),
      ];

      queryParams.set("select", [...new Set(selectFields)].join(","));
    } else {
      queryParams.set(
        "select",
        [
          "instituteCode",
          "accessionNumber",
          "institute.fullName",
          "taxonomy.taxonName",
          "cropName",
          "countryOfOrigin.name",
          "lastModifiedDate",
          "acquisitionDate",
          "doi",
          "institute.id",
          "accessionName",
          "institute.owner.name",
          "genus",
          "taxonomy.grinTaxonomySpecies.speciesName",
          "taxonomy.grinTaxonomySpecies.name",
          "crop.name",
          "taxonomy.grinTaxonomySpecies.id",
          "uuid",
          "institute.owner.lastModifiedDate",
          "institute.owner.createdDate",
          "aliases",
          "donorName",
          "donorCode",
          "sampStat",
          "remarks.remark",
          "countryOfOrigin.codeNum",
          "taxonomy.genus",
          "taxonomy.species",
        ].join(","),
      );
    }

    const queryString = queryParams.toString();
    let url = `${config.genesysServer}/api/v1/acn/query`;

    if (queryString) {
      url += `?${queryString}`;
    }

    const selectQuery = String(req.query.select || "");

    const wantsRegion = !selectQuery || selectQuery.includes("region");
    const wantsSubRegion = !selectQuery || selectQuery.includes("subRegion");
    const wantsGenotypeStatus = selectQuery.includes("genotypeStatus");
    const wantsSampStat = !selectQuery || selectQuery.includes("sampStat");

    const response = await postToGenesysWithRetry(url, body);
    const data = response.data;

    let statusMap = null;

    if (
      wantsGenotypeStatus &&
      Array.isArray(data?.content) &&
      data.content.length
    ) {
      const accessions = [
        ...new Set(
          data.content
            .map((r) => r.accessionNumber)
            .filter((v) => typeof v === "string" && v.trim().length),
        ),
      ];

      if (accessions.length) {
        const CHUNK = 1000;
        const results = [];

        for (let i = 0; i < accessions.length; i += CHUNK) {
          const chunk = accessions.slice(i, i + CHUNK);

          const rows = await db.SampleAccession.findAll({
            attributes: ["Accession", "Status"],
            where: { Accession: { [Op.in]: chunk } },
            raw: true,
          });

          results.push(...rows);
        }

        statusMap = new Map(results.map((r) => [r.Accession, r.Status]));
      }
    }

    if (Array.isArray(data?.content)) {
      data.content = data.content.map((row) => {
        const gids = accToGid.get(row.accessionNumber) || [];

        const base = {
          ...row,
          genotypeID: gids[0] || "",
        };

        const mapping = country2Region.find(
          (c) => c["country-code"] == row["countryOfOrigin.codeNum"],
        );

        if (wantsRegion && mapping) {
          base.region = mapping.region || "";
        }

        if (wantsSubRegion && mapping) {
          base.subRegion = mapping["sub-region"] || "";
        }

        if (statusMap) {
          const status = statusMap.get(row.accessionNumber);

          if (typeof status !== "undefined") {
            base.genotypeStatus = status;
          }
        }

        if (wantsSampStat) {
          const sampStatMapping = config.sampStatMapping || {};
          const mappedSampStat = sampStatMapping[row.sampStat];

          if (typeof mappedSampStat !== "undefined") {
            base.sampStat = mappedSampStat;
          }
        }

        return base;
      });
    }

    res.send(data);
  } catch (error) {
    logger.error(
      `API Error in /accession/query: ${JSON.stringify(
        getErrorDetails(error),
        null,
        2,
      )}`,
    );

    res.status(error.response?.status || 500).send({
      message: "Genesys accession query request failed",
      error: getErrorDetails(error),
    });
  }
});

router.post("/passportQuery", async (req, res) => {
  try {
    const initialbody = req.body;
    const finalbody = transformInitialToFinal(initialbody);

    const allAccessionNumbers = await fetchAllAccessionNumbers(finalbody);

    const samplesObj = await axios
      .post(
        `${config.genolinkServer}/api/internalApi/mapAccessionToGenotypeId`,
        {
          Accessions: allAccessionNumbers,
        },
        {
          timeout: GENESYS_TIMEOUT_MS,
        },
      )
      .then((response) => response.data);

    res.send(samplesObj);
  } catch (error) {
    logger.error(
      `API Error in /passportQuery: ${JSON.stringify(
        getErrorDetails(error),
        null,
        2,
      )}`,
    );

    res.status(error.response?.status || 500).send({
      message: "Passport query request failed",
      error: getErrorDetails(error),
    });
  }
});

router.post("/overview", async (req, res) => {
  const limit = req.query.l === undefined ? 100000 : Number(req.query.l);
  const body = req.body;
  const url = `${config.genesysServer}/api/v2/acn/overview?limit=${limit}`;

  try {
    const response = await postToGenesysWithRetry(url, body);
    res.send(response.data);
  } catch (error) {
    logger.error(
      `API Error in /overview: ${JSON.stringify(
        getErrorDetails(error),
        null,
        2,
      )}`,
    );

    res.status(error.response?.status || 500).send({
      message: "Genesys overview request failed",
      error: getErrorDetails(error),
    });
  }
});

router.post("/wiews/filter", async (req, res) => {
  const body = req.body;
  const url = `${config.genesysServer}/api/v2/wiews/filter`;

  try {
    const response = await postToGenesysWithRetry(url, body);
    res.send(response.data);
  } catch (error) {
    logger.error(
      `API Error in /wiews/filter: ${JSON.stringify(
        getErrorDetails(error),
        null,
        2,
      )}`,
    );

    res.status(error.response?.status || 500).send({
      message: "Genesys WIEWS filter request failed",
      error: getErrorDetails(error),
    });
  }
});

router.post("/wiews/decode", async (req, res) => {
  const body = req.body;
  const url = `${config.genesysServer}/api/v1/vocabulary/wiews/decode`;

  try {
    const response = await postToGenesysWithRetry(url, body);
    res.send(response.data);
  } catch (error) {
    logger.error(
      `API Error in /wiews/decode: ${JSON.stringify(
        getErrorDetails(error),
        null,
        2,
      )}`,
    );

    res.status(error.response?.status || 500).send({
      message: "Genesys WIEWS decode request failed",
      error: getErrorDetails(error),
    });
  }
});

router.post("/subset/filter", async (req, res) => {
  const body = req.body;

  const queryString = buildQueryString({
    p: req.query.p,
    l: req.query.l,
  });

  const url = `${config.genesysServer}/api/v2/subset/filter${queryString}`;

  try {
    const response = await postToGenesysWithRetry(url, body);
    res.send(response.data);
  } catch (error) {
    logger.error(
      `API Error in /subset/filter: ${JSON.stringify(
        getErrorDetails(error),
        null,
        2,
      )}`,
    );

    res.status(error.response?.status || 500).send({
      message: "Genesys subset filter request failed",
      error: getErrorDetails(error),
    });
  }
});

module.exports = router;
