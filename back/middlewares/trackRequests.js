const logger = require("./logger");

const getCleanPath = (req) => {
  return (req.originalUrl || req.url || req.path).split("?")[0];
};

const getMelbourneTimestamp = () => {
  return new Date().toLocaleString("en-AU", {
    timeZone: "Australia/Melbourne",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
};

const isStaticAsset = (path) => {
  const lowerPath = path.toLowerCase();

  return (
    lowerPath.includes("/assets/") ||
    lowerPath.endsWith(".js") ||
    lowerPath.endsWith(".css") ||
    lowerPath.endsWith(".map") ||
    lowerPath.endsWith(".png") ||
    lowerPath.endsWith(".jpg") ||
    lowerPath.endsWith(".jpeg") ||
    lowerPath.endsWith(".svg") ||
    lowerPath.endsWith(".ico") ||
    lowerPath.endsWith(".webp") ||
    lowerPath.endsWith(".gif") ||
    lowerPath.endsWith(".avif") ||
    lowerPath.endsWith(".woff") ||
    lowerPath.endsWith(".woff2") ||
    lowerPath.endsWith(".ttf") ||
    lowerPath.endsWith(".eot") ||
    lowerPath.endsWith(".json") ||
    lowerPath.endsWith(".txt") ||
    lowerPath.endsWith(".xml") ||
    lowerPath.endsWith(".pdf") ||
    lowerPath.endsWith(".csv")
  );
};

const getUsageCategory = (req) => {
  const path = getCleanPath(req);

  if (path.includes("/api/ping")) {
    return "health_check";
  }

  if (path.includes("/api/genesys/")) {
    return "passport_genesys_search";
  }

  if (path.includes("/api/gigwa/")) {
    return "genotype_gigwa_search";
  }

  if (path.includes("/api/internalApi/")) {
    return "internal_mapping_support";
  }

  if (path.includes("/api/")) {
    return "api_other";
  }

  if (req.method === "GET") {
    return "frontend_page_view";
  }

  return "frontend_other";
};

const trackRequests = (req, res, next) => {
  const path = getCleanPath(req);

  if (isStaticAsset(path)) {
    return next();
  }

  const startTime = Date.now();

  res.on("finish", () => {
    const durationMs = Date.now() - startTime;
    const category = getUsageCategory(req);

    logger.info(
      JSON.stringify({
        type: "request",
        timestamp: getMelbourneTimestamp(),
        method: req.method,
        path,
        originalUrl: req.originalUrl,
        statusCode: res.statusCode,
        responseTimeMs: durationMs,
        category,
      }),
    );
  });

  next();
};

module.exports = trackRequests;
