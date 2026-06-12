const axios = require("axios");

const config = require("../config/appConfig");
const logger = require("../middlewares/logger");

const BASE_PATH = process.env.BASE_PATH || "";

const normaliseAccessions = (accessions = []) => {
  if (!Array.isArray(accessions)) {
    return [];
  }

  return [
    ...new Set(
      accessions
        .filter((item) => typeof item === "string")
        .map((item) => item.trim())
        .filter(Boolean),
    ),
  ];
};

const normaliseSamples = (samples = [], source = "unknown") => {
  if (!Array.isArray(samples)) {
    return [];
  }

  return samples
    .filter((item) => item && typeof item === "object")
    .map((item) => ({
      Accession: item.Accession ?? item.accession ?? item.acceNumb ?? null,
      Sample: item.Sample ?? item.sample ?? item.genotypeId ?? null,
      Status: item.Status ?? item.status ?? "Completed",
      doi: item.doi ?? null,
      serverUrl: item.serverUrl ?? null,
      source: item.source ?? source,
    }))
    .filter((item) => item.Accession && item.Sample);
};

const getInternalMappingsByAccessions = async (accessions) => {
  const cleanedAccessions = normaliseAccessions(accessions);

  if (cleanedAccessions.length === 0) {
    return [];
  }

  try {
    const response = await axios.post(
      `${config.genolinkServer}${BASE_PATH}/api/internalApi/mapAccessionToGenotypeId`,
      {
        Accessions: cleanedAccessions,
      },
    );

    return normaliseSamples(response.data?.Samples, "internal");
  } catch (error) {
    if (error.response?.status === 404) {
      logger.info(
        "No internal genotype mappings found for provided accessions.",
      );
      return [];
    }

    logger.error("Error fetching internal genotype mappings:", {
      status: error.response?.status,
      message: error.response?.data?.message || error.message,
      url: error.config?.url,
    });

    throw error;
  }
};

const getGenesysMappingsByAccessions = async (accessions) => {
  const cleanedAccessions = normaliseAccessions(accessions);

  if (cleanedAccessions.length === 0) {
    return [];
  }

  const response = await axios.post(
    `${config.genolinkServer}${BASE_PATH}/api/genesys/genotype-ids`,
    {
      accessionNumbers: cleanedAccessions,
    },
  );

  return normaliseSamples(response.data?.Samples, "genesys");
};

const getMappedAccessionSet = (mappings = []) => {
  return new Set(mappings.map((item) => item.Accession).filter(Boolean));
};

const getMissingAccessions = (requestedAccessions = [], mappings = []) => {
  const mappedAccessions = getMappedAccessionSet(mappings);

  return requestedAccessions.filter(
    (accession) => !mappedAccessions.has(accession),
  );
};

const mergePrimaryWithFallback = (primaryMappings = [], fallbackMappings = []) => {
  const primaryMappedAccessions = getMappedAccessionSet(primaryMappings);

  const fallbackOnlyMappings = fallbackMappings.filter(
    (item) => !primaryMappedAccessions.has(item.Accession),
  );

  return [...primaryMappings, ...fallbackOnlyMappings];
};

const getHybridInternalFirstMappings = async (accessions) => {
  const cleanedAccessions = normaliseAccessions(accessions);

  const internalMappings = await getInternalMappingsByAccessions(
    cleanedAccessions,
  );

  const missingAccessions = getMissingAccessions(
    cleanedAccessions,
    internalMappings,
  );

  if (missingAccessions.length === 0) {
    return internalMappings;
  }

  const genesysMappings = await getGenesysMappingsByAccessions(
    missingAccessions,
  );

  return mergePrimaryWithFallback(internalMappings, genesysMappings);
};

const getHybridGenesysFirstMappings = async (accessions) => {
  const cleanedAccessions = normaliseAccessions(accessions);

  const genesysMappings = await getGenesysMappingsByAccessions(
    cleanedAccessions,
  );

  const missingAccessions = getMissingAccessions(
    cleanedAccessions,
    genesysMappings,
  );

  if (missingAccessions.length === 0) {
    return genesysMappings;
  }

  const internalMappings = await getInternalMappingsByAccessions(
    missingAccessions,
  );

  return mergePrimaryWithFallback(genesysMappings, internalMappings);
};

const getGenotypeMappingsByAccessions = async (
  accessions,
  mappingSource = config.genotypeMappingSource,
) => {
  const cleanedAccessions = normaliseAccessions(accessions);

  if (cleanedAccessions.length === 0) {
    return {
      Samples: [],
      totalRequestedAccessions: 0,
      totalMappedAccessions: 0,
      source: mappingSource,
    };
  }

  let Samples;

  if (mappingSource === "internal") {
    Samples = await getInternalMappingsByAccessions(cleanedAccessions);
  } else if (mappingSource === "genesys") {
    Samples = await getGenesysMappingsByAccessions(cleanedAccessions);
  } else if (mappingSource === "hybrid_internal_first") {
    Samples = await getHybridInternalFirstMappings(cleanedAccessions);
  } else if (mappingSource === "hybrid_genesys_first") {
    Samples = await getHybridGenesysFirstMappings(cleanedAccessions);
  } else {
    throw new Error(`Unsupported genotype mapping source: ${mappingSource}`);
  }

  return {
    Samples,
    totalRequestedAccessions: cleanedAccessions.length,
    totalMappedAccessions: getMappedAccessionSet(Samples).size,
    source: mappingSource,
  };
};

module.exports = {
  getGenotypeMappingsByAccessions,
  getInternalMappingsByAccessions,
  getGenesysMappingsByAccessions,
};