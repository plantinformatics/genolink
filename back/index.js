const express = require("express");
const app = express();
const cors = require("cors");
const dbInit = require("./models/dbInit");
const routes = require('./routes'); // This should import your centralized route definitions
const appConfig = require("./config/appConfig");
const trackRequests = require("./middlewares/trackRequests");
const errorHandler = require("./middlewares/errorHandler");
const path = require("path");

app.use(cors());
app.use(express.json());
app.use(trackRequests);
app.use('/api', routes);

// Serve static files from the dist folder
app.use(express.static(path.join(__dirname, 'dist')));

// Fallback to index.html for any other request that doesn't match API or static files
app.use('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.use(errorHandler);

// Database initialization and server start
dbInit().then(() => {
  app.listen(appConfig.genolinkServerPort, () => {
    console.log(`Server listening on port ${appConfig.genolinkServerPort}`);
  });
});
