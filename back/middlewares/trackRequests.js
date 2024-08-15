const logger = require("./logger");

// Middleware to log each request
const trackRequests = (req, res, next) => {
  logger.info(`Received request: ${req.method} ${req.path}`);
  next();
};

module.exports = trackRequests;
