const express = require("express");
const router = express.Router();

// Import controller with destructuring
const {
    createBounty,
    getAllBounties,
    getBountyById,
    submitToBounty,
    endBounty,
    upvoteSubmission,
    markAsWinner,
} = require("../controllers/bountyController");

// Use the proper auth middleware instead of the placeholder
const auth = require("../middleware/authMiddleware"); // Update the path as needed
const adminAuth = require("../middleware/authAdminMiddleware");

// Explicitly bind each route handler with error handling
router.post("/bounties", auth, (req, res) => {
  try {
    if (typeof createBounty !== 'function') {
      throw new Error('createBounty is not a function');
    }
    createBounty(req, res);
  } catch (error) {
    console.error('Route handler error:', error);
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
});

router.get("/getbounties", (req, res) => {
  try {
    if (typeof getAllBounties !== 'function') {
      throw new Error('getAllBounties is not a function');
    }
    getAllBounties(req, res);
  } catch (error) {
    console.error('Route handler error:', error);
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
});

router.get("/bounties/:id", (req, res) => {
  try {
    if (typeof getBountyById !== 'function') {
      throw new Error('getBountyById is not a function');
    }
    getBountyById(req, res);
  } catch (error) {
    console.error('Route handler error:', error);
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
});

router.post("/bounties/:id/submit", auth, (req, res) => {
  try {
    if (typeof submitToBounty !== 'function') {
      throw new Error('submitToBounty is not a function');
    }
    submitToBounty(req, res);
  } catch (error) {
    console.error('Route handler error:', error);
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
});

router.put("/bounties/:id/end", auth, (req, res) => {
  try {
    if (typeof endBounty !== 'function') {
      throw new Error('endBounty is not a function');
    }
    endBounty(req, res);
  } catch (error) {
    console.error('Route handler error:', error);
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
});


router.post(
  "/bounties/:id/submissions/:submissionId/upvote",
  auth, // Apply the authentication middleware
  (req, res) => {
    try {
      if (typeof upvoteSubmission !== "function") {
        throw new Error("upvoteSubmission is not a function");
      }
      upvoteSubmission(req, res);
    } catch (error) {
      console.error("Route handler error:", error);
      res.status(500).json({ error: "Internal server error", details: error.message });
    }
  }
);

router.put("/bounties/:id/submissions/:submissionId/mark-as-winner", adminAuth, (req, res) => {
  try {
    if (typeof markAsWinner !== 'function') {
      throw new Error('markAsWinner is not a function');
    }
    markAsWinner(req, res);
  } catch (error) {
    console.error('Route handler error:', error);
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
});

module.exports = router;