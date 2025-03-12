const Admin = require("../models/admin");
const { hashPassword, comparePassword } = require("../helpers/auth");
const jwt = require("jsonwebtoken");

const signupAdmin = async (req, res) => {
  try {
    const { name, email, role, password } = req.body;
    if (!name || !role || !email || !password) {
      return res.status(400).json({ error: "All fields are required" });
    }
    if (password.length < 6) {
      return res
        .status(400)
        .json({ error: "Password must be at least 6 characters" });
    }
    const exist = await Admin.findOne({ email });
    if (exist) {
      return res.status(400).json({ error: "Email already exists" });
    }
    const hashedPassword = await hashPassword(password);
    
    const admin = await Admin.create({
      name,
      email,
      role,
      password: hashedPassword,
    });
    
    res.status(201).json({ message: "Admin signup successful", admin });
  } catch (error) {
    console.error("Signup Error:", error);
    res.status(500).json({ error: "Server error occurred during signup" });
  }
};
//////////////////////////////////////////////////////////////////////////////


// const loginAdmin = async (req, res) => {
//     try {
//         const { email, password } = req.body;
//         const admin = await Admin.findOne({ email });
//         if (!admin) {
//             return res.json({ error: "Email is not registered" });
//         }
//         const isValidPassword = await comparePassword(password, admin.password);
//         if (!isValidPassword) {
//             return res.json({ error: "Incorrect password" });
//         }
//         const token = jwt.sign(
//             { email: admin.email, id: admin._id, name: admin.name },
//             process.env.JWT_SECRET
//         );
//         res
//             .cookie("token", token, {
//                 httpOnly: true, // Prevent access via JavaScript
//                 secure: process.env.NODE_ENV === "production", // Use HTTPS in production
//                 sameSite: "strict", // Prevent CSRF
//             })
//             .json({
//                 message: "Login successful",
//                 user: {
//                     name: admin.name,
//                     email: admin.email,
//                     _id: admin._id,
//                 },
//                 token, // You can also return the token in the response body if needed
//             });

//     } catch (error) {
//         console.log(error);
//         res.status(500).json({ error: "Server error" });
//     }
// };

const loginAdmin = async (req, res) => {
  try {
    const { email, password } = req.body;
    const admin = await Admin.findOne({ email });
    if (!admin) {
      return res.json({ error: "Email is not registered" });
    }
    const isValidPassword = await comparePassword(password, admin.password);
    if (!isValidPassword) {
      return res.json({ error: "Incorrect password" });
    }
    const token = jwt.sign(
      { email: admin.email, id: admin._id, name: admin.name, role: admin.role }, // Include role in the token payload
      process.env.JWT_SECRET
    );
    res
      .cookie("token", token, {
        httpOnly: true, // Prevent access via JavaScript
        secure: process.env.NODE_ENV === "production", // Use HTTPS in production
        sameSite: "strict", // Prevent CSRF
      })
      .json({
        message: "Login successful",
        user: {
          name: admin.name,
          email: admin.email,
          role: admin.role, // Include the role field
          _id: admin._id,
        },
        token, // You can also return the token in the response body if needed
      });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Server error" });
  }
};

const tokenIsValid = async (req, res) => {
  try {
    const token = req.header("x-auth-token");

    // Check if token exists
    if (!token) {
      return res.json(false);
    }

    // Verify the token
    const verified = jwt.verify(token, process.env.JWT_SECRET);
    if (!verified) {
      return res.json(false);
    }

    // Find admin by ID from the token
    const admin = await Admin.findById(verified.id);
    if (!admin) {
      return res.json(false);
    }

    // Token is valid
    return res.json(true);
  } catch (err) {
    console.error("Token validation error:", err);
    res.status(500).json({ error: err.message });
  }
};

const getAdminCredentials = async (req, res) => {
  try{

    if (!Admin) {
      return res.status(404).json({error: "User not found" });
    }

    res.json({
      name: Admin.name,
      email: Admin.email,
      role: Admin.role,
    });
  } catch(err){
    res.status(500).json({ error: err.message});
  }
};

module.exports = {
    signupAdmin,
    loginAdmin,
    tokenIsValid,
    getAdminCredentials
};