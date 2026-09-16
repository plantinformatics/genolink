const { app, request, axios } = require("../../../helpers/setup");

const isTokenRequest = (url) => url.endsWith("/oauth/token");

describe("POST /accession/filters", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should return filtered accession data successfully", async () => {
    axios.post.mockImplementation((url) => {
      if (isTokenRequest(url)) {
        return Promise.resolve({ data: { access_token: "fake-token" } });
      }

      return Promise.resolve({
        data: {
          content: [
            {
              id: 4767862,
              aliases: [{ name: "AFRICA MAYO", aliasType: "ACCENAME" }],
            },
          ],
        },
      });
    });

    const res = await request(app).post("/api/genesys/accession/filters");

    expect(res.status).toBe(200);
    expect(res.body.content).toHaveLength(1);
    expect(res.body.content[0].aliases[0].name).toBe("AFRICA MAYO");
    expect(
      axios.post.mock.calls.filter(([url]) => !isTokenRequest(url)),
    ).toHaveLength(1);
  });

  it("should retry token and succeed on 401 error", async () => {
    let apiCallCount = 0;
    axios.post.mockImplementation((url) => {
      if (isTokenRequest(url)) {
        return Promise.resolve({ data: { access_token: "refreshed-token" } });
      }

      apiCallCount += 1;
      if (apiCallCount === 1) {
        return Promise.reject({ response: { status: 401 } });
      }

      return Promise.resolve({
        data: { content: [{ id: 1, aliases: [] }] },
      });
    });

    const res = await request(app).post("/api/genesys/accession/filters");

    expect(apiCallCount).toBe(2);
    expect(res.status).toBe(200);
  });

  it("should return 500 on unexpected error", async () => {
    axios.post.mockImplementation((url) => {
      if (isTokenRequest(url)) {
        return Promise.resolve({ data: { access_token: "fake-token" } });
      }

      return Promise.reject(new Error("Network error"));
    });

    const res = await request(app).post("/api/genesys/accession/filters");

    expect(res.status).toBe(500);
    expect(res.body.message).toBe("Genesys accession filters request failed");
    expect(res.body.error.message).toBe("Network error");
  });
});
