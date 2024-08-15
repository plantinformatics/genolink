const logger = require('./logger');
const checkCredentials = (req, res, next) => {
  const username = req.body.username || req.query.username;
  const password = req.body.password || req.query.password;

  if (!username || !password) {
    logger.warn(`Username or password not provided.`);
    return res.status(400).send(`Please provide your credentials.
        for example:
        {
            "username":"John",
            "password":"1234"
        } or as query parameters ?username=John&password=1234`);
  }
  next();
};
module.exports = checkCredentials;
