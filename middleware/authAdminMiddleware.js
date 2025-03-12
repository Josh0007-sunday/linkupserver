const jwt = require("jsonwebtoken");
const Admin = require("../models/admin"); // Import the Admin model

const adminAuth = async (req, res, next) => {
  try {
    const token = req.header("x-auth-token");

    // Check if token exists
    if (!token) {
      return res.status(401).json({ error: "No token, authorization denied" });
    }

    // Verify the token
    const verified = jwt.verify(token, process.env.JWT_SECRET);

    // Fetch the full admin data from the database
    const admin = await Admin.findById(verified.id).select("-password"); // Exclude password
    if (!admin) {
      return res.status(401).json({ error: "Token is not valid" });
    }

    // Attach the full admin data to the request object
    req.admin = admin;
    next();
  } catch (err) {
    res.status(401).json({ error: "Token is not valid" });
  }
};

module.exports = adminAuth;