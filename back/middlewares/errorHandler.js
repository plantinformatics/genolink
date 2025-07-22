const logger = require("./logger");

const errorHandler = (err, req, res, next) => {
  if (err.response && err.response.data) {
    logger.error(`API Error: ${err.response.data}`);
    return res
      .status(err.response.status || 500)
      .json({ error: err.response.data.message || "API error occurred." });
  }

  logger.error(`UnknownError: ${err.message}`);
  return res
    .status(err.status || 500)
    .json({ error: err.message || "Unknown server error occurred." });
};

module.exports = errorHandler;
