const express = require('express');
const router = express.Router();
const gigwa = require('../api/gigwa');

router.use('/', gigwa);

module.exports = router;
