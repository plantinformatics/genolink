const express = require('express');
const router = express.Router();
const genesys = require('../api/genesys');

router.use('/', genesys);

module.exports = router;
