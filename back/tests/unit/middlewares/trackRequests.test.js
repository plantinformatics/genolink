const EventEmitter = require("events");

jest.mock("../../../middlewares/logger", () => ({
  info: jest.fn(),
}));

const logger = require("../../../middlewares/logger");
const trackRequests = require("../../../middlewares/trackRequests");

const makeResponse = () => {
  const response = new EventEmitter();
  response.statusCode = 200;
  response.headers = {};
  response.append = jest.fn((name, value) => {
    response.headers[name] = value;
  });
  return response;
};

describe("trackRequests traffic metadata", () => {
  beforeEach(() => {
    logger.info.mockClear();
  });

  test("sets an anonymous visitor cookie and records Cloudflare headers", () => {
    const previousSecret = process.env.ANALYTICS_HASH_SECRET;
    process.env.ANALYTICS_HASH_SECRET = "test-secret";
    const headers = {
      "user-agent": "Mozilla/5.0 Chrome/130.0",
      "cf-ray": "abc123-MEL",
      "cf-ipcountry": "AU",
      "cf-connecting-ip": "192.0.2.10",
      "x-forwarded-proto": "https",
    };
    const req = {
      method: "GET",
      path: "/",
      url: "/",
      originalUrl: "/",
      secure: false,
      socket: { remoteAddress: "198.51.100.20" },
      get: (name) => headers[name.toLowerCase()],
    };
    const res = makeResponse();
    const next = jest.fn();

    trackRequests(req, res, next);
    res.emit("finish");

    expect(next).toHaveBeenCalledTimes(1);
    expect(res.append).toHaveBeenCalledWith(
      "Set-Cookie",
      expect.stringContaining("genolink_visitor="),
    );
    expect(res.headers["Set-Cookie"]).toContain("Secure");

    const entry = JSON.parse(logger.info.mock.calls[0][0]);
    expect(entry).toMatchObject({
      category: "frontend_page_view",
      cfRay: "abc123-MEL",
      cfCountry: "AU",
      cloudflareHeadersPresent: true,
      clientIpSource: "cf-connecting-ip",
      trafficType: "unknown",
    });
    expect(entry.clientIpHash).not.toContain("192.0.2.10");

    if (previousSecret === undefined) {
      delete process.env.ANALYTICS_HASH_SECRET;
    } else {
      process.env.ANALYTICS_HASH_SECRET = previousSecret;
    }
  });

  test("marks a declared crawler as a likely bot", () => {
    const headers = { "user-agent": "Googlebot/2.1" };
    const req = {
      method: "GET",
      path: "/",
      url: "/",
      originalUrl: "/",
      secure: false,
      socket: { remoteAddress: "192.0.2.20" },
      get: (name) => headers[name.toLowerCase()],
    };
    const res = makeResponse();

    trackRequests(req, res, jest.fn());
    res.emit("finish");

    const entry = JSON.parse(logger.info.mock.calls[0][0]);
    expect(entry).toMatchObject({
      trafficType: "likely_bot",
      trafficReasons: ["known_automation_user_agent"],
    });
  });
});
