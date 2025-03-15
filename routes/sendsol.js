const express = require('express');
const router = express.Router();
const { sendSol } = require('../controllers/authControllers');
const auth = require('../middleware/authMiddleware');

router.post('/send-sol', auth, sendSol);

module.exports = router;