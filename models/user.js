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
}, { timestamps: true });

const UserModel = mongoose.model("User", userSchema);
module.exports = UserModel;