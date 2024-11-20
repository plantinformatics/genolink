const logger = require("./logger");

const trackRequests = (req, res, next) => {
  logger.info(`Received request: ${req.method} ${req.path}`);
  next();
};

module.exports = trackRequests;
