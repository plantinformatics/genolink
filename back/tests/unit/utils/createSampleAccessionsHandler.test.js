const db = require("../../../models");
const fs = require("fs");
const stream = require("stream");
const createSampleAccessionsHandler = require("../../../utils/createSampleAccessionsHandler");
const mockRequest = require("../../helpers/mockRequest");
const mockResponse = require("../../helpers/mockResponse");
const logger = require("../../../middlewares/logger");

jest.mock("../../../models", () => ({
  SampleAccession: {
    bulkCreate: jest.fn(),
  },
}));

jest.mock("../../../middlewares/logger", () => ({
  warn: jest.fn(),
  info: jest.fn(),
  error: jest.fn(),
}));

describe("createSampleAccessionsHandler", () => {
  let req, res;

  beforeEach(() => {
    req = mockRequest();
    res = mockResponse();
  });

  afterEach(() => {
    jest.clearAllMocks();
    if (fs.createReadStream.mockRestore) {
      fs.createReadStream.mockRestore();
    }
  });

  it("should return 400 if file validation error exists", async () => {
    req.fileValidationError = "Invalid file";
    await createSampleAccessionsHandler(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.send).toHaveBeenCalledWith({ message: "Invalid file" });
    expect(logger.error).toHaveBeenCalledWith(
      "File validation error:",
      "Invalid file"
    );
  });

  it("should return 400 if no file and no sampleAccessions in body", async () => {
    await createSampleAccessionsHandler(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.send).toHaveBeenCalledWith({
      message: "No file uploaded and no sample accessions provided in body.",
    });
    expect(logger.warn).toHaveBeenCalledWith(
      "No file uploaded and no sample accessions provided in body."
    );
  });

  it("should return 400 if file mimetype is not 'text/csv'", async () => {
    req.file = { mimetype: "application/pdf" };
    await createSampleAccessionsHandler(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.send).toHaveBeenCalledWith({
      message: "Please upload a CSV file.",
    });
    expect(logger.error).toHaveBeenCalledWith(
      "Invalid file type:",
      "application/pdf"
    );
  });

  it("should handle sample accessions provided in body correctly", async () => {
    req.body.sampleAccessions = [{ Accession: "Acc1", Sample: "Sample1" }];
    db.SampleAccession.bulkCreate.mockResolvedValue(req.body.sampleAccessions);

    await createSampleAccessionsHandler(req, res);

    expect(db.SampleAccession.bulkCreate).toHaveBeenCalledWith(
      req.body.sampleAccessions
    );
    expect(logger.info).toHaveBeenCalledWith(
      "Sample accessions provided in body created successfully."
    );
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.send).toHaveBeenCalledWith(req.body.sampleAccessions);
  });

  it("should return 400 if sampleAccessions array is empty", async () => {
    req.body.sampleAccessions = [];
    await createSampleAccessionsHandler(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.send).toHaveBeenCalledWith({
      message: "A list of sample accessions is required",
    });
    expect(logger.warn).toHaveBeenCalledWith(
      "A list of sample accessions is required."
    );
  });

  it("should return 400 if any sample accession item is missing Accession or Sample", async () => {
    req.body.sampleAccessions = [{ Accession: "Acc1" }];
    await createSampleAccessionsHandler(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.send).toHaveBeenCalledWith({
      message: "Each item must have an Accession and a Sample",
    });
    expect(logger.warn).toHaveBeenCalledWith(
      "Each item must have an Accession and a Sample."
    );
  });

  it("should handle bulkCreate error when sample accessions provided in body", async () => {
    req.body.sampleAccessions = [{ Accession: "Acc1", Sample: "Sample1" }];
    const bulkError = new Error("Bulk create failed");
    db.SampleAccession.bulkCreate.mockRejectedValue(bulkError);

    await createSampleAccessionsHandler(req, res);

    expect(logger.error).toHaveBeenCalledWith(
      "Error during the bulk create operation:",
      bulkError
    );
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.send).toHaveBeenCalledWith({
      message: "Error during the bulk create operation.",
    });
  });

  it("should handle CSV file upload and bulk create sample accessions", async () => {
    req.file = { path: "/fake/path.csv", mimetype: "text/csv" };

    jest.spyOn(fs, "createReadStream").mockImplementation(() => {
      const readable = new stream.Readable({
        encoding: "utf8",
        read() {
          this.push("accession,sample\n");
          this.push("Acc1,Sample1\n");
          this.push(null);
        },
      });

      return readable;
    });

    db.SampleAccession.bulkCreate.mockResolvedValue([
      { Accession: "Acc1", Sample: "Sample1" },
    ]);

    await createSampleAccessionsHandler(req, res);

    expect(db.SampleAccession.bulkCreate).toHaveBeenCalledWith([
      { Accession: "Acc1", Sample: "Sample1" },
    ]);
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.send).toHaveBeenCalledWith([
      { Accession: "Acc1", Sample: "Sample1" },
    ]);
  });

  it("should catch unknown errors", async () => {
    req.body.sampleAccessions = [{ Accession: "Acc1", Sample: "Sample1" }];

    const unknownError = new Error("Unexpected error");
    db.SampleAccession.bulkCreate.mockImplementation(() => {
      throw unknownError;
    });

    await createSampleAccessionsHandler(req, res);

    expect(logger.error).toHaveBeenCalledWith(
      "Error during the bulk create operation:",
      unknownError
    );
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.send).toHaveBeenCalledWith({
      message: "Error during the bulk create operation.",
    });
  });
});
