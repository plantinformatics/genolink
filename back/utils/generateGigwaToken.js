const axios = require("axios");
const config = require("../config/appConfig");
const logger = require("../middlewares/logger");

async function generateGigwaToken(username = "", password = "") {
    try {
        const body = username && password ? { username, password } : undefined;
        const response = await axios.post(`${config.gigwaServer}/gigwa/rest/gigwa/generateToken`, body, {
            headers: {
                "Content-Type": "application/json",
                Accept: "application/json",
            },
        });
        const token = response.data.token;
        return token;
    } catch (error) {
        logger.error("Error fetching the token:", error.message);
        throw error;
    }
}

module.exports = generateGigwaToken;