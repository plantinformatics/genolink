const crypto = require("crypto");

const VISITOR_COOKIE_NAME = "genolink_visitor";

const KNOWN_BOT_USER_AGENT =
  /bot\b|crawler|spider|slurp|bingpreview|facebookexternalhit|headlesschrome|phantomjs|selenium|puppeteer|playwright|curl\/|wget\/|python-requests|python-urllib|go-http-client|apache-httpclient|postmanruntime|uptimerobot|pingdom|statuscake|monitoring/i;

const parseCookies = (cookieHeader = "") => {
  return cookieHeader.split(";").reduce((cookies, part) => {
    const separator = part.indexOf("=");

    if (separator === -1) {
      return cookies;
    }

    const name = part.slice(0, separator).trim();
    const value = part.slice(separator + 1).trim();

    if (name) {
      try {
        cookies[name] = decodeURIComponent(value);
      } catch {
        cookies[name] = value;
      }
    }

    return cookies;
  }, {});
};

const hashValue = (value, secret) => {
  if (!value) {
    return null;
  }

  if (secret) {
    return crypto.createHmac("sha256", secret).update(value).digest("hex");
  }

  return crypto.createHash("sha256").update(value).digest("hex");
};

const sanitiseReferrer = (referrer) => {
  if (!referrer) {
    return "";
  }

  try {
    const url = new URL(referrer);
    return `${url.origin}${url.pathname}`;
  } catch {
    return "";
  }
};

const classifyTraffic = ({ userAgent, hasVisitorId }) => {
  if (KNOWN_BOT_USER_AGENT.test(userAgent || "")) {
    return {
      trafficType: "likely_bot",
      trafficReasons: ["known_automation_user_agent"],
    };
  }

  if (!userAgent) {
    return {
      trafficType: "unknown",
      trafficReasons: ["missing_user_agent"],
    };
  }

  if (!hasVisitorId) {
    return {
      trafficType: "unknown",
      trafficReasons: ["new_or_cookie_less_visitor"],
    };
  }

  return {
    trafficType: "likely_human",
    trafficReasons: ["browser_user_agent_and_visitor_cookie"],
  };
};

const getRequestTrafficMetadata = (req, visitorId, hasExistingVisitor) => {
  const userAgent = req.get("user-agent") || "";
  const referrer = sanitiseReferrer(req.get("referer") || "");
  const cfRay = req.get("cf-ray") || "";
  const cfCountry = req.get("cf-ipcountry") || "";
  const cfConnectingIp = req.get("cf-connecting-ip") || "";
  const directIp = req.socket?.remoteAddress || req.ip || "";
  const hashSecret = process.env.ANALYTICS_HASH_SECRET || "";
  const classification = classifyTraffic({
    userAgent,
    hasVisitorId: hasExistingVisitor,
  });

  return {
    userAgent,
    referrer,
    visitorIdHash: hashValue(visitorId, hashSecret),
    clientIpHash: hashSecret
      ? hashValue(cfConnectingIp || directIp, hashSecret)
      : null,
    clientIpSource: hashSecret
      ? cfConnectingIp
        ? "cf-connecting-ip"
        : "direct-connection"
      : "not_recorded_missing_hash_secret",
    cfRay,
    cfCountry,
    cloudflareHeadersPresent: Boolean(cfRay || cfConnectingIp),
    ...classification,
  };
};

const getOrCreateVisitor = (req, res) => {
  const cookies = parseCookies(req.get("cookie") || "");
  const existingVisitorId = cookies[VISITOR_COOKIE_NAME];

  if (existingVisitorId) {
    return { visitorId: existingVisitorId, isNewVisitor: false };
  }

  const visitorId = crypto.randomUUID();
  const secure =
    req.secure || req.get("x-forwarded-proto")?.split(",")[0].trim() === "https";
  const cookieParts = [
    `${VISITOR_COOKIE_NAME}=${encodeURIComponent(visitorId)}`,
    "Path=/",
    "Max-Age=31536000",
    "HttpOnly",
    "SameSite=Lax",
  ];

  if (secure) {
    cookieParts.push("Secure");
  }

  res.append("Set-Cookie", cookieParts.join("; "));

  return { visitorId, isNewVisitor: true };
};

module.exports = {
  VISITOR_COOKIE_NAME,
  classifyTraffic,
  getOrCreateVisitor,
  getRequestTrafficMetadata,
  hashValue,
  parseCookies,
  sanitiseReferrer,
};
