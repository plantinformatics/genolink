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

const rawBase = process.env.BASE_PATH || "";
const BASE_PATH = rawBase.replace(/\/+$/, "");
const distPath = path.join(__dirname, "dist");

app.use(cors());
app.use(express.json({ limit: "500mb" }));
app.use(trackRequests);

app.get(`${BASE_PATH}/api/ping`, (_req, res) =>
  res.json({ ok: true, base: BASE_PATH }),
);

app.use(`${BASE_PATH}/api`, routes);

app.use(
  BASE_PATH || "/",
  express.static(distPath, {
    index: false,
  }),
);

app.get(BASE_PATH || "/", (_req, res) => {
  res.sendFile(path.join(distPath, "index.html"));
});

if (BASE_PATH) {
  app.get(`${BASE_PATH}/`, (_req, res) => {
    res.sendFile(path.join(distPath, "index.html"));
  });
}

app.use((req, res) => {
  req.usageCategoryOverride = "invalid_or_suspicious_route";

  return res.status(404).json({
    error: "Not found",
  });
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
