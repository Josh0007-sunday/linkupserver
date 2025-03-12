// const mongoose = require("mongoose");

// const bountySchema = new mongoose.Schema({
//   title: {
//     type: String,
//     required: true,
//   },
//   status: {
//     type: String,
//     default: "ongoing", // Default status is "ongoing"
//     enum: ["ongoing", "ended"], // Only allow these two statuses
//   },
//   tag: {
//     type: String,
//     required: true,
//   },
//   details: {
//     type: String,
//     required: true,
//   },
//   total_prizes: {
//     type: Number,
//     required: true,
//   },
//   prizes: {
//     type: [Number], // Array of prize amounts (e.g., [300, 200, 100])
//     required: true,
//   },
//   submissions: [
//     {
//       user: {
//         type: mongoose.Schema.Types.ObjectId,
//         ref: "User", // Reference to the User model
//         required: true,
//       },
//       submission_link: {
//         type: String,
//         required: true,
//       },
//       tweet_link: {
//         type: String,
//         required: true,
//       },
//       submittedAt: {
//         type: Date,
//         default: Date.now,
//       },
//     },
//   ],
//   duration: {
//     type: Date, // End date for the bounty
//     required: true,
//   },
// }, { timestamps: true });

// const BountyModel = mongoose.model("Bounty", bountySchema);
// module.exports = BountyModel;

const mongoose = require("mongoose");

const bountySchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  status: {
    type: String,
    default: "ongoing", // Default status is "ongoing"
    enum: ["ongoing", "ended"], // Only allow these two statuses
  },
  tag: {
    type: String,
    required: true,
  },
  details: {
    type: String,
    required: true,
  },
  total_prizes: {
    type: Number,
    required: true,
  },
  prizes: {
    type: [Number], // Array of prize amounts (e.g., [300, 200, 100])
    required: true,
  },
  submissions: [
    {
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User", // Reference to the User model
        required: true,
      },
      submission_link: {
        type: String,
        required: true,
      },
      tweet_link: {
        type: String,
        required: true,
      },
      submittedAt: {
        type: Date,
        default: Date.now,
      },
      upvotes: {
        type: Number,
        default: 0, // Default upvotes count is 0
      },
      upvotedBy: [ // Track users who upvoted this submission
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
      ],
      isWinner: {
        type: Boolean,
        default: false, // Default is false
      },
      winnerPosition: {
        type: Number,
        default: null, // 1, 2, or 3
      },
    },
  ],
  duration: {
    type: Date, // End date for the bounty
    required: true,
  },
}, { timestamps: true });

const BountyModel = mongoose.model("Bounty", bountySchema);
module.exports = BountyModel;