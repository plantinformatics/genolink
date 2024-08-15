const axios = require("axios");
const config = require("../config/appConfig");
const logger = require("../middlewares/logger");

const generateGerminateToken = async (req) => {
  try {
    const response = await axios.post(
      `${config.germinateServer}/api/token`, // Use the germinateServer configuration
      {
        username: req.body.username,
        password: req.body.password,
      }
    );

    if (response.data && response.data.token) {
      const token = response.data.token; // Extract only the token from the response
      logger.info(`Token generated successfully: ${token}`); // Log the token securely
      return token;
    } else {
      logger.error("Token not found in response");
      throw new Error("Token not found in response");
    }
  } catch (error) {
    logger.error("Error fetching the token:", error.message);
    throw error;
  }
};

module.exports = generateGerminateToken;
