const Bounty = require("../models/bounty");

// Added explicit console logs for debugging
console.log("Bounty Model:", !!Bounty);

// Create a new bounty
const createBounty = async (req, res) => {
  console.log("createBounty function called");
  try {
    const { title, tag, details, total_prizes, prizes, duration } = req.body;
    
    console.log("Received body:", req.body);

    // Validate required fields
    if (!title || !tag || !details || !total_prizes || !prizes || !duration) {
      console.log("Missing required fields");
      return res.status(400).json({ error: "All fields are required" });
    }

    // Create the bounty
    const bounty = await Bounty.create({
      title,
      tag,
      details,
      total_prizes,
      prizes,
      duration,
    });

    res.status(201).json({ message: "Bounty created successfully", bounty });
  } catch (error) {
    console.error("Create bounty error:", error);
    res.status(500).json({ error: "Server error", details: error.message });
  }
};

// Ensure each function is properly defined
const getAllBounties = async (req, res) => {
  console.log("getAllBounties function called");
  try {
    const bounties = await Bounty.find().populate("submissions.user", "name email");
    res.json(bounties);
  } catch (error) {
    console.error("Get all bounties error:", error);
    res.status(500).json({ error: "Server error", details: error.message });
  }
};

const getBountyById = async (req, res) => {
  console.log("getBountyById function called");
  try {
    const { id } = req.params;
    const bounty = await Bounty.findById(id).populate("submissions.user", "name email");
    
    if (!bounty) {
      return res.status(404).json({ error: "Bounty not found" });
    }
    
    res.json(bounty);
  } catch (error) {
    console.error("Get bounty by ID error:", error);
    res.status(500).json({ error: "Server error", details: error.message });
  }
};

const submitToBounty = async (req, res) => {
  console.log("submitToBounty function called");
  try {
    const { id } = req.params;
    const { submission_link, tweet_link } = req.body;
    
    // Debug user info
    console.log("User from auth middleware:", req.user ? {
      id: req.user._id,  // Note: Using _id since that's the MongoDB ID field
      name: req.user.name,
      email: req.user.email
    } : "No user data");
    
    // The auth middleware attaches the full user object with _id property
    const userId = req.user._id;
    
    if (!submission_link || !tweet_link) {
      return res.status(400).json({ error: "Submission link and tweet link are required" });
    }
    
    const bounty = await Bounty.findById(id);
    if (!bounty) {
      return res.status(404).json({ error: "Bounty not found" });
    }
    
    if (bounty.status === "ended") {
      return res.status(400).json({ error: "Bounty has ended" });
    }
    
    // Check if user has already submitted to this bounty
    const existingSubmission = bounty.submissions.find(
      submission => submission.user.toString() === userId.toString()
    );
    
    if (existingSubmission) {
      return res.status(400).json({ error: "You have already submitted to this bounty" });
    }
    
    // Add submission
    bounty.submissions.push({
      user: userId,
      submission_link,
      tweet_link,
    });
    
    await bounty.save();
    
    res.status(201).json({ message: "Submission added successfully", bounty });
  } catch (error) {
    console.error("Submit to bounty error:", error);
    res.status(500).json({ error: "Server error", details: error.message });
  }
};

const endBounty = async (req, res) => {
  console.log("endBounty function called");
  try {
    const { id } = req.params;

    const bounty = await Bounty.findById(id);
    if (!bounty) {
      return res.status(404).json({ error: "Bounty not found" });
    }

    bounty.status = "ended";
    await bounty.save();

    res.json({ message: "Bounty ended successfully", bounty });
  } catch (error) {
    console.error("End bounty error:", error);
    res.status(500).json({ error: "Server error", details: error.message });
  }
};


// Upvote a submission
const upvoteSubmission = async (req, res) => {
  console.log("upvoteSubmission function called");
  console.log("User from auth middleware:", req.user); // Debug user info

  try {
    const { id, submissionId } = req.params;
    const userId = req.user._id; // Get the logged-in user's ID

    const bounty = await Bounty.findById(id);
    if (!bounty) {
      return res.status(404).json({ error: "Bounty not found" });
    }

    // Find the submission by its ID
    const submission = bounty.submissions.id(submissionId);
    if (!submission) {
      return res.status(404).json({ error: "Submission not found" });
    }

    // Check if the user has already upvoted this submission
    if (submission.upvotedBy.includes(userId)) {
      return res.status(400).json({ error: "You have already upvoted this submission" });
    }

    // Increment the upvotes and add the user to the upvotedBy array
    submission.upvotes += 1;
    submission.upvotedBy.push(userId); // Track who upvoted
    await bounty.save();

    res.status(200).json({ message: "Submission upvoted successfully", submission });
  } catch (error) {
    console.error("Upvote submission error:", error);
    res.status(500).json({ error: "Server error", details: error.message });
  }
};

// Mark a submission as a winner
const markAsWinner = async (req, res) => {
  console.log("markAsWinner function called");
  try {
    const { id, submissionId } = req.params;
    const { position } = req.body; // 1, 2, or 3

    const bounty = await Bounty.findById(id);
    if (!bounty) {
      return res.status(404).json({ error: "Bounty not found" });
    }

    // Find the submission by its ID
    const submission = bounty.submissions.id(submissionId);
    if (!submission) {
      return res.status(404).json({ error: "Submission not found" });
    }

    // Mark the submission as a winner with the specified position
    submission.isWinner = true;
    submission.winnerPosition = position; // Add a new field to track the position
    await bounty.save();

    res.status(200).json({ message: "Submission marked as winner successfully", submission });
  } catch (error) {
    console.error("Mark as winner error:", error);
    res.status(500).json({ error: "Server error", details: error.message });
  }
};

// Ensure ALL functions are being exported
module.exports = {
  createBounty,
  getAllBounties,
  getBountyById,
  submitToBounty,
  endBounty,
  upvoteSubmission,
  markAsWinner,
};

// Diagnostic export check
console.log("Module exports:", Object.keys(module.exports));