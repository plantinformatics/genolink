const express = require("express");
const router = express.Router();
const axios = require("axios");
const config = require("../config/appConfig");
const logger = require("../middlewares/logger");
const generateGenesysToken = require("../utils/generateGenesysToken");
const sampleNameToAccession = require("../utils/sampleNameToAccession");
const country2Region = require("../shared-data/Country2Region.json");
const { Op } = require("sequelize");
const db = require("../models");

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

const transformInitialToFinal = (initialbody) => {
  const finalbody = {};

  finalbody["_text"] = initialbody["_text"] || "";

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

async function fetchAllAccessionNumbers(finalbody, header) {
  const baseUrl = `${config.genesysServer}/api/v1/acn/query`;
  const limit = 10000;
  let allAccessionNumbers = [];

  try {
    // Fetch the first page to get totalPages
    const firstResponse = await axios.post(
      `${baseUrl}?p=0&l=${limit}&select=accessionNumber`,
      finalbody,
      header
    );
    const totalPages = firstResponse.data.totalPages || 1;

    // Extract accessionNumbers from the first page
    const pageData = firstResponse.data.content || [];
    allAccessionNumbers.push(...pageData.map((entry) => entry.accessionNumber));

    // Fetch remaining pages if any
    for (let page = 1; page < totalPages; page++) {
      const response = await axios.post(
        `${baseUrl}?p=${page}&l=${limit}&select=accessionNumber`,
        finalbody,
        header
      );
      const content = response.data.content || [];
      allAccessionNumbers.push(
        ...content.map((entry) => entry.accessionNumber)
      );
    }

    return allAccessionNumbers;
  } catch (error) {
    console.error("Error fetching accession numbers:", error.message);
    return [];
  }
}

router.get("/passportFilter/possibleValues", async (req, res) => {
  let url = `${config.genesysServer}/api/v1/acn/filter`;

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
      const result = await axios.post(url, { _text: " " }, header);
      const suggestions = result.data.suggestions;
      const output = {
        _text: "anything",
        institute:
          suggestions["institute.code"]?.terms.map((t) => t.term) || [],
        crop: suggestions["crop.shortName"]?.terms.map((t) => t.term) || [],
        taxonomy: suggestions["taxonomy.genus"]?.terms.map((t) => t.term) || [],
        OriginOfMaterial:
          suggestions["countryOfOrigin.code3"]?.terms.map((t) => t.term) || [],
        BiologicalStatus:
          suggestions["sampStat"]?.terms.map((t) => t.term) || [],
        TypeOfGermplasmStorage:
          suggestions["storage"]?.terms.map((t) => t.term) || [],
      };

      return output;
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
        const result = await axios.post(url, { _text: " " }, header);
        const suggestions = result.data.suggestions;
        const output = {
          _text: "anything",
          institute:
            suggestions["institute.code"]?.terms.map((t) => t.term) || [],
          crop: suggestions["crop.shortName"]?.terms.map((t) => t.term) || [],
          taxonomy:
            suggestions["taxonomy.genus"]?.terms.map((t) => t.term) || [],
          OriginOfMaterial:
            suggestions["countryOfOrigin.code3"]?.terms.map((t) => t.term) ||
            [],
          BiologicalStatus:
            suggestions["sampStat"]?.terms.map((t) => t.term) || [],
          TypeOfGermplasmStorage:
            suggestions["storage"]?.terms.map((t) => t.term) || [],
        };

        return output;
      }
      throw error; // Rethrow other errors
    }
  };

  try {
    const response = await sendRequestWithRetry();
    res.send(response);
  } catch (error) {
    logger.error(`API Error in /accession/filters: ${error}`);
    res.status(500).send("API request failed: " + error.message);
  }
});
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
    let body = req.body;
    const { genotypeIds } = body;
    if (Array.isArray(genotypeIds) && genotypeIds.length > 0) {
      body = {
        ...body,
        accessionNumbers: [
          ...(body.accessionNumbers || []),
          ...genotypeIds.map((Id) => sampleNameToAccession(Id)),
        ],
      };
    } else if (!genotypeIds && body.accessionNumbers) {
      body = {
        ...body,
        accessionNumbers: [...(body.accessionNumbers || [])],
      };
    } else {
      throw new Error(
        "Either genotypeIds or accessionNumbers must be provided."
      );
    }

    const accToGid = new Map();
    if (Array.isArray(genotypeIds)) {
      for (const gid of genotypeIds) {
        const acc = sampleNameToAccession(gid);
        if (!acc) continue;
        if (!accToGid.has(acc)) accToGid.set(acc, []);
        accToGid.get(acc).push(gid);
      }
    }

    const queryParams = [];

    if (req.query.p) queryParams.push(`p=${req.query.p}`);
    if (req.query.l) queryParams.push(`l=${req.query.l}`);
    if (req.query.s) queryParams.push(`s=${req.query.s}`);
    if (req.query.d) queryParams.push(`d=${req.query.d}`);
    if (req.query.f) queryParams.push(`d=${req.query.f}`);
    if (req.query.select)
      queryParams.push(
        `select=accessionNumber, countryOfOrigin.codeNum, ${req.query.select}`
      );
    else {
      queryParams.push(
        "select=instituteCode,accessionNumber,institute.fullName,taxonomy.taxonName,cropName,countryOfOrigin.name,lastModifiedDate,acquisitionDate,doi,institute.id,accessionName,institute.owner.name,genus,taxonomy.grinTaxonomySpecies.speciesName,taxonomy.grinTaxonomySpecies.name,crop.name,taxonomy.grinTaxonomySpecies.id,taxonomy.grinTaxonomySpecies.name,uuid,institute.owner.lastModifiedDate,institute.owner.createdDate,aliases,donorName, donorCode, sampStat, remarks.remark, countryOfOrigin.codeNum, region, subRegion, taxonomy.genus, taxonomy.species"
      );
    }

    let url = `${config.genesysServer}/api/v1/acn/query`;

    if (queryParams.length > 0) {
      url += `?${queryParams.join("&")}`;
    }

    const wantsRegion =
      !req.query.select || req.query.select.includes("region");
    const wantsSubRegion =
      !req.query.select || req.query.select.includes("subRegion");
    const wantsGenotypeStatus =
      !!req.query.select && req.query.select.includes("genotypeStatus");

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
            .filter((v) => typeof v === "string" && v.trim().length)
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

        // lookup region mapping
        const mapping = country2Region.find(
          (c) => c["country-code"] == row["countryOfOrigin.codeNum"]
        );

        if (wantsRegion && mapping) {
          base.region = mapping["region"] || "";
        }
        if (wantsSubRegion && mapping) {
          base.subRegion = mapping["sub-region"] || "";
        }
        if (statusMap) {
          const s = statusMap.get(row.accessionNumber);
          if (typeof s !== "undefined") base.genotypeStatus = s;
        }

        return base;
      });
    }
    res.send(data);
  } catch (error) {
    logger.error(`API Error in /accession/query: ${error}`);
    res.status(500).send("API request failed: " + error);
  }
});
///////////////////////////////////////////////////////////////////////////////////////////////
router.post("/passportQuery", async (req, res) => {
  try {
    const genesysToken = await getCachedToken();
    const initialbody = req.body;
    const finalbody = transformInitialToFinal(initialbody);
    const header = {
      headers: {
        Authorization: `Bearer ${genesysToken}`,
        "Content-Type": "application/json",
        Accept: "application/json, text/plain, */*",
        Origin: config.genolinkServer,
      },
    };
    const allAccessionNumbers = await fetchAllAccessionNumbers(
      finalbody,
      header
    );

    const samplesObj = await axios
      .post(
        `${config.genolinkServer}/api/internalApi/mapAccessionToGenotypeId`,
        {
          Accessions: allAccessionNumbers,
        }
      )
      .then((response) => response.data);

    res.send(samplesObj);
  } catch (error) {
    logger.error(`API Error in /passportQuery: ${error}`);
    res.status(500).send("API request failed: " + error);
  }
});

module.exports = router;
