const { sequelize } = require("./index");
const logger = require("../middlewares/logger");

const dbInit = async () => {
    try {
        await sequelize.authenticate();
        logger.info("Database connection has been established successfully.");
    } catch (error) {
        logger.error("Unable to connect to the database:", error);
        process.exit(1);
    }
};

module.exports = dbInit;
