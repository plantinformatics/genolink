const express = require('express');
const router = express.Router();
const multer = require('multer');
const upload = multer({ dest: "uploads/" });

const createSampleAccessionsHandler = require('../utils/createSampleAccessionsHandler');
const accessionMappingHandler = require('../utils/accessionMappingHandler');

// Route for creating sample accessions
router.post(
  "/createSampleAccessions",
  upload.single("file"),
  createSampleAccessionsHandler
);

// Route for mapping accessions
router.post("/accessionMapping", accessionMappingHandler);

module.exports = router;
