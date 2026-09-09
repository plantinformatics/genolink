process.env.BASE_PATH = "";

jest.mock("axios");
jest.mock("../../../../middlewares/logger");

const axios = require("axios");
const app = require("../../../../index");
const request = require("supertest");

const endpoint = "/api/genesys/accession/query";

describe("POST /accession/query direct subset projection", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("passes the caller's page size and subsets.title directly to Genesys", async () => {
    axios.post
      .mockResolvedValueOnce({ data: { access_token: "fake-token" } })
      .mockResolvedValueOnce({
        data: {
          content: [
            {
              accessionNumber: "A1",
              "subsets.title": ["Core collection", "Mini core collection"],
            },
          ],
        },
      });

    const response = await request(app)
      .post(`${endpoint}?p=0&l=10000&select=accessionNumber,subsets.title`)
      .send({ accessionNumbers: ["A1"] });

    expect(response.status).toBe(200);
    expect(response.body.content[0]["subsets.title"]).toEqual([
      "Core collection",
      "Mini core collection",
    ]);
    expect(axios.post).toHaveBeenCalledTimes(2);
    expect(axios.post.mock.calls[1][0]).toContain("l=10000");
    expect(axios.post.mock.calls[1][0]).toContain("subsets.title");
    expect(axios.post.mock.calls[1][0]).not.toContain("/acn/list");
  });

  it("keeps select=subsets backward compatible with one Genesys query", async () => {
    axios.post.mockResolvedValueOnce({
      data: {
        content: [
          {
            accessionNumber: "A1",
            "subsets.uuid": ["S1", "S2"],
            "subsets.title": ["Core collection", "Mini core collection"],
          },
        ],
      },
    });

    const response = await request(app)
      .post(`${endpoint}?p=0&l=10000&select=accessionNumber,subsets`)
      .send({ accessionNumbers: ["A1"] });

    expect(response.status).toBe(200);
    expect(response.body.content[0].subsets).toEqual([
      { uuid: "S1", title: "Core collection" },
      { uuid: "S2", title: "Mini core collection" },
    ]);
    expect(response.body.content[0]).not.toHaveProperty("subsets.uuid");
    expect(response.body.content[0]).not.toHaveProperty("subsets.title");
    expect(axios.post).toHaveBeenCalledTimes(1);
    expect(axios.post.mock.calls[0][0]).toContain("subsets.uuid");
    expect(axios.post.mock.calls[0][0]).toContain("subsets.title");
  });

});
