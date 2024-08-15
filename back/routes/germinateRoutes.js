const express = require('express');
const router = express.Router();
const germinate = require('../api/germinate');

router.use('/', germinate);

module.exports = router;
