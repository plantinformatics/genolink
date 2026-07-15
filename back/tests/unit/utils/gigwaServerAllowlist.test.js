const {
  normaliseGigwaBaseUrl,
  parseGigwaServers,
  requireAllowedGigwaServer,
} = require("../../../utils/gigwaServerAllowlist");

describe("gigwaServerAllowlist", () => {
  test("parses arrays, object values, and the legacy singular setting", () => {
    expect(
      parseGigwaServers(
        JSON.stringify({ first: "https://one.example/gigwa/" }),
        "http://localhost:8080/",
      ),
    ).toEqual(["https://one.example", "http://localhost:8080"]);
  });

  test("normalises only the optional trailing Gigwa application path", () => {
    expect(normaliseGigwaBaseUrl("https://example.org/base/gigwa/ ")).toBe(
      "https://example.org/base",
    );
  });

  test("rejects credentials, query strings, and non-HTTP protocols", () => {
    expect(() => normaliseGigwaBaseUrl("https://user@example.org")).toThrow();
    expect(() => normaliseGigwaBaseUrl("https://example.org?target=x")).toThrow();
    expect(() => normaliseGigwaBaseUrl("file:///etc/passwd")).toThrow();
  });

  test("returns the configured canonical URL and rejects other origins", () => {
    expect(
      requireAllowedGigwaServer("https://EXAMPLE.org/gigwa", [
        "https://example.org",
      ]),
    ).toBe("https://example.org");

    expect(() =>
      requireAllowedGigwaServer("https://evil.example", [
        "https://example.org",
      ]),
    ).toThrow(
      "This Gigwa server is not approved. Contact the system administrator to add it to GIGWA_SERVERS.",
    );
  });
});
