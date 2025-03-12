const jwt = require("jsonwebtoken");
const User = require("../models/user");

const auth = async (req, res, next) => {
  try {
    const token = req.header("x-auth-token");

    if (!token) {
      return res.status(401).json({ error: "No token, authorization denied" });
    }

    // Verify the token
    const verified = jwt.verify(token, process.env.JWT_SECRET);

    // Fetch the full user data from the database
    const user = await User.findById(verified.id).select("-password"); // Exclude password
    if (!user) {
      return res.status(401).json({ error: "Token is not valid" });
    }

    // Attach the full user data to the request object
    req.user = user;
    next();
  } catch (err) {
    res.status(401).json({ error: "Token is not valid" });
  }
};

module.exports = auth;