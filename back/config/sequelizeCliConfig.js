const database = require("./dbConfig");

// sequelize-cli requires named environments. Genolink uses environment
// variables for every deployment, so each CLI environment shares the same
// connection settings.
module.exports = {
  development: database,
  test: database,
  production: database,
};
