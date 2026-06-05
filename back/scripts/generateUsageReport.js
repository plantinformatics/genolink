const fs = require("fs");
const path = require("path");

const rawBase = process.env.BASE_PATH || "";
const BASE_PATH = rawBase.replace(/\/+$/, "");

const LOG_FILE =
  process.argv[2] || path.join(__dirname, "../logs/combined.log");

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
  if (!timestamp) return "Unknown";

  const datePart = timestamp.split(",")[0];
  return datePart || "Unknown";
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

    metrics.categories[category] = (metrics.categories[category] || 0) + 1;
    metrics.paths[cleanPath] = (metrics.paths[cleanPath] || 0) + 1;
    metrics.statusCodes[statusCode] =
      (metrics.statusCodes[statusCode] || 0) + 1;

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

      const date = normaliseDate(entry.timestamp);
      metrics.dailyPageAccesses[date] =
        (metrics.dailyPageAccesses[date] || 0) + 1;
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
  if (!values.length) return 0;

  return Math.round(
    values.reduce((sum, value) => sum + value, 0) / values.length,
  );
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

  console.log("\nDaily Page Accesses");
  console.log("------------------------------");
  for (const [date, count] of Object.entries(metrics.dailyPageAccesses)) {
    console.log(`${date}: ${count}`);
  }

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

const metrics = generateReport();
printReport(metrics);
