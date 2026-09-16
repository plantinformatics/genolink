const { app, request, axios } = require("../../../helpers/setup");

const isTokenRequest = (url) => url.endsWith("/oauth/token");

describe("GET /passportFilter/possibleValues", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns transformed suggestions on successful fetch", async () => {
    axios.post.mockImplementation((url) => {
      if (isTokenRequest(url)) {
        return Promise.resolve({ data: { access_token: "fake-token" } });
      }

      return Promise.resolve({
        data: {
          suggestions: {
            "institute.code": {
              terms: [{ term: "Inst1" }, { term: "Inst2" }],
            },
            "crop.shortName": { terms: [{ term: "CropA" }] },
            "taxonomy.genus": { terms: [{ term: "GenusX" }] },
            "countryOfOrigin.code3": { terms: [{ term: "USA" }] },
            sampStat: { terms: [{ term: "Status1" }] },
            storage: { terms: [{ term: "Cold" }] },
          },
        },
      });
    });

    const res = await request(app).get(
      "/api/genesys/passportFilter/possibleValues"
    );
    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      _text: "anything",
      institute: ["Inst1", "Inst2"],
      crop: ["CropA"],
      taxonomy: ["GenusX"],
      OriginOfMaterial: ["USA"],
      BiologicalStatus: ["Status1"],
      TypeOfGermplasmStorage: ["Cold"],
    });
    expect(
      axios.post.mock.calls.filter(([url]) => !isTokenRequest(url)),
    ).toHaveLength(1);
  });

  it("retries token and succeeds on 401 error", async () => {
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
        data: {
          suggestions: {
            "institute.code": { terms: [{ term: "Inst1" }] },
            "crop.shortName": { terms: [] },
            "taxonomy.genus": { terms: [] },
            "countryOfOrigin.code3": { terms: [] },
            sampStat: { terms: [] },
            storage: { terms: [] },
          },
        },
      });
    });

    const res = await request(app).get(
      "/api/genesys/passportFilter/possibleValues"
    );

    expect(apiCallCount).toBe(2);
    expect(res.status).toBe(200);
    expect(res.body.institute).toEqual(["Inst1"]);
  });

  it("returns 500 on other errors", async () => {
    axios.post.mockImplementation((url) => {
      if (isTokenRequest(url)) {
        return Promise.resolve({ data: { access_token: "fake-token" } });
      }

      return Promise.reject(new Error("Network error"));
    });

    const res = await request(app).get(
      "/api/genesys/passportFilter/possibleValues"
    );

    expect(res.status).toBe(500);
    expect(res.body.message).toBe("Genesys possible values request failed");
    expect(res.body.error.message).toBe("Network error");
  });
});
