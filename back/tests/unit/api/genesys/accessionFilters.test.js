const {
  app,
  request,
  axios,
  generateGenesysToken,
} = require("../../../helpers/setup");

describe("POST /accession/filters", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    generateGenesysToken.mockResolvedValue("fake-token");
  });

  it("should return filtered accession data successfully", async () => {
    axios.post.mockResolvedValueOnce({
      data: {
        content: [
          {
            id: 4767862,
            aliases: [{ name: "AFRICA MAYO", aliasType: "ACCENAME" }],
          },
        ],
      },
    });

    const res = await request(app).post("/api/genesys/accession/filters");

    expect(res.status).toBe(200);
    expect(res.body.content).toHaveLength(1);
    expect(res.body.content[0].aliases[0].name).toBe("AFRICA MAYO");
    expect(generateGenesysToken).toHaveBeenCalled();
    expect(axios.post).toHaveBeenCalledTimes(1);
  });

  it("should retry token and succeed on 401 error", async () => {
    axios.post
      .mockRejectedValueOnce({ response: { status: 401 } })
      .mockResolvedValueOnce({
        data: { content: [{ id: 1, aliases: [] }] },
      });

    const res = await request(app).post("/api/genesys/accession/filters");

    expect(axios.post).toHaveBeenCalledTimes(2);
    expect(res.status).toBe(200);
  });

  it("should return 500 on unexpected error", async () => {
    axios.post.mockRejectedValueOnce(new Error("Network error"));

    const res = await request(app).post("/api/genesys/accession/filters");

    expect(res.status).toBe(500);
    expect(res.text).toMatch(/API request failed/);
  });
});
