const { app, request, axios, generateGenesysToken } = require("../setup");

describe("GET /passportFilter/possibleValues", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    generateGenesysToken.mockResolvedValue("fake-token");
  });

  it("returns transformed suggestions on successful fetch", async () => {
    axios.post.mockResolvedValueOnce({
      data: {
        suggestions: {
          "institute.code": { terms: [{ term: "Inst1" }, { term: "Inst2" }] },
          "crop.shortName": { terms: [{ term: "CropA" }] },
          "taxonomy.genus": { terms: [{ term: "GenusX" }] },
          "countryOfOrigin.code3": { terms: [{ term: "USA" }] },
          sampStat: { terms: [{ term: "Status1" }] },
          storage: { terms: [{ term: "Cold" }] },
        },
      },
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
    expect(axios.post).toHaveBeenCalledTimes(1);
  });

  it("retries token and succeeds on 401 error", async () => {
    axios.post
      .mockRejectedValueOnce({ response: { status: 401 } }) // first fails with 401
      .mockResolvedValueOnce({
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
      }); // retry success

    const res = await request(app).get(
      "/api/genesys/passportFilter/possibleValues"
    );

    expect(axios.post).toHaveBeenCalledTimes(2);
    expect(res.status).toBe(200);
    expect(res.body.institute).toEqual(["Inst1"]);
  });

  it("returns 500 on other errors", async () => {
    axios.post.mockRejectedValueOnce(new Error("Network error"));

    const res = await request(app).get(
      "/api/genesys/passportFilter/possibleValues"
    );

    expect(res.status).toBe(500);
    expect(res.text).toMatch(/API request failed/);
  });
});
