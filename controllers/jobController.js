// controllers/jobController.js
const Job = require('../models/job');

// Create a new job
const createJob = async (req, res) => {
  try {
    const { imageUri, title, projectname, price_minimum, price_maximum, method, stack } = req.body;

    // Validate required fields
    if (!imageUri || !title || !projectname || !price_minimum || !price_maximum || !method || !stack) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    // Create a new job
    const newJob = new Job({
      imageUri,
      title,
      projectname,
      price_minimum,
      price_maximum,
      method,
      stack,
    });

    // Save the job to the database
    await newJob.save();

    // Return the created job
    res.status(201).json({ message: 'Job created successfully', job: newJob });
  } catch (error) {
    console.error('Error creating job:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  createJob,
};