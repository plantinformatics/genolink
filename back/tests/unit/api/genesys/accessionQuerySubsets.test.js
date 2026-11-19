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

  it("returns every unique genotype ID mapped to the same accession", async () => {
    const firstGenotypeId = "AGG413162BARL1-B00004-9-80";
    const secondGenotypeId = "AGG413162BARL1-B00030-4-40";

    axios.post.mockResolvedValueOnce({
      data: {
        content: [{ accessionNumber: "AGG 413162 BARL" }],
      },
    });

    const response = await request(app)
      .post(`${endpoint}?select=accessionNumber`)
      .send({
        genotypeIds: [
          firstGenotypeId,
          secondGenotypeId,
          firstGenotypeId,
        ],
      });

    expect(response.status).toBe(200);
    expect(response.body.content[0]).toMatchObject({
      accessionNumber: "AGG 413162 BARL",
      genotypeID: [firstGenotypeId, secondGenotypeId],
    });
    expect(response.body.content[0]).not.toHaveProperty("genotypeIDs");
  });

  it("keeps genotypeID as a string when one genotype ID is supplied", async () => {
    const genotypeId = "AGG413162BARL1-B00004-9-80";

    axios.post.mockResolvedValueOnce({
      data: {
        content: [{ accessionNumber: "AGG 413162 BARL" }],
      },
    });

    const response = await request(app)
      .post(`${endpoint}?select=accessionNumber`)
      .send({ genotypeIds: [genotypeId] });

    expect(response.status).toBe(200);
    expect(response.body.content[0].genotypeID).toBe(genotypeId);
    expect(response.body.content[0]).not.toHaveProperty("genotypeIDs");
  });

});
