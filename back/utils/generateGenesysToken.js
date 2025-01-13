const axios = require("axios");
const logger = require("../middlewares/logger");
const config = require("../config/appConfig");
const oidcConfig = {
    client_id: process.env.VITE_Genesys_OIDC_CLIENT_ID, 
    client_secret: process.env.VITE_Genesys_OIDC_CLIENT_SECRET, 
  };

  const generateGenesysToken = async () => {
    try {
        const url = `${config.genesysServer}/oauth/token`
        const body = {
            grant_type: 'client_credentials',
            client_id: oidcConfig.client_id,
            client_secret: oidcConfig.client_secret,
        }
        const headers = {
            "Content-Type": "application/x-www-form-urlencoded",
            Accept: "application/json, text/plain, */*",
        };
        const response = await axios.post(url, body, { headers }
        );
        const { access_token } = response.data;
        return access_token;

    }
    catch (error) {
        logger.error("Error fetching the token:", error.message);
        throw error;
    }
};

module.exports = generateGenesysToken;
