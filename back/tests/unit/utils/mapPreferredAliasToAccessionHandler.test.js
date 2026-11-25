const db = require("../../../models");
const logger = require("../../../middlewares/logger");
const handler = require("../../../utils/mapPreferredAliasToAccessionHandler");
const mockRequest = require("../../helpers/mockRequest");
const mockResponse = require("../../helpers/mockResponse");

jest.mock("../../../models", () => ({
  SampleAccession: { findAll: jest.fn() },
}));

jest.mock("../../../middlewares/logger", () => ({
  warn: jest.fn(),
  info: jest.fn(),
  error: jest.fn(),
}));

describe("mapPreferredAliasToAccessionHandler", () => {
  let req;
  let res;

  beforeEach(() => {
    jest.clearAllMocks();
    req = mockRequest();
    res = mockResponse();
  });

  it("returns 400 when preferredAliases is missing or empty", async () => {
    req.body.preferredAliases = [];

    await handler(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.send).toHaveBeenCalledWith({
      message: "preferredAlias list is required",
    });
    expect(db.SampleAccession.findAll).not.toHaveBeenCalled();
  });

  it("maps normalized preferred aliases to unique accessions", async () => {
    req.body.preferredAliases = [' "Alias One" ', "Alias Two"];
    db.SampleAccession.findAll.mockResolvedValue([
      { Accession: "ACC-1", PreferredAlias: "Alias One" },
      { Accession: "ACC-1", PreferredAlias: "Alias One" },
      { Accession: "ACC-2", PreferredAlias: "Alias Two" },
    ]);

    await handler(req, res);

    expect(db.SampleAccession.findAll).toHaveBeenCalledWith({
      attributes: ["Accession", "PreferredAlias"],
      where: { PreferredAlias: ["Alias One", "Alias Two"] },
      raw: true,
    });
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.send).toHaveBeenCalledWith(["ACC-1", "ACC-2"]);
  });

  it("returns 404 when no alias mapping exists", async () => {
    req.body.preferredAliases = ["Missing"];
    db.SampleAccession.findAll.mockResolvedValue([]);

    await handler(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.send).toHaveBeenCalledWith({
      message: "Mapping for given preferredAliases not found.",
    });
  });

  it("returns 500 when the lookup fails", async () => {
    const error = new Error("DB error");
    req.body.preferredAliases = ["Alias"];
    db.SampleAccession.findAll.mockRejectedValue(error);

    await handler(req, res);

    expect(logger.error).toHaveBeenCalledWith(
      "Error fetching preferred aliases:",
      error,
    );
    expect(res.status).toHaveBeenCalledWith(500);
  });
});
