// controllers/serviceController.js
const Service = require("../models/service");

const createService = async (req, res) => {
  try {
    const { title, overview, proof_img, category, amount, email, mobile } = req.body;

    // Create a new service
    const service = await Service.create({
      title,
      overview,
      proof_img,
      category,
      amount,
      email,
      mobile,
    });

    res.status(201).json({
      message: "Service created successfully",
      service,
    });
  } catch (error) {
    console.error("Error creating service:", error);
    res.status(500).json({ error: "Server error" });
  }
};


const getAllServices = async (req, res) => {
  try {
    const services = await Service.find().select("-__v"); // Exclude the __v field
    res.json(services);
  } catch (error) {
    console.error("Error fetching services:", error);
    res.status(500).json({ error: "Failed to retrieve services" });
  }
};

module.exports = { createService, getAllServices };