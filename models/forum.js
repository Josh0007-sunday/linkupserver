const mongoose = require("mongoose");

const forumSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    imageUri: {
      type: String, // Image URI for the forum
      default: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTKTAXELs-l5c7qeTe3jbUgK9S4f-hYQWWi8A&s", // Default placeholder image
    },
    creator: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    creatorName: {
      type: String,
      required: true,
    },
    creatorImg: {
      type: String, // Image URI for the creator
      default: "https://static.vecteezy.com/system/resources/thumbnails/010/260/479/small/default-avatar-profile-icon-of-social-media-user-in-clipart-style-vector.jpg", // Default placeholder image
    },
    creatorStatus: {
      type: String, // Status of the creator
      default: "Active", // Default status
    },
    isPublic: {
      type: Boolean,
      default: true,
    },
    attendees: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        name: {
          type: String,
          required: true,
        },
        img: {
          type: String, // Image URI for the attendee
          default: "https://static.vecteezy.com/system/resources/thumbnails/010/260/479/small/default-avatar-profile-icon-of-social-media-user-in-clipart-style-vector.jpg", // Default placeholder image
        },
        status: {
          type: String, // Status of the attendee
          default: "Active", // Default status
        },
      },
    ],
    messages: [
      {
        sender: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        senderName: {
          type: String,
          required: true,
        },
        senderImg: {
          type: String, // Image URI for the message sender
          default: "https://via.placeholder.com/40", // Default placeholder image
        },
        content: {
          type: String,
          required: true,
        },
        timestamp: {
          type: Date,
          default: Date.now,
        },
      },
    ],

    roomId: {
      type: String, // Huddle01 room ID for the audio space
      default: null,
    },
    
  },
  { timestamps: true }
);

// Ensure attendees limit is 30
forumSchema.pre("save", function (next) {
  if (this.attendees.length > 30) {
    throw new Error("Forum cannot have more than 30 attendees");
  }
  next();
});

module.exports = mongoose.model("Forum", forumSchema);