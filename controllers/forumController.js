const Forum = require("../models/forum");
const User = require("../models/user");

// Create a new forum
const createForum = async (req, res) => {
  try {
    const { name, description, isPublic, imageUri } = req.body;
    const creatorId = req.user.id; // Getting the user ID from auth middleware
    const creator = await User.findById(creatorId);

    if (!creator) {
      return res.status(404).json({ error: "User not found" });
    }

    const forum = new Forum({
      name,
      description,
      imageUri: imageUri || "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTKTAXELs-l5c7qeTe3jbUgK9S4f-hYQWWi8A&s", // Use provided image or default
      creator: creatorId,
      creatorName: creator.name,
      creatorImg: creator.img || "https://static.vecteezy.com/system/resources/thumbnails/010/260/479/small/default-avatar-profile-icon-of-social-media-user-in-clipart-style-vector.jpg", // Use creator's image or default
      creatorStatus: creator.status || "Active", // Use creator's status or default
      isPublic,
      attendees: [
        {
          user: creatorId,
          name: creator.name,
          img: creator.img || "https://static.vecteezy.com/system/resources/thumbnails/010/260/479/small/default-avatar-profile-icon-of-social-media-user-in-clipart-style-vector.jpg", // Use creator's image or default
          status: creator.status || "Active", // Use creator's status or default
        },
      ], // Add creator as the first attendee
    });

    await forum.save();
    res.status(201).json({ message: "Forum created successfully", forum });
  } catch (error) {
    console.error("Create forum error:", error);
    res.status(500).json({ error: "Server error" });
  }
};



const joinForum = async (req, res) => {
    try {
      const { forumId } = req.params;
      const userId = req.user.id;
  
      const forum = await Forum.findById(forumId);
      if (!forum) {
        return res.status(404).json({ error: "Forum not found" });
      }
  
      // Check if the forum is public or the user is already an attendee
      if (!forum.isPublic && !forum.attendees.some((attendee) => attendee.user.toString() === userId)) {
        return res.status(403).json({ error: "This forum is private" });
      }
  
      // Check if the user is already an attendee
      if (forum.attendees.some((attendee) => attendee.user.toString() === userId)) {
        return res.status(400).json({ error: "You are already in this forum" });
      }
  
      // Check if the forum has reached the attendee limit
      if (forum.attendees.length >= 30) {
        return res.status(400).json({ error: "Forum is full" });
      }
  
      // Fetch the user's details
      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
  
      // Add user to the forum
      forum.attendees.push({
        user: userId,
        name: user.name,
        img: user.img || "https://static.vecteezy.com/system/resources/thumbnails/010/260/479/small/default-avatar-profile-icon-of-social-media-user-in-clipart-style-vector.jpg", // Use user's image or default
        status: user.status || "Active", // Use user's status or default
      });
  
      await forum.save();
  
      // Debugging logs
      console.log("Updated forum after join:", forum);
  
      res.json({ message: "Joined forum successfully", forum });
    } catch (error) {
      console.error("Join forum error:", error);
      res.status(500).json({ error: "Server error" });
    }
  };

// Send a message in a forum
// Send a message in a forum
const sendMessage = async (req, res) => {
    try {
      const { forumId } = req.params;
      const { content } = req.body;
      const userId = req.user.id;
      const user = await User.findById(userId);
  
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
  
      const forum = await Forum.findById(forumId);
      if (!forum) {
        return res.status(404).json({ error: "Forum not found" });
      }
  
      // Check if the user is an attendee
      if (!forum.attendees.some((attendee) => attendee.user.toString() === userId)) {
        return res.status(403).json({ error: "You are not a member of this forum" });
      }
  
      // Add the message to the forum
      forum.messages.push({
        sender: userId,
        senderName: user.name,
        senderImg: user.img || DEFAULT_USER_IMAGE,
        content,
      });
  
      await forum.save();
  
      // Debugging logs
      console.log("Message sent successfully:", forum);
  
      res.json({ message: "Message sent successfully", forum });
    } catch (error) {
      console.error("Send message error:", error);
      res.status(500).json({ error: "Server error" });
    }
  };

// Get all public forums
const getPublicForums = async (req, res) => {
  try {
    const forums = await Forum.find({ isPublic: true }).select("-messages");
    res.json(forums);
  } catch (error) {
    console.error("Get public forums error:", error);
    res.status(500).json({ error: "Server error" });
  }
};

// Get a specific forum by ID
const getForumById = async (req, res) => {
  try {
    const { forumId } = req.params;
    const forum = await Forum.findById(forumId)
      .populate("creator", "name img status") // Populate creator details
      .populate("attendees.user", "name img status") // Populate attendees' details
      .populate("messages.sender", "name img"); // Populate message senders' details

    if (!forum) {
      return res.status(404).json({ error: "Forum not found" });
    }

    // Check if the forum is private and the user is an attendee
    if (!forum.isPublic && !forum.attendees.some((attendee) => attendee.user._id.toString() === req.user.id)) {
      return res.status(403).json({ error: "You do not have access to this forum" });
    }

    res.json(forum);
  } catch (error) {
    console.error("Get forum by ID error:", error);
    res.status(500).json({ error: "Server error" });
  }
};




//space.......
// Start Space
const startSpace = async (req, res) => {
  try {
    const { forumId } = req.params;
    const userId = req.user.id;

    const forum = await Forum.findById(forumId);
    if (!forum) {
      return res.status(404).json({ error: "Forum not found" });
    }

    // Ensure only the creator can start the space
    if (forum.creator.toString() !== userId) {
      return res.status(403).json({ error: "Only the creator can start the space" });
    }

    // Add creator as the first speaker
    const creator = await User.findById(userId);
    forum.space = {
      isActive: true,
      currentSpeakers: [{
        user: userId,
        name: creator.name,
        img: creator.img || DEFAULT_USER_IMAGE,
        type: 'creator'
      }],
      micRequests: []
    };

    await forum.save();

    res.json({ 
      message: "Space started successfully", 
      space: forum.space 
    });
  } catch (error) {
    console.error("Start space error:", error);
    res.status(500).json({ error: "Server error" });
  }
};

// Request Mic
const requestMic = async (req, res) => {
  try {
    const { forumId } = req.params;
    const userId = req.user.id;

    const forum = await Forum.findById(forumId);
    if (!forum) {
      return res.status(404).json({ error: "Forum not found" });
    }

    // Check if space is active
    if (!forum.space.isActive) {
      return res.status(400).json({ error: "Space is not active" });
    }

    // Check if user is an attendee
    const isAttendee = forum.attendees.some(attendee => 
      attendee.user.toString() === userId
    );
    if (!isAttendee) {
      return res.status(403).json({ error: "You are not an attendee of this forum" });
    }

    // Check if user is already a speaker or has a pending request
    const isAlreadySpeaker = forum.space.currentSpeakers.some(speaker => 
      speaker.user.toString() === userId
    );
    const hasExistingRequest = forum.space.micRequests.some(request => 
      request.user.toString() === userId
    );

    if (isAlreadySpeaker) {
      return res.status(400).json({ error: "You are already a speaker" });
    }

    if (hasExistingRequest) {
      return res.status(400).json({ error: "You have already requested the mic" });
    }

    // Add mic request
    const user = await User.findById(userId);
    forum.space.micRequests.push({
      user: userId,
      name: user.name,
      img: user.img || DEFAULT_USER_IMAGE
    });

    await forum.save();

    res.json({ 
      message: "Mic request sent successfully", 
      micRequests: forum.space.micRequests 
    });
  } catch (error) {
    console.error("Request mic error:", error);
    res.status(500).json({ error: "Server error" });
  }
};

// Approve Mic Request (Creator Only)
const approveMicRequest = async (req, res) => {
  try {
    const { forumId, requestUserId } = req.params;
    const creatorId = req.user.id;

    const forum = await Forum.findById(forumId);
    if (!forum) {
      return res.status(404).json({ error: "Forum not found" });
    }

    // Ensure only creator can approve
    if (forum.creator.toString() !== creatorId) {
      return res.status(403).json({ error: "Only the creator can approve mic requests" });
    }

    // Find the request
    const requestIndex = forum.space.micRequests.findIndex(
      request => request.user.toString() === requestUserId
    );

    if (requestIndex === -1) {
      return res.status(404).json({ error: "Mic request not found" });
    }

    // Remove from requests and add to speakers
    const requestedUser = forum.space.micRequests.splice(requestIndex, 1)[0];
    
    // Check speaker limit (optional, you can adjust)
    if (forum.space.currentSpeakers.length >= 5) {
      return res.status(400).json({ error: "Maximum number of speakers reached" });
    }

    forum.space.currentSpeakers.push({
      user: requestedUser.user,
      name: requestedUser.name,
      img: requestedUser.img,
      type: 'invited'
    });

    await forum.save();

    res.json({ 
      message: "Mic request approved", 
      speakers: forum.space.currentSpeakers,
      micRequests: forum.space.micRequests
    });
  } catch (error) {
    console.error("Approve mic request error:", error);
    res.status(500).json({ error: "Server error" });
  }
};

// End Space
const endSpace = async (req, res) => {
  try {
    const { forumId } = req.params;
    const userId = req.user.id;

    const forum = await Forum.findById(forumId);
    if (!forum) {
      return res.status(404).json({ error: "Forum not found" });
    }

    // Ensure only the creator can end the space
    if (forum.creator.toString() !== userId) {
      return res.status(403).json({ error: "Only the creator can end the space" });
    }

    // Reset space
    forum.space = {
      isActive: false,
      currentSpeakers: [],
      micRequests: []
    };

    await forum.save();

    res.json({ 
      message: "Space ended successfully", 
      space: forum.space 
    });
  } catch (error) {
    console.error("End space error:", error);
    res.status(500).json({ error: "Server error" });
  }
};

module.exports = {
  createForum,
  joinForum,
  sendMessage,
  getPublicForums,
  getForumById,
  startSpace,
  requestMic,
  approveMicRequest,
  endSpace,
};