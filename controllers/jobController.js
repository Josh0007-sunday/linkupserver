const Job = require('../models/job');
const mongoose = require('mongoose');

// Create a new job (unchanged)
const createJob = async (req, res) => {
  try {
    const { imageUri, title, projectname, price_minimum, price_maximum, method, stack } = req.body;

    if (!imageUri || !title || !projectname || !price_minimum || !price_maximum || !method || !stack) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    const newJob = new Job({
      imageUri,
      title,
      projectname,
      price_minimum,
      price_maximum,
      method,
      stack,
    });

    await newJob.save();
    res.status(201).json({ message: 'Job created successfully', job: newJob });
  } catch (error) {
    console.error('Error creating job:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Apply for a job (updated)
const applyForJob = async (req, res) => {
  let session;
  try {
    session = await mongoose.startSession();
    session.startTransaction();

    const { jobId } = req.params;
    const { name, description, telegramUsername, resumeUrl } = req.body;

    console.log('Received application payload:', req.body);

    const job = await Job.findById(jobId).session(session);
    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }

    // Check for duplicate application using telegramUsername (if provided)
    if (telegramUsername) {
      const alreadyApplied = job.applications.some(
        (app) => app.telegramUsername === telegramUsername
      );
      if (alreadyApplied) {
        return res.status(400).json({
          message: 'You have already applied for this job',
        });
      }
    }

    // Store all provided fields, even if some are undefined
    const application = {
      name: name || undefined,
      description: description || undefined,
      telegramUsername: telegramUsername || undefined,
      resumeUrl: resumeUrl || undefined,
      status: 'pending',
      appliedAt: new Date(),
    };

    job.applications.push(application);
    await job.save({ session });
    await session.commitTransaction();

    res.status(201).json({
      message: 'Application submitted successfully',
      application: {
        jobTitle: job.title,
        name: name || null,
        description: description || null,
        telegramUsername: telegramUsername || null,
        resumeUrl: resumeUrl || null,
        status: application.status,
      },
    });
  } catch (error) {
    await session?.abortTransaction();
    console.error('Application error:', error);
    res.status(500).json({
      message: 'Application failed',
      error: error.message,
      received: req.body,
    });
  } finally {
    await session?.endSession();
  }
};

// Get job details (unchanged)
const getJob = async (req, res) => {
  try {
    const { id } = req.params;
    const job = await Job.findById(id);

    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }

    res.status(200).json({ job });
  } catch (error) {
    console.error('Error fetching job:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  createJob,
  applyForJob,
  getJob,
};