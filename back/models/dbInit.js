const { sequelize } = require('./index');
const logger = require('../middlewares/logger');

const dbInit = async () => {
    try {
        await sequelize.authenticate(); // Test the connection
        logger.info('Database connection has been established successfully.');
        await sequelize.sync(); // Sync models with the database
        logger.info('All models were synchronized successfully.');
    } catch (error) {
        logger.error('Unable to connect to the database:', error);
        process.exit(1); // Exit the app with an error code if the database connection fails
    }
};

module.exports = dbInit;
