// routes/jobRoutes.js
const express = require('express');
const router = express.Router();
const { createJob } = require('../controllers/jobController');

// POST /api/jobs - Create a new job
router.post('/job-listing', createJob);

module.exports = router;