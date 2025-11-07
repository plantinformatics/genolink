require("dotenv").config();

module.exports = {
  genolinkServer: process.env.GENOLINK_SERVER,
  genesysServer: process.env.GENESYS_SERVER,
  genolinkServerPort: process.env.GENOLINK_SERVER_PORT || 4000,
};
