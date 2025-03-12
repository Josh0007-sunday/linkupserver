// models/Job.js
const mongoose = require('mongoose');

const JobSchema = new mongoose.Schema({
  imageUri: {
    type: String,
    required: true,
  },
  title: {
    type: String,
    required: true,
  },
  projectname: {
    type: String,
    required: true,
  },
  price_minimum: {
    type: Number,
    required: true,
  },
  price_maximum: {
    type: Number,
    required: true,
  },
  method: {
    type: String,
    required: true,
  },
  stack: {
    type: [String], // Array of strings for multiple technologies
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('Job', JobSchema);