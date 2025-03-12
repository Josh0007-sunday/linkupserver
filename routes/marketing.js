const express = require('express');
const router = express.Router();
const marketingPitchController = require('../controllers/marketingPitchController');

// Create a new marketing pitch
router.post('/marketing-pitch', marketingPitchController.createMarketingPitch);

// Get the latest marketing pitch
router.get('/marketing-pitch', marketingPitchController.getMarketingPitch);

module.exports = router;