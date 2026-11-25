const {
  classifyTraffic,
  getRequestTrafficMetadata,
  hashValue,
  parseCookies,
  sanitiseReferrer,
} = require("../../../utils/requestTraffic");

describe("requestTraffic", () => {
  test("recognises common automated user agents", () => {
    expect(
      classifyTraffic({
        userAgent: "Mozilla/5.0 (compatible; Googlebot/2.1)",
        hasVisitorId: true,
      }),
    ).toEqual({
      trafficType: "likely_bot",
      trafficReasons: ["known_automation_user_agent"],
    });

    expect(
      classifyTraffic({ userAgent: "curl/8.5.0", hasVisitorId: false }),
    ).toMatchObject({ trafficType: "likely_bot" });
  });

  test("keeps uncertain requests as unknown", () => {
    expect(
      classifyTraffic({ userAgent: "", hasVisitorId: false }),
    ).toMatchObject({ trafficType: "unknown" });

    expect(
      classifyTraffic({
        userAgent: "Mozilla/5.0 Chrome/130.0",
        hasVisitorId: false,
      }),
    ).toMatchObject({ trafficType: "unknown" });
  });

  test("recognises a returning browser as likely human", () => {
    expect(
      classifyTraffic({
        userAgent: "Mozilla/5.0 Chrome/130.0",
        hasVisitorId: true,
      }),
    ).toMatchObject({ trafficType: "likely_human" });
  });

  test("parses cookies and creates stable secret hashes", () => {
    expect(parseCookies("one=1; genolink_visitor=visitor-123")).toEqual({
      one: "1",
      genolink_visitor: "visitor-123",
    });

    expect(hashValue("192.0.2.10", "secret")).toBe(
      hashValue("192.0.2.10", "secret"),
    );
    expect(hashValue("192.0.2.10", "secret")).not.toContain("192.0.2.10");
  });

  test("removes query strings from referrers", () => {
    expect(
      sanitiseReferrer("https://example.org/search?accession=sensitive"),
    ).toBe("https://example.org/search");
    expect(sanitiseReferrer("not-a-url")).toBe("");
  });

  test("reads and hashes Cloudflare request metadata", () => {
    const previousSecret = process.env.ANALYTICS_HASH_SECRET;
    process.env.ANALYTICS_HASH_SECRET = "test-secret";
    const headers = {
      "user-agent": "Mozilla/5.0 Chrome/130.0",
      referer: "https://example.org/",
      "cf-ray": "abc123-MEL",
      "cf-ipcountry": "AU",
      "cf-connecting-ip": "192.0.2.10",
    };
    const req = {
      get: (name) => headers[name.toLowerCase()],
      socket: { remoteAddress: "198.51.100.20" },
    };

    const metadata = getRequestTrafficMetadata(req, "visitor-123", true);

    expect(metadata).toMatchObject({
      userAgent: "Mozilla/5.0 Chrome/130.0",
      referrer: "https://example.org/",
      cfRay: "abc123-MEL",
      cfCountry: "AU",
      cloudflareHeadersPresent: true,
      clientIpSource: "cf-connecting-ip",
      trafficType: "likely_human",
    });
    expect(metadata.clientIpHash).not.toContain("192.0.2.10");
    expect(metadata.visitorIdHash).not.toContain("visitor-123");

    if (previousSecret === undefined) {
      delete process.env.ANALYTICS_HASH_SECRET;
    } else {
      process.env.ANALYTICS_HASH_SECRET = previousSecret;
    }
  });
});
