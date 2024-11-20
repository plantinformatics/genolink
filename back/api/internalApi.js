const express = require('express');
const router = express.Router();
const multer = require('multer');
const upload = multer({ dest: "uploads/" });

const createSampleAccessionsHandler = require('../utils/createSampleAccessionsHandler');
const accessionMappingHandler = require('../utils/accessionMappingHandler');

router.post(
  "/createSampleAccessions",
  upload.single("file"),
  createSampleAccessionsHandler
);

router.post("/accessionMapping", accessionMappingHandler);

module.exports = router;
