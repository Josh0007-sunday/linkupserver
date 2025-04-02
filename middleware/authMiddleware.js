const jwt = require("jsonwebtoken");
const User = require("../models/user");

const auth = async (req, res, next) => {
  try {
    // Log headers for debugging
    console.log('Auth middleware - Raw headers:', req.headers);

    // Try Authorization header first (expected format: "Bearer <token>" or just "<token>")
    let token;
    const authHeader = req.header("Authorization");
    console.log('Auth middleware - Authorization header:', authHeader);

    if (authHeader) {
      token = authHeader.startsWith("Bearer ") 
        ? authHeader.replace("Bearer ", "") 
        : authHeader;
    } else {
      // Fallback to x-auth-token if Authorization is not present
      token = req.header("x-auth-token");
      console.log('Auth middleware - x-auth-token header:', token);
    }

    if (!token) {
      console.log('Auth middleware - No token found in Authorization or x-auth-token');
      return res.status(401).json({ error: "No token, authorization denied" });
    }
    console.log('Auth middleware - Extracted token:', token);

    // Verify the token
    const verified = jwt.verify(token, process.env.JWT_SECRET);
    console.log('Auth middleware - Decoded token:', verified);

    // Fetch the full user data from the database
    const user = await User.findById(verified.id).select("-password"); // Exclude password
    if (!user) {
      console.log('Auth middleware - User not found for ID:', verified.id);
      return res.status(401).json({ error: "Token is not valid" });
    }

    // Attach the full user data to the request object
    req.user = user;
    console.log('Auth middleware - User attached to req:', user.toObject());
    next();
  } catch (err) {
    console.error('Auth middleware - Token verification failed:', err.message);
    res.status(401).json({ error: "Token is not valid" });
  }
};

module.exports = auth;