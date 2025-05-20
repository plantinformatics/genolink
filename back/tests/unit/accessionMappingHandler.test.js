const accessionMappingHandler = require("../../utils/accessionMappingHandler");
const mockRequest = require("../helpers/mockRequest");
const mockResponse = require("../helpers/mockResponse");

jest.mock("../../models", () => ({
  SampleAccession: {
    findAll: jest.fn(),
  },
}));

jest.mock("../../middlewares/logger", () => ({
  warn: jest.fn(),
  info: jest.fn(),
  error: jest.fn(),
}));

describe("accessionMappingHandler", () => {
  let req, res;
  let db, logger;

  beforeEach(() => {
    db = require("../../models");
    logger = require("../../middlewares/logger");

    req = mockRequest();
    res = mockResponse();
  });

  it("should return 400 if no Accessions are provided", async () => {
    req.body = { Accessions: [] };
    await accessionMappingHandler(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.send).toHaveBeenCalledWith({
      message: "Accessions list is required",
    });
    expect(logger.warn).toHaveBeenCalledWith(
      "Accession list was empty or not provided."
    );
  });

  it("should return 404 if no sample accessions are found", async () => {
    req.body = { Accessions: ["Accession1"] };

    db.SampleAccession.findAll.mockResolvedValue([]);

    await accessionMappingHandler(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.send).toHaveBeenCalledWith({
      message:
        "Mapping for given accessions not found. Ensure accessions and samples are imported.",
    });
    expect(logger.info).toHaveBeenCalledWith(
      "No sample accessions found for the provided list."
    );
  });

  it("should return 200 with sample data if accessions are found", async () => {
    req.body = { Accessions: ["Accession1"] };

    db.SampleAccession.findAll.mockResolvedValue([
      { Accession: "Accession1", Sample: "Sample1" },
    ]);

    await accessionMappingHandler(req, res);

    // Intentional mismatch in the expected status code
    expect(res.status).toHaveBeenCalledWith(200); // This part should pass

    // Changing the expected value to cause failure
    expect(res.send).toHaveBeenCalledWith({
      Samples: [{ Accession: "Accession1", Sample: "WrongSample" }], // Mismatch here
    });

    expect(logger.info).toHaveBeenCalledWith(
      expect.stringContaining("Accessions mapped successfully")
    );
  });

  it("should handle server errors gracefully", async () => {
    req.body = { Accessions: ["Accession1"] };

    db.SampleAccession.findAll.mockRejectedValue(new Error("Database error"));

    await accessionMappingHandler(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.send).toHaveBeenCalledWith({ message: "Internal server error" });
    expect(logger.error).toHaveBeenCalledWith(
      "Error fetching samples:",
      expect.any(Error)
    );
  });
});
