const {
  accessionSubsetKey,
  cleanAccessionNumbers,
  createAccessionSubsetService,
} = require("../../../utils/accessionSubsets");

describe("accession subset service", () => {
  const currentTime = new Date("2026-08-28T00:00:00.000Z");

  const createCacheModel = (cachedRows = []) => ({
    findAll: jest.fn().mockResolvedValue(cachedRows),
    bulkCreate: jest.fn().mockResolvedValue(undefined),
  });

  it("cleans accession numbers and builds institute-specific keys", () => {
    expect(cleanAccessionNumbers([" A1 ", "A1", null, "A2"])).toEqual([
      "A1",
      "A2",
    ]);
    expect(accessionSubsetKey("A1", "INST1")).not.toBe(
      accessionSubsetKey("A1", "INST2"),
    );
  });

  it("uses fresh cached subsets without calling Genesys", async () => {
    const cacheModel = createCacheModel([
      {
        accessionNumber: "A1",
        instituteCode: "INST1",
        subsets: [{ uuid: "S1", title: "Cached subset" }],
      },
    ]);
    const fetchFromGenesys = jest.fn();
    const getSubsets = createAccessionSubsetService({
      cacheModel,
      cacheLifetimeMs: 30 * 24 * 60 * 60 * 1000,
      fetchFromGenesys,
      now: () => currentTime,
    });

    const result = await getSubsets([
      { accessionNumber: "A1", instituteCode: "INST1" },
    ]);

    expect(result[0].subsets).toEqual([
      { uuid: "S1", title: "Cached subset" },
    ]);
    expect(fetchFromGenesys).not.toHaveBeenCalled();
    expect(cacheModel.bulkCreate).not.toHaveBeenCalled();
  });

  it("keeps duplicate accession numbers separate by institute", async () => {
    const cacheModel = createCacheModel();
    const getSubsets = createAccessionSubsetService({
      cacheModel,
      cacheLifetimeMs: 1000,
      fetchFromGenesys: jest.fn().mockResolvedValue([
        {
          accessionNumber: "A1",
          instituteCode: "INST1",
          subsets: [{ uuid: "S1", title: "Subset 1" }],
        },
        { accessionNumber: "A1", instituteCode: "INST2", subsets: [] },
      ]),
      now: () => currentTime,
    });

    const result = await getSubsets(["A1"]);

    expect(result).toEqual([
      {
        accessionNumber: "A1",
        instituteCode: "INST1",
        subsets: [{ uuid: "S1", title: "Subset 1" }],
      },
      { accessionNumber: "A1", instituteCode: "INST2", subsets: [] },
    ]);
    expect(cacheModel.bulkCreate.mock.calls[0][0]).toHaveLength(2);
  });

  it("caches an empty result for a known accession and institute", async () => {
    const cacheModel = createCacheModel();
    const getSubsets = createAccessionSubsetService({
      cacheModel,
      cacheLifetimeMs: 1000,
      fetchFromGenesys: jest.fn().mockResolvedValue([]),
      now: () => currentTime,
    });

    const result = await getSubsets([
      { accessionNumber: "A1", instituteCode: "INST1" },
    ]);

    expect(result[0]).toEqual({
      accessionNumber: "A1",
      instituteCode: "INST1",
      subsets: [],
    });
    expect(cacheModel.bulkCreate.mock.calls[0][0][0]).toMatchObject({
      accessionNumber: "A1",
      instituteCode: "INST1",
      subsets: [],
    });
  });

  it("does nothing for an empty request", async () => {
    const cacheModel = createCacheModel();
    const fetchFromGenesys = jest.fn();
    const getSubsets = createAccessionSubsetService({
      cacheModel,
      cacheLifetimeMs: 1000,
      fetchFromGenesys,
    });

    await expect(getSubsets([])).resolves.toEqual([]);
    expect(cacheModel.findAll).not.toHaveBeenCalled();
    expect(fetchFromGenesys).not.toHaveBeenCalled();
  });
});
