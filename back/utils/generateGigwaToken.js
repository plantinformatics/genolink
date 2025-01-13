const axios = require("axios");
const config = require("../config/appConfig");
const logger = require("../middlewares/logger");

async function generateGigwaToken(username = "", password = "") {
    try {
        const body = username && password ? { username, password } : {};
        const response = axios.post(`${config.gigwaServer}/api/token`, body);
        const token = response.data.token;
        return token;
    } catch (error) {
        logger.error("Error fetching the token:", error.message);
        throw error;
    }
}

module.exports = generateGigwaToken;