require("dotenv").config();

const { parseGigwaServers } = require("../utils/gigwaServerAllowlist");
const logger = require("../middlewares/logger");

const allowedGenotypeMappingSources = [
  "internal",
  "genesys",
  "hybrid_internal_first",
  "hybrid_genesys_first",
];

const defaultGenotypeMappingSource = "hybrid_internal_first";

const genotypeMappingSource =
  process.env.GENOTYPE_MAPPING_SOURCE || defaultGenotypeMappingSource;

const readPositiveInteger = (name, defaultValue) => {
  const value = Number(process.env[name] || defaultValue);

  if (!Number.isSafeInteger(value) || value < 1) {
    throw new Error(`${name} must be a positive integer.`);
  }

  return value;
};

const readHttpOrigin = (name) => {
  const value = process.env[name]?.trim();

  if (!value) {
    throw new Error(`${name} is required.`);
  }

  let url;
  try {
    url = new URL(value);
  } catch {
    throw new Error(`${name} must be a valid HTTP(S) origin.`);
  }

  if (
    !["http:", "https:"].includes(url.protocol) ||
    url.username ||
    url.password ||
    url.pathname !== "/" ||
    url.search ||
    url.hash
  ) {
    throw new Error(
      `${name} must contain only an HTTP(S) origin, without credentials, path, query, or fragment.`,
    );
  }

  return url.origin;
};

const exportMaxConcurrent = readPositiveInteger("EXPORT_MAX_CONCURRENT", 2);
const exportUpstreamTimeoutMs = readPositiveInteger(
  "EXPORT_UPSTREAM_TIMEOUT_MS",
  30000,
);
const exportTotalTimeoutMs = readPositiveInteger(
  "EXPORT_TOTAL_TIMEOUT_MS",
  600000,
);
const exportPollIntervalMs = readPositiveInteger(
  "EXPORT_POLL_INTERVAL_MS",
  2000,
);
const serverPort = readPositiveInteger("APP_PORT", 4000);
const accessionSubsetCacheDays = readPositiveInteger(
  "ACCESSION_SUBSET_CACHE_DAYS",
  30,
);
const genolinkOrigin = readHttpOrigin("GENOLINK_ORIGIN");

let gigwaServers = [];
try {
  gigwaServers = parseGigwaServers(
    process.env.GIGWA_SERVERS,
    (message) => logger.info(message),
  );
} catch (error) {
  logger.info(
    `Invalid Gigwa allowlist configuration; Gigwa access is disabled. ${error.message}`,
  );
}

if (!allowedGenotypeMappingSources.includes(genotypeMappingSource)) {
  throw new Error(
    `Invalid GENOTYPE_MAPPING_SOURCE "${genotypeMappingSource}". ` +
      `Allowed values are: ${allowedGenotypeMappingSources.join(", ")}`,
  );
}

module.exports = {
  gigwaServers,
  germinateServer: process.env.GERMINATE_SERVER,
  genesysServer: process.env.GENESYS_SERVER,
  genolinkOrigin,
  serverPort,
  internalServerOrigin: `http://127.0.0.1:${serverPort}`,
  jsonBodyLimit: process.env.JSON_BODY_LIMIT || "100mb",
  exportMaxConcurrent,
  exportUpstreamTimeoutMs,
  exportTotalTimeoutMs,
  exportPollIntervalMs,
  accessionSubsetCacheMs: accessionSubsetCacheDays * 24 * 60 * 60 * 1000,

  genotypeMappingSource,

  sampStatMapping: {
    100: "Wild",
    110: "Natural",
    120: "Semi-natural/wild",
    130: "Semi-natural/sown",
    200: "Weedy",
    300: "Traditional cultivar/Landrace",
    400: "Breeding/Research Material",
    410: "Breeders Line",
    411: "Synthetic population",
    412: "Hybrid",
    413: "Founder stock/base population",
    414: "Inbred line",
    415: "Segregating population",
    416: "Clonal selection",
    420: "Genetic stock",
    421: "Mutant",
    422: "Cytogenetic stocks",
    423: "Other genetic stocks",
    500: "Advanced/improved cultivar",
    600: "GMO",
    999: "Other",
  },
};
