const normaliseGigwaBaseUrl = (value) => {
  if (!value || typeof value !== "string") {
    throw new Error("Gigwa server URL must be a non-empty string.");
  }

  let url;
  try {
    url = new URL(value.trim());
  } catch {
    throw new Error("Gigwa server URL is invalid.");
  }

  if (!["http:", "https:"].includes(url.protocol)) {
    throw new Error("Gigwa server URL must use HTTP or HTTPS.");
  }

  if (url.username || url.password || url.search || url.hash) {
    throw new Error(
      "Gigwa server URL must not contain credentials, a query, or a fragment.",
    );
  }

  const pathname = url.pathname.replace(/\/+$/, "").replace(/\/gigwa$/i, "");
  url.pathname = pathname || "/";

  return url.toString().replace(/\/$/, "");
};

const parseGigwaServers = (rawServers, legacyServer, onInvalidServer) => {
  let configuredServers = [];

  if (rawServers) {
    let parsed;
    try {
      parsed = JSON.parse(rawServers);
    } catch {
      throw new Error("GIGWA_SERVERS must be valid JSON.");
    }

    if (Array.isArray(parsed)) {
      configuredServers = parsed;
    } else if (parsed && typeof parsed === "object") {
      configuredServers = Object.values(parsed);
    } else {
      throw new Error(
        "GIGWA_SERVERS must be a JSON array or an object whose values are URLs.",
      );
    }
  }

  const entries = configuredServers.map((value, index) => ({
    value,
    source: `GIGWA_SERVERS entry ${index + 1}`,
  }));

  if (legacyServer) {
    entries.push({ value: legacyServer, source: "GIGWA_SERVER" });
  }

  const normalisedServers = entries.flatMap(({ value, source }) => {
    try {
      return [normaliseGigwaBaseUrl(value)];
    } catch (error) {
      onInvalidServer?.(
        `Ignoring invalid ${source}. ${error.message}`,
      );
      return [];
    }
  });

  return [...new Set(normalisedServers)];
};

const requireAllowedGigwaServer = (selectedServer, allowedServers) => {
  const normalisedServer = normaliseGigwaBaseUrl(selectedServer);
  const allowed = new Set(allowedServers.map(normaliseGigwaBaseUrl));

  if (!allowed.has(normalisedServer)) {
    const error = new Error(
      "This Gigwa server is not approved. Contact the system administrator to add it to GIGWA_SERVERS.",
    );
    error.statusCode = 403;
    throw error;
  }

  return normalisedServer;
};

module.exports = {
  normaliseGigwaBaseUrl,
  parseGigwaServers,
  requireAllowedGigwaServer,
};
