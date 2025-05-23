const express = require("express");
const app = express();
const cors = require("cors");
const dbInit = require("./models/dbInit");
const routes = require("./routes");
const appConfig = require("./config/appConfig");
const trackRequests = require("./middlewares/trackRequests");
const errorHandler = require("./middlewares/errorHandler");
const path = require("path");

app.use(cors());
app.use(express.json());
app.use(trackRequests);
app.use("/api", routes);

app.use(express.static(path.join(__dirname, "dist")));

app.use("*", (req, res) => {
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
