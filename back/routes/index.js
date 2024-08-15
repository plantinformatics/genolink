const express = require('express');
const router = express.Router();

const internalApiRoutes = require('./internalApiRoutes');
const genesysRoutes = require('./genesysRoutes');
const gigwaRoutes = require('./gigwaRoutes');
const germinateRoutes = require('./germinateRoutes');

// Use the routes
router.use('/internalApi', internalApiRoutes); 
router.use('/genesys', genesysRoutes);
router.use('/gigwa', gigwaRoutes);
router.use('/germinate', germinateRoutes);

module.exports = router;
