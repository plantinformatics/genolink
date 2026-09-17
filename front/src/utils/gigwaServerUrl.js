export const normaliseGigwaBaseUrl = (serverUrl) => {
  if (!serverUrl || typeof serverUrl !== "string") {
    return null;
  }

  let url;

  try {
    url = new URL(serverUrl.trim());
  } catch {
    return null;
  }

  if (!["http:", "https:"].includes(url.protocol)) {
    return null;
  }

  if (url.username || url.password || url.search || url.hash) {
    return null;
  }

  const pathname = url.pathname.replace(/\/+$/, "").replace(/\/gigwa$/i, "");
  url.pathname = pathname || "/";

  return url.toString().replace(/\/$/, "");
};
