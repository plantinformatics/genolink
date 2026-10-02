jest.mock("../../../models", () => ({
  SampleAccession: { findAll: jest.fn() },
  DatasetDoi: {},
}));

const db = require("../../../models");
const {
  resolveDatasetInfoForAccessions,
} = require("../../../utils/datasetDoiResolver");

describe("resolveDatasetInfoForAccessions", () => {
  beforeEach(() => jest.clearAllMocks());

  test("groups and deduplicates database DOI associations by accession", async () => {
    db.SampleAccession.findAll.mockResolvedValue([
      {
        Accession: "ACC 1",
        DatasetDois: [{ Doi: "10.1234/ONE" }, { Doi: "10.1234/TWO" }],
      },
      {
        Accession: "ACC 1",
        DatasetDois: [{ Doi: "10.1234/ONE" }],
      },
    ]);

    await expect(
      resolveDatasetInfoForAccessions([" ACC 1 ", "ACC 2", "ACC 1"]),
    ).resolves.toEqual({
      "ACC 1": [
        { doi: "10.1234/ONE", url: "https://doi.org/10.1234/ONE" },
        { doi: "10.1234/TWO", url: "https://doi.org/10.1234/TWO" },
      ],
      "ACC 2": [],
    });
  });

  test("does not query for an empty accession list", async () => {
    await expect(resolveDatasetInfoForAccessions([])).resolves.toEqual({});
    expect(db.SampleAccession.findAll).not.toHaveBeenCalled();
  });
});
