const Forum = require("../models/forum");
const User = require("../models/user");



const createForum = async (req, res) => {
  try {
    const { name, description, isPublic, imageUri, passcode } = req.body;
    const creatorId = req.user.id;
    const creator = await User.findById(creatorId);

    if (!creator) {
      return res.status(404).json({ error: "User not found" });
    }

    const forum = new Forum({
      name,
      description,
      imageUri: imageUri || "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTKTAXELs-l5c7qeTe3jbUgK9S4f-hYQWWi8A&s",
      creator: creatorId,
      creatorName: creator.name,
      creatorImg: creator.img || "https://static.vecteezy.com/system/resources/thumbnails/010/260/479/small/default-avatar-profile-icon-of-social-media-user-in-clipart-style-vector.jpg",
      creatorStatus: creator.status || "Active",
      isPublic,
      passcode: passcode || null, // Store passcode regardless of isPublic status
      attendees: [
        {
          user: creatorId,
          name: creator.name,
          img: creator.img || "https://static.vecteezy.com/system/resources/thumbnails/010/260/479/small/default-avatar-profile-icon-of-social-media-user-in-clipart-style-vector.jpg",
          status: creator.status || "Active",
        },
      ],
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
    const { passcode } = req.body;
    const userId = req.user.id;

    const forum = await Forum.findById(forumId);
    if (!forum) {
      return res.status(404).json({ error: "Forum not found" });
    }

    // Check if the user is already an attendee
    if (forum.attendees.some((attendee) => attendee.user.toString() === userId)) {
      return res.status(400).json({ error: "You are already in this forum" });
    }

    // Check if the forum has reached the attendee limit
    if (forum.attendees.length >= 30) {
      return res.status(400).json({ error: "Forum is full" });
    }

    // Check passcode if one exists (regardless of isPublic status)
    if (forum.passcode) {
      if (!passcode) {
        return res.status(400).json({ error: "Passcode is required to join this forum" });
      }
      if (forum.passcode !== passcode) {
        return res.status(403).json({ error: "Invalid passcode" });
      }
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
      img: user.img || "https://static.vecteezy.com/system/resources/thumbnails/010/260/479/small/default-avatar-profile-icon-of-social-media-user-in-clipart-style-vector.jpg",
      status: user.status || "Active",
    });

    await forum.save();
    res.json({ message: "Joined forum successfully", forum });
  } catch (error) {
    console.error("Join forum error:", error);
    res.status(500).json({ error: "Server error" });
  }
};



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
      .populate("creator", "name img status") 
      .populate("attendees.user", "name img status") 
      .populate("messages.sender", "name img"); 

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


const deleteForum = async (req, res) => {
  try {
    const { forumId } = req.params;
    const userId = req.user.id;

    const forum = await Forum.findById(forumId);
    if (!forum) {
      return res.status(404).json({ error: "Forum not found" });
    }

    // Check if the user is the creator
    if (forum.creator.toString() !== userId) {
      return res.status(403).json({ error: "Only the forum creator can delete this forum" });
    }

    await Forum.deleteOne({ _id: forumId });
    res.json({ message: "Forum deleted successfully" });
  } catch (error) {
    console.error("Delete forum error:", error);
    res.status(500).json({ error: "Server error" });
  }
};




module.exports = {
  createForum,
  joinForum,
  sendMessage,
  getPublicForums,
  getForumById,
  deleteForum
};