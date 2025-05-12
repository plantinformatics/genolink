require("dotenv").config();

module.exports = {
  gigwaServers: JSON.parse(process.env.GIGWA_SERVERS || "{}"),
  germinateServer: process.env.GERMINATE_SERVER,
  genolinkServer: process.env.GENOLINK_SERVER,
  genesysServer: process.env.GENESYS_SERVER,
  genolinkServerPort: process.env.GENOLINK_SERVER_PORT || 4000,
};
