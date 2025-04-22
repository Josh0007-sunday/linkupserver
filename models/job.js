const mongoose = require('mongoose');

const ApplicationSchema = new mongoose.Schema({
  name: { type: String }, // Optional
  description: { type: String }, // Optional
  telegramUsername: { type: String }, // Optional
  resumeUrl: { type: String }, // Optional
  appliedAt: { type: Date, default: Date.now },
  status: {
    type: String,
    enum: ['pending', 'reviewed', 'accepted', 'rejected'],
    default: 'pending',
  },
});

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
    type: [String],
    required: true,
  },
  applications: [ApplicationSchema],
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('Job', JobSchema);