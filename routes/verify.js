// verifyEmailRoutes.js
const express = require('express');
const router = express.Router();
const authController = require('../controllers/authControllers'); // Adjust the path as needed

// Email verification route
router.post('/verify-email/:token', authController.verifyEmail);

module.exports = router;