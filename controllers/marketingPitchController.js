const MarketingPitch = require('../models/markrtingPitch');

// Create a new marketing pitch
const createMarketingPitch = async (req, res) => {
  try {
    const {
      heroBannerImage,
      profileImage,
      nameOrCompany,
      tagline,
      briefBio,
      solutionLongText,
      youtubeCode,
      proofOfImpact,
      partnershipTags,
      ctaUrl,
      twitterUrl,
    } = req.body;

    // Validate required fields
    if (
      !heroBannerImage ||
      !profileImage ||
      !nameOrCompany ||
      !tagline ||
      !briefBio ||
      !solutionLongText ||
      !youtubeCode ||
      !proofOfImpact ||
      !partnershipTags ||
      !ctaUrl ||
      !twitterUrl
    ) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    // Create a new marketing pitch
    const newMarketingPitch = new MarketingPitch({
      heroBannerImage,
      profileImage,
      nameOrCompany,
      tagline,
      briefBio,
      solutionLongText,
      youtubeCode,
      proofOfImpact,
      partnershipTags,
      ctaUrl,
      twitterUrl,
    });

    // Save to the database
    await newMarketingPitch.save();

    // Return the created pitch
    res.status(201).json({ message: 'Marketing pitch created successfully', data: newMarketingPitch });
  } catch (error) {
    console.error('Error creating marketing pitch:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get the latest marketing pitch
const getMarketingPitch = async (req, res) => {
  try {
    const pitch = await MarketingPitch.findOne().sort({ createdAt: -1 }); // Get the latest pitch
    if (!pitch) {
      return res.status(404).json({ message: 'No marketing pitch found' });
    }
    res.status(200).json({ data: pitch });
  } catch (error) {
    console.error('Error fetching marketing pitch:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  createMarketingPitch,
  getMarketingPitch,
};