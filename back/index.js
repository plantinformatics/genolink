const express = require("express");
const app = express();
const cors = require("cors");
const dbInit = require("./models/dbInit");
const routes = require("./routes");
const appConfig = require("./config/appConfig");
const trackRequests = require("./middlewares/trackRequests");
const errorHandler = require("./middlewares/errorHandler");
const path = require("path");
require("dotenv").config();
const logger = require("./middlewares/logger");

const rawBase = process.env.BASE_PATH || "";
const BASE_PATH = rawBase.replace(/\/+$/, "");

app.use(cors());
app.use(express.json({ limit: "500mb" }));
app.use(trackRequests);
app.use(`${BASE_PATH}/api`, routes);

app.get(`${BASE_PATH}/api/ping`, (_req, res) =>
  res.json({ ok: true, base: BASE_PATH })
);

app.use(
  BASE_PATH || "/",
  express.static(path.join(__dirname, "dist"), { index: "index.html" })
);

app.get(`${BASE_PATH}/*`, (req, res) => {
  res.sendFile(path.join(__dirname, "dist", "index.html"));
});

app.use(errorHandler);

module.exports = app;

if (require.main === module) {
  dbInit().then(() => {
    app.listen(appConfig.genolinkServerPort, () => {
      console.log(`Server listening on port ${appConfig.genolinkServerPort}`);
    });
  });
}
