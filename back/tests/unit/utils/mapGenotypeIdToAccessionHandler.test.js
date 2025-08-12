const db = require("../../../models");
const logger = require("../../../middlewares/logger");
const mapGenotypeIdToAccessionHandler = require("../../../utils/mapGenotypeIdToAccessionHandler");
const mockRequest = require("../../helpers/mockRequest");
const mockResponse = require("../../helpers/mockResponse");

jest.mock("../../../models", () => ({
  SampleAccession: {
    findAll: jest.fn(),
  },
}));

jest.mock("../../../middlewares/logger", () => ({
  warn: jest.fn(),
  info: jest.fn(),
  error: jest.fn(),
}));

describe("mapGenotypeIdToAccessionHandler", () => {
  let req, res;

  beforeEach(() => {
    jest.clearAllMocks();
    req = mockRequest();
    res = mockResponse();
  });

  it("returns 400 if genotypeIds is missing or empty", async () => {
    req.body.genotypeIds = [];
    await mapGenotypeIdToAccessionHandler(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.send).toHaveBeenCalledWith({
      message: "genotypeId list is required",
    });
    expect(logger.warn).toHaveBeenCalledWith(
      "genotypeId list was empty or not provided."
    );
    expect(db.SampleAccession.findAll).not.toHaveBeenCalled();
  });

  it("returns 404 if no matching accessions found", async () => {
    req.body.genotypeIds = ["id1", "id2"];
    db.SampleAccession.findAll.mockResolvedValue([]);

    await mapGenotypeIdToAccessionHandler(req, res);

    expect(db.SampleAccession.findAll).toHaveBeenCalledWith({
      where: { Sample: ["id1", "id2"] },
    });
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.send).toHaveBeenCalledWith({
      message: "Mapping for given genotypeIds not found.",
    });
    expect(logger.info).toHaveBeenCalledWith(
      "No accessions found for the provided list."
    );
  });

  it("returns 200 with accessions array on success", async () => {
    req.body.genotypeIds = ["id1", "id2"];
    const mockAccessions = [
      { Accession: "Accession1" },
      { Accession: "Accession2" },
    ];
    db.SampleAccession.findAll.mockResolvedValue(mockAccessions);

    await mapGenotypeIdToAccessionHandler(req, res);

    expect(db.SampleAccession.findAll).toHaveBeenCalledWith({
      where: { Sample: ["id1", "id2"] },
    });
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.send).toHaveBeenCalledWith(["Accession1", "Accession2"]);
  });

  it("handles errors with 500 and logs error", async () => {
    const error = new Error("DB error");
    req.body.genotypeIds = ["id1"];
    db.SampleAccession.findAll.mockRejectedValue(error);

    await mapGenotypeIdToAccessionHandler(req, res);

    expect(db.SampleAccession.findAll).toHaveBeenCalledWith({
      where: { Sample: ["id1"] },
    });
    expect(logger.error).toHaveBeenCalledWith("Error fetching samples:", error);
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.send).toHaveBeenCalledWith({ message: "Internal server error" });
  });
});
