const axios = require("axios");
const config = require("../config/appConfig");
const logger = require("../middlewares/logger");

const generateGigwaToken = async (req) => {
  try {
    const username = req.body.username || req.query.username;
    const password = req.body.password || req.query.password;
 
    const response = await axios.post(
      `${config.gigwaServer}/gigwa/rest/gigwa/generateToken`,
      {
        username: username,
        password: password,
      }
    );
    if (response.data && response.data.token) {
      const token = response.data.token;
      logger.info("Token generated successfully.");
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

module.exports = generateGigwaToken;
