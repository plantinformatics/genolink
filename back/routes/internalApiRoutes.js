const express = require('express');
const router = express.Router();
const internalApi = require('../api/internalApi');

router.use('/', internalApi);

module.exports = router;
