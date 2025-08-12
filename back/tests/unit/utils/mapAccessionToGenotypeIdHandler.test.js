const mapAccessionToGenotypeIdHandler = require("../../../utils/mapAccessionToGenotypeIdHandler");
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

describe("mapAccessionToGenotypeIdHandler", () => {
  let req, res;
  let db, logger;

  beforeEach(() => {
    jest.clearAllMocks();
    db = require("../../../models");
    logger = require("../../../middlewares/logger");

    req = mockRequest();
    res = mockResponse();
  });

  it("should return 400 if no Accessions are provided", async () => {
    req.body = { Accessions: [] };
    await mapAccessionToGenotypeIdHandler(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.send).toHaveBeenCalledWith({
      message: "Accessions list is required",
    });
    expect(logger.warn).toHaveBeenCalledWith(
      "Accession list was empty or not provided."
    );
    expect(db.SampleAccession.findAll).not.toHaveBeenCalled();
  });

  it("should return 404 if no sample accessions are found (or none are completed)", async () => {
    req.body = { Accessions: ["Accession1"] };

    db.SampleAccession.findAll.mockResolvedValue([]);

    await mapAccessionToGenotypeIdHandler(req, res);

    expect(db.SampleAccession.findAll).toHaveBeenCalledWith({
      where: {
        Accession: ["Accession1"],
        Status: "Completed",
      },
    });

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.send).toHaveBeenCalledWith({
      message:
        "Mapping for given accessions not found or no completed accessions. Ensure accessions and samples are imported.",
    });
    expect(logger.info).toHaveBeenCalledWith(
      "No sample accessions found for the provided list or none are completed."
    );
  });

  it("should return 200 with sample data if accessions are found (Completed only)", async () => {
    req.body = { Accessions: ["Accession1"] };

    db.SampleAccession.findAll.mockResolvedValue([
      { Accession: "Accession1", Sample: "Sample1" },
    ]);

    await mapAccessionToGenotypeIdHandler(req, res);

    expect(db.SampleAccession.findAll).toHaveBeenCalledWith({
      where: {
        Accession: ["Accession1"],
        Status: "Completed",
      },
    });

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.send).toHaveBeenCalledWith({
      Samples: [{ Accession: "Accession1", Sample: "Sample1" }],
    });
    expect(logger.info).toHaveBeenCalledWith(
      expect.stringContaining("Accessions mapped successfully for request:")
    );
  });

  it("should handle server errors gracefully", async () => {
    req.body = { Accessions: ["Accession1"] };

    db.SampleAccession.findAll.mockRejectedValue(new Error("Database error"));

    await mapAccessionToGenotypeIdHandler(req, res);

    expect(db.SampleAccession.findAll).toHaveBeenCalledWith({
      where: {
        Accession: ["Accession1"],
        Status: "Completed",
      },
    });

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.send).toHaveBeenCalledWith({ message: "Internal server error" });
    expect(logger.error).toHaveBeenCalledWith(
      "Error fetching samples:",
      expect.any(Error)
    );
  });
});
