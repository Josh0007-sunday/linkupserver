// routes/serviceRoutes.js
const express = require("express");
const { createService, getAllServices } = require("../controllers/serviceController");

const router = express.Router();

// Create a new service
router.post("/services", createService);

router.get("/serviceList", getAllServices);

module.exports = router;