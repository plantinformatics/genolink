jest.mock("../../../models", () => ({
  SampleAccession: { findAll: jest.fn() },
}));

const { Op } = require("sequelize");
const db = require("../../../models");
const {
  resolvePreferredAliasesForAccessions,
} = require("../../../utils/preferredAliasResolver");

describe("resolvePreferredAliasesForAccessions", () => {
  beforeEach(() => jest.clearAllMocks());

  test("returns a preferred alias or null for every requested accession", async () => {
    db.SampleAccession.findAll.mockResolvedValue([
      { Accession: "AGG1", PreferredAlias: "Alias One" },
      { Accession: "AGG1", PreferredAlias: "Later Alias" },
      { Accession: "AGG2", PreferredAlias: "   " },
    ]);

    await expect(
      resolvePreferredAliasesForAccessions([" AGG1 ", "AGG2", "AGG3"]),
    ).resolves.toEqual({
      AGG1: "Alias One",
      AGG2: null,
      AGG3: null,
    });

    expect(db.SampleAccession.findAll).toHaveBeenCalledWith({
      attributes: ["Accession", "PreferredAlias"],
      where: {
        Accession: { [Op.in]: ["AGG1", "AGG2", "AGG3"] },
        PreferredAlias: { [Op.ne]: null },
      },
      order: [["id", "ASC"]],
      raw: true,
    });
  });

  test("does not query for an empty accession list", async () => {
    await expect(resolvePreferredAliasesForAccessions([])).resolves.toEqual(
      {},
    );
    expect(db.SampleAccession.findAll).not.toHaveBeenCalled();
  });
});
