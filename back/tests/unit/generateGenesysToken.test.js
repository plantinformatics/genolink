const axios = require("axios");
const generateGenesysToken = require("../../utils/generateGenesysToken");
const logger = require("../../middlewares/logger");

jest.mock("axios");
jest.mock("../../middlewares/logger");

describe("generateGenesysToken", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should fetch and return the access token successfully", async () => {
    const mockToken = "mock_access_token";
    axios.post.mockResolvedValue({ data: { access_token: mockToken } });

    const token = await generateGenesysToken();

    expect(axios.post).toHaveBeenCalledTimes(1);
    expect(token).toBe(mockToken);
  });

  it("should log error and rethrow if axios.post fails", async () => {
    const errorMessage = "Network Error";
    const error = new Error(errorMessage);
    axios.post.mockRejectedValue(error);

    await expect(generateGenesysToken()).rejects.toThrow(errorMessage);
    expect(logger.error).toHaveBeenCalledWith(
      "Error fetching the token:",
      errorMessage
    );
  });
});
