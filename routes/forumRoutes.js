const express = require("express");
const router = express.Router();
const forumController = require("../controllers/forumController");
const auth = require("../middleware/authMiddleware");

// Create a forum
router.post("/create-forum", auth, forumController.createForum);

// Join a forum
router.post("/:forumId/join", auth, forumController.joinForum);

// Send a message in a forum
router.post("/:forumId/message", auth, forumController.sendMessage);

// Get all public forums
router.get("/public", forumController.getPublicForums);

// Get a specific forum by ID
router.get("/forum/:forumId", auth, forumController.getForumById);


// Start a space
router.post("/:forumId/space/start", auth, forumController.startSpace);

// Request mic
router.post("/:forumId/space/request-mic", auth, forumController.requestMic);

// Approve mic request (creator only)
router.post("/:forumId/space/approve-mic/:requestUserId", auth, forumController.approveMicRequest);

// End space
router.post("/:forumId/space/end", auth, forumController.endSpace);

module.exports = router;