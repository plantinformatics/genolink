require('dotenv').config();

module.exports = {
  gigwaServer: process.env.GIGWA_SERVER,
  germinateServer: process.env.GERMINATE_SERVER,
  genolinkServer: process.env.GENOLINK_SERVER,
  genesysServer: process.env.GENESYS_SERVER,
  genolinkServerPort: process.env.GENOLINK_SERVER_PORT || 3000,
};
