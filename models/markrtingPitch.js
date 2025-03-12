const mongoose = require('mongoose');

const marketingPitchSchema = new mongoose.Schema({
  heroBannerImage: { type: String, required: true }, // URL or file path
  profileImage: { type: String, required: true }, // URL or file path
  nameOrCompany: { type: String, required: true },
  tagline: { type: [String], required: true }, // Array of taglines
  briefBio: { type: String, required: true },
  solutionLongText: { type: String, required: true },
  youtubeCode: { type: String, required: true }, // YouTube embed code
  proofOfImpact: { type: String, required: true },
  partnershipTags: { type: [String], required: true }, // Array of partnership tags
  ctaUrl: { type: String, required: true }, // Call to Action URL
  twitterUrl: { type: String, required: true }, // Twitter/X URL
});

const MarketingPitch = mongoose.model('MarketingPitch', marketingPitchSchema);

module.exports = MarketingPitch;