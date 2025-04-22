const mongoose = require("mongoose");
const { Schema } = mongoose;

// models/user.js
const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    required: true
  },
  resetPasswordToken: String, 
  resetPasswordExpires: Date,
  img: String,
  status: String,
  bio: String,
  twitter_url: String,
  facebook_url: String,
  linkedin_url: String,
  github_url: String,
  portfolio: String,
  verified: {
    type: Boolean,
    default: false
  },
  tiplinkUrl: String, 
  publicKey: String,
  privateKey: String,
  eth_publickey: String,
  xpNumber: { 
    type: Number,
    default: 0 
  },
  reviews: [{
    reviewerId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    reviewerName: {
      type: String,
      required: true
    },
    content: {
      type: String,
      required: true,
      maxlength: 500
    },
    rating: {
      type: Number,
      min: 1,
      max: 5,
      required: true
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }]
}, { timestamps: true });

const UserModel = mongoose.model("User", userSchema);
module.exports = UserModel;