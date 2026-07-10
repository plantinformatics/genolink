const fs = require("fs");
const path = require("path");

const rawBase = process.env.BASE_PATH || "";
const BASE_PATH = rawBase.replace(/\/+$/, "");

const LOG_FILE =
  process.argv[2] || path.join(__dirname, "../logs/combined.log");

const CSV_OUTPUT_DIR = path.join(__dirname, "../reports/usage-csv");

const VISITS_CSV_FILE = path.join(CSV_OUTPUT_DIR, "genolink-daily-visits.csv");

const PASSPORT_GENESYS_CSV_FILE = path.join(
  CSV_OUTPUT_DIR,
  "genolink-daily-passport-genesys-searches.csv",
);

const GENOTYPE_CSV_FILE = path.join(
  CSV_OUTPUT_DIR,
  "genolink-daily-genotype-searches.csv",
);

const shouldIgnoreStatus = (statusCode) => {
  return !statusCode || Number(statusCode) >= 500;
};

const parseLogLine = (line) => {
  try {
    const outer = JSON.parse(line);

    if (!outer.message) {
      return null;
    }

    let inner;

    try {
      inner = JSON.parse(outer.message);
    } catch {
      return null;
    }

    if (inner.type !== "request") {
      return null;
    }

    return inner;
  } catch {
    return null;
  }
};

const normaliseDate = (timestamp) => {
  if (!timestamp) {
    return "Unknown";
  }

  const datePart = timestamp.split(",")[0];

  return datePart || "Unknown";
};

const parseAustralianDate = (dateString) => {
  const [day, month, year] = dateString.split("/").map(Number);

  return new Date(year, month - 1, day);
};

const formatAustralianDate = (date) => {
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();

  return `${day}/${month}/${year}`;
};

const sortDatesAscending = (dates) => {
  return [...dates].sort(
    (a, b) => parseAustralianDate(a) - parseAustralianDate(b),
  );
};

const getDateRange = (startTimestamp, endTimestamp) => {
  if (!startTimestamp || !endTimestamp) {
    return [];
  }

  const startDate = parseAustralianDate(normaliseDate(startTimestamp));

  const endDate = parseAustralianDate(normaliseDate(endTimestamp));

  const dates = [];

  const currentDate = new Date(startDate);

  while (currentDate <= endDate) {
    dates.push(formatAustralianDate(currentDate));

    currentDate.setDate(currentDate.getDate() + 1);
  }

  return dates;
};

const isFrontendEntryPage = (entry, cleanPath) => {
  if (entry.method !== "GET") {
    return false;
  }

  if (!BASE_PATH) {
    return cleanPath === "/";
  }

  return cleanPath === BASE_PATH || cleanPath === `${BASE_PATH}/`;
};

const incrementMetric = (object, key) => {
  object[key] = (object[key] || 0) + 1;
};

const generateReport = () => {
  if (!fs.existsSync(LOG_FILE)) {
    console.error(`Log file not found: ${LOG_FILE}`);
    process.exit(1);
  }

  const lines = fs.readFileSync(LOG_FILE, "utf8").split("\n").filter(Boolean);

  const metrics = {
    totalStructuredRequests: 0,

    totalPageAccesses: 0,
    successfulPageAccesses: 0,

    totalApiRequests: 0,
    successfulApiRequests: 0,

    categories: {},
    paths: {},
    statusCodes: {},

    dailyPageAccesses: {},
    dailyPassportGenesysSearches: {},
    dailyGenotypeSearches: {},

    invalidOrSuspiciousRoutes: 0,
    apiNotFound: 0,
    oldSuspiciousProbes: 0,

    responseTimes: [],

    startTimestamp: null,
    endTimestamp: null,
  };

  for (const line of lines) {
    const entry = parseLogLine(line);

    if (!entry) {
      continue;
    }

    metrics.totalStructuredRequests += 1;

    if (!metrics.startTimestamp) {
      metrics.startTimestamp = entry.timestamp;
    }

    metrics.endTimestamp = entry.timestamp;

    const category = entry.category || "unknown";
    const cleanPath = entry.path || "unknown";
    const statusCode = String(entry.statusCode || "unknown");
    const date = normaliseDate(entry.timestamp);

    incrementMetric(metrics.categories, category);
    incrementMetric(metrics.paths, cleanPath);
    incrementMetric(metrics.statusCodes, statusCode);

    if (typeof entry.responseTimeMs === "number") {
      metrics.responseTimes.push(entry.responseTimeMs);
    }

    if (category === "invalid_or_suspicious_route") {
      metrics.invalidOrSuspiciousRoutes += 1;
    }

    if (category === "api_not_found") {
      metrics.apiNotFound += 1;
    }

    if (category === "suspicious_probe") {
      metrics.oldSuspiciousProbes += 1;
    }

    const isPageAccess =
      category === "frontend_page_view" &&
      isFrontendEntryPage(entry, cleanPath);

    if (isPageAccess) {
      metrics.totalPageAccesses += 1;

      if (!shouldIgnoreStatus(entry.statusCode)) {
        metrics.successfulPageAccesses += 1;
      }

      incrementMetric(metrics.dailyPageAccesses, date);
    }

    if (category === "passport_genesys_search") {
      incrementMetric(metrics.dailyPassportGenesysSearches, date);
    }

    const isGenotypeAlleleMatrixSearch =
      category === "genotype_gigwa_search" &&
      cleanPath.includes("/allelematrix");

    if (isGenotypeAlleleMatrixSearch) {
      incrementMetric(metrics.dailyGenotypeSearches, date);
    }

    const isApiRequest = cleanPath.includes("/api/");

    if (isApiRequest) {
      metrics.totalApiRequests += 1;

      if (!shouldIgnoreStatus(entry.statusCode)) {
        metrics.successfulApiRequests += 1;
      }
    }
  }

  return metrics;
};

const sortObjectByValueDesc = (obj) => {
  return Object.entries(obj).sort((a, b) => b[1] - a[1]);
};

const calculateAverage = (values) => {
  if (!values.length) {
    return 0;
  }

  return Math.round(
    values.reduce((sum, value) => sum + value, 0) / values.length,
  );
};

const sumObjectValues = (obj) => {
  return Object.values(obj).reduce((sum, value) => sum + value, 0);
};

const printDailyMetric = (title, dailyMetric) => {
  console.log(`\n${title}`);
  console.log("------------------------------");

  const dates = sortDatesAscending(
    Object.keys(dailyMetric).filter((date) => date !== "Unknown"),
  );

  for (const date of dates) {
    console.log(`${date}: ${dailyMetric[date]}`);
  }

  console.log(`Total: ${sumObjectValues(dailyMetric)}`);
};

const generateMetricCsv = ({
  outputFile,
  valueHeader,
  dailyMetric,
  allDates,
}) => {
  const rows = [["Date", valueHeader]];

  for (const date of allDates) {
    rows.push([date, dailyMetric[date] || 0]);
  }

  const csvContent = rows.map((row) => row.join(",")).join("\n");

  fs.mkdirSync(path.dirname(outputFile), {
    recursive: true,
  });

  fs.writeFileSync(outputFile, csvContent, "utf8");

  return outputFile;
};

const generateCsvReports = (metrics) => {
  const allDates = getDateRange(metrics.startTimestamp, metrics.endTimestamp);

  const visitsCsv = generateMetricCsv({
    outputFile: VISITS_CSV_FILE,
    valueHeader: "Genolink Visits",
    dailyMetric: metrics.dailyPageAccesses,
    allDates,
  });

  const passportGenesysCsv = generateMetricCsv({
    outputFile: PASSPORT_GENESYS_CSV_FILE,
    valueHeader: "Passport / Genesys Search Activity",
    dailyMetric: metrics.dailyPassportGenesysSearches,
    allDates,
  });

  const genotypeCsv = generateMetricCsv({
    outputFile: GENOTYPE_CSV_FILE,
    valueHeader: "Genotype Allele Matrix Searches",
    dailyMetric: metrics.dailyGenotypeSearches,
    allDates,
  });

  return {
    visitsCsv,
    passportGenesysCsv,
    genotypeCsv,
  };
};

const printReport = (metrics) => {
  console.log("\n==============================");
  console.log("Genolink Usage Report");
  console.log("==============================\n");

  console.log(`Log file: ${LOG_FILE}`);
  console.log(`Base path: ${BASE_PATH || "/"}`);

  console.log(`From: ${metrics.startTimestamp || "No structured logs found"}`);

  console.log(`To:   ${metrics.endTimestamp || "No structured logs found"}`);

  console.log("\nMain Metrics");
  console.log("------------------------------");

  console.log(`Total structured requests: ${metrics.totalStructuredRequests}`);

  console.log(`Total Genolink page accesses: ${metrics.totalPageAccesses}`);

  console.log(
    `Successful Genolink page accesses: ${metrics.successfulPageAccesses}`,
  );

  console.log(`Total API requests: ${metrics.totalApiRequests}`);

  console.log(`Successful API requests: ${metrics.successfulApiRequests}`);

  console.log(
    `Invalid or suspicious routes: ${metrics.invalidOrSuspiciousRoutes}`,
  );

  console.log(`Unknown API routes: ${metrics.apiNotFound}`);

  console.log(`Old suspicious probes: ${metrics.oldSuspiciousProbes}`);

  console.log(
    `Average response time: ${calculateAverage(metrics.responseTimes)} ms`,
  );

  console.log("\nRequests by Category");
  console.log("------------------------------");

  for (const [category, count] of sortObjectByValueDesc(metrics.categories)) {
    console.log(`${category}: ${count}`);
  }

  console.log("\nStatus Codes");
  console.log("------------------------------");

  for (const [statusCode, count] of sortObjectByValueDesc(
    metrics.statusCodes,
  )) {
    console.log(`${statusCode}: ${count}`);
  }

  printDailyMetric("Daily Page Accesses", metrics.dailyPageAccesses);

  printDailyMetric(
    "Daily Passport / Genesys Search Activity",
    metrics.dailyPassportGenesysSearches,
  );

  printDailyMetric(
    "Daily Genotype Allele Matrix Searches",
    metrics.dailyGenotypeSearches,
  );

  console.log("\nTop Requested Paths");
  console.log("------------------------------");

  for (const [requestPath, count] of sortObjectByValueDesc(metrics.paths).slice(
    0,
    15,
  )) {
    console.log(`${requestPath}: ${count}`);
  }

  console.log("\n");
};

const main = () => {
  const metrics = generateReport();

  printReport(metrics);

  const csvFiles = generateCsvReports(metrics);

  console.log("CSV Reports");
  console.log("------------------------------");

  console.log(`1. Daily visits: ${csvFiles.visitsCsv}`);

  console.log(
    `2. Daily Passport / Genesys activity: ${csvFiles.passportGenesysCsv}`,
  );

  console.log(
    `3. Daily genotype allele matrix searches: ${csvFiles.genotypeCsv}`,
  );

  console.log("");
};

main();
