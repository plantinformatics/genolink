const { app, request, axios } = require("../../../helpers/setup");
const config = require("../../../../config/appConfig");

describe("Gigwa server allowlist", () => {
  const originalGigwaServers = config.gigwaServers;

  beforeEach(() => {
    jest.clearAllMocks();
    config.gigwaServers = ["https://gigwa.example.org"];
  });

  afterAll(() => {
    config.gigwaServers = originalGigwaServers;
  });

  it("allows a configured server after canonicalising its URL", async () => {
    axios.post.mockResolvedValue({ data: { token: "upstream-token" } });

    const response = await request(app)
      .post("/api/gigwa/generateGigwaToken")
      .send({ selectedGigwaServer: "https://gigwa.example.org/gigwa/" });

    expect(response.statusCode).toBe(200);
    expect(response.body.gigwaSessionId).toEqual(expect.any(String));
    expect(axios.post).toHaveBeenCalledWith(
      "https://gigwa.example.org/gigwa/rest/gigwa/generateToken",
      undefined,
      expect.objectContaining({ timeout: 60000 }),
    );
  });

  it("rejects an unconfigured server without making an upstream request", async () => {
    const response = await request(app)
      .post("/api/gigwa/generateGigwaToken")
      .send({ selectedGigwaServer: "http://127.0.0.1:8080" });

    expect(response.statusCode).toBe(403);
    expect(response.body).toEqual({
      error:
        "This Gigwa server is not approved. Contact the system administrator to add it to GIGWA_SERVERS.",
    });
    expect(axios.post).not.toHaveBeenCalled();
  });

  it("rejects malformed server URLs", async () => {
    const response = await request(app)
      .post("/api/gigwa/generateGigwaToken")
      .send({ selectedGigwaServer: "not a URL" });

    expect(response.statusCode).toBe(400);
    expect(response.body).toEqual({ error: "Gigwa server URL is invalid." });
    expect(axios.post).not.toHaveBeenCalled();
  });

  it("fails closed when no servers are configured", async () => {
    config.gigwaServers = [];

    const response = await request(app)
      .post("/api/gigwa/generateGigwaToken")
      .send({ selectedGigwaServer: "https://gigwa.example.org" });

    expect(response.statusCode).toBe(403);
    expect(axios.post).not.toHaveBeenCalled();
  });
});
