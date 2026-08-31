const mockSubsetCache = {
  findAll: jest.fn(),
  bulkCreate: jest.fn(),
};

process.env.BASE_PATH = "";

jest.mock("../../../../models", () => ({
  AccessionSubsetCache: mockSubsetCache,
  SampleAccession: { findAll: jest.fn() },
}));
jest.mock("axios");
jest.mock("../../../../middlewares/logger");

const axios = require("axios");
const app = require("../../../../index");
const request = require("supertest");

const endpoint = "/api/genesys/accession/query";

describe("POST /accession/query subset enrichment", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSubsetCache.findAll.mockResolvedValue([]);
    mockSubsetCache.bulkCreate.mockResolvedValue(undefined);
  });

  it("does not check subsets unless they are selected", async () => {
    axios.post
      .mockResolvedValueOnce({ data: { access_token: "fake-token" } })
      .mockResolvedValueOnce({
        data: { content: [{ accessionNumber: "A1" }] },
      });

    const response = await request(app)
      .post(`${endpoint}?select=accessionNumber`)
      .send({ accessionNumbers: ["A1"] });

    expect(response.status).toBe(200);
    expect(response.body.content[0]).not.toHaveProperty("subsets");
    expect(mockSubsetCache.findAll).not.toHaveBeenCalled();
  });

  it("removes subsets from the upstream select and enriches the response", async () => {
    axios.post
      .mockResolvedValueOnce({
        data: {
          content: [
            { accessionNumber: "A1", instituteCode: "INST1", cropName: "wheat" },
          ],
        },
      })
      .mockResolvedValueOnce({
        data: {
          content: [
            {
              accessionNumber: "A1",
              instituteCode: "INST1",
              subsets: [{ uuid: "S1", title: "Core collection" }],
            },
          ],
          totalPages: 1,
        },
      });

    const response = await request(app)
      .post(`${endpoint}?select=accessionNumber,cropName,subsets`)
      .send({ accessionNumbers: ["A1"] });

    expect(response.status).toBe(200);
    expect(response.body.content[0].subsets).toEqual([
      { uuid: "S1", title: "Core collection" },
    ]);
    expect(axios.post.mock.calls[0][0]).not.toContain("subsets");
    expect(axios.post.mock.calls[0][0]).toContain("instituteCode");
    expect(axios.post.mock.calls[1][0]).toContain("/api/v2/acn/list?p=0&l=1000");
  });

  it("shares cached subsets with the dedicated endpoint", async () => {
    mockSubsetCache.findAll.mockResolvedValue([
      {
        accessionNumber: "A1",
        instituteCode: "INST1",
        subsets: [{ uuid: "S1", title: "Cached subset" }],
      },
    ]);

    const response = await request(app)
      .post("/api/genesys/accession/subsets")
      .send({ accessionNumbers: ["A1"] });

    expect(response.status).toBe(200);
    expect(response.body).toEqual([
      {
        accessionNumber: "A1",
        instituteCode: "INST1",
        subsets: [{ uuid: "S1", title: "Cached subset" }],
      },
    ]);
    expect(axios.post).not.toHaveBeenCalled();
  });

  it("splits cold Genesys list requests into batches of 1000", async () => {
    const accessions = Array.from({ length: 1001 }, (_, index) => `A${index}`);
    axios.post
      .mockResolvedValueOnce({
        data: {
          content: accessions.map((accessionNumber) => ({
            accessionNumber,
            instituteCode: "INST1",
          })),
        },
      })
      .mockResolvedValueOnce({ data: { content: [], totalPages: 1 } })
      .mockResolvedValueOnce({ data: { content: [], totalPages: 1 } });

    const response = await request(app)
      .post(`${endpoint}?select=accessionNumber,subsets`)
      .send({ accessionNumbers: accessions });

    expect(response.status).toBe(200);
    const listCalls = axios.post.mock.calls.filter(([url]) =>
      url.includes("/api/v2/acn/list"),
    );
    expect(listCalls).toHaveLength(2);
    expect(listCalls[0][1].accessionNumbers).toHaveLength(1000);
    expect(listCalls[1][1].accessionNumbers).toHaveLength(1);
  });
});
