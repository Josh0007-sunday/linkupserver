// routes/jobRoutes.js
const express = require('express');
const router = express.Router();
const { createJob, applyForJob, getJob } = require('../controllers/jobController');
const auth = require('../middleware/authMiddleware');

// POST /api/jobs - Create a new job
router.post('/job-listing', createJob);

router.post('/jobs/:jobId/apply',  applyForJob);

router.get('/getJob/:id', getJob);

module.exports = router;