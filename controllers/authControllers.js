const User = require("../models/user");
const { hashPassword, comparePassword } = require("../helpers/auth");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");
const { TipLink } = require('@tiplink/api');
const { encrypt } = require('../helpers/encryption');
const { Connection, Keypair, PublicKey, Transaction, SystemProgram, sendAndConfirmTransaction } = require('@solana/web3.js');
const { decrypt } = require('../helpers/encryption');
const crypto = require("crypto"); 

// Create a transporter for nodemailer
const transporter = nodemailer.createTransport({
  host: process.env.HOST, 
  service: process.env.SERVICE, 
  port: Number(process.env.EMAIL_PORT), 
  secure: Boolean(process.env.SECURE), 
  auth: {
    user: process.env.EMAIL_USER, 
    pass: process.env.EMAIL_PASS, 
  },
});

// Signup endpoint
const signupUser = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Validation
    if (!name) {
      return res.json({ error: "Name is required" });
    }
    if (!password || password.length < 6) {
      return res.json({ error: "Password is required and must be at least 6 characters" });
    }

    // Check if email is already in use
    const exist = await User.findOne({ email });
    if (exist) {
      return res.json({ error: "Email is already in use" });
    }

    // Hash the password
    const hashedPassword = await hashPassword(password);

    const tiplink = await TipLink.create();
    const tiplinkUrl = tiplink.url.toString();
    const publicKey = tiplink.keypair.publicKey.toBase58();
    const privateKey = Buffer.from(tiplink.keypair.secretKey).toString('base64'); 
    const encryptedPrivateKey = encrypt(privateKey);

    // Create the user
    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      verified: false,
      tiplinkUrl,
      publicKey,
      privateKey: encryptedPrivateKey,
    });

    // Generate verification token
    const verificationToken = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET,
      { expiresIn: '1d' } // Token expires in 1 day
    );

    // Create verification URL
    const verificationUrl = `http://linkup-ruddy.vercel.app/verify-email/${verificationToken}`;

    const mailOptions = {
      from: process.env.EMAIL_USER, // Sender email
      to: user.email, // User's email
      subject: 'Account Verification', // Updated subject
      html: `
        <div style="font-family: Arial, sans-serif; color: #333; text-align: center;">
          <img src="https://pbs.twimg.com/media/DykstX9X4AEeJXH.jpg" alt="Company Logo" style="width: 150px; margin-bottom: 20px;">
          <h1 style="font-size: 24px; font-weight: bold; margin-bottom: 20px;">Account Verification</h1>
          <p style="font-size: 16px; margin-bottom: 20px;">
            Thank you for signing up with LinkUp! To complete your registration, please verify your email address by clicking the link below.
          </p>
          <a href="${verificationUrl}" style="display: inline-block; padding: 10px 20px; font-size: 16px; color: #fff; background-color: #007BFF; text-decoration: none; border-radius: 5px;">
            Verify Your Email
          </a>
          <p style="font-size: 14px; margin-top: 20px; color: #777;">
            If you did not create an account with LinkUp, please ignore this email.
          </p>
        </div>
      `
    };

    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.error("Error sending email:", error);
        return res.status(500).json({ error: "Error sending verification email" });
      } else {
        console.log('Email sent:', info.response);
        return res.json({ message: "Signup successful. Please check your email to verify your account." }),
        tiplinkUrl,
        publicKey;
      }
    });

  } catch (error) {
    console.error("Signup error:", error);
    res.status(500).json({ error: "Server error" });
  }
};


const verifyEmail = async (req, res) => {
  try {
    const { token } = req.params;

    // Verify the token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Mark the user as verified
    user.verified = true;
    await user.save();

    res.json({ message: "Email verified successfully" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Server error" });
  }
};

const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check if user exists
    const user = await User.findOne({ email });
    if (!user) {
      return res.json({ error: "Email is not registered" });
    }

    // Check if password matches
    const isValidPassword = await comparePassword(password, user.password);
    if (!isValidPassword) {
      return res.json({ error: "Incorrect password" });
    }

    // Check if user is verified
    if (!user.verified) {
      return res.json({ error: "Please verify your email to login" });
    }

    // Create JWT token
    const token = jwt.sign(
      { email: user.email, id: user._id, name: user.name },
      process.env.JWT_SECRET
    );

    // Return token and user data in the response body
    res.json({
      message: "Login successful",
      user: {
        eth_publickey: user.eth_publickey,
        xpNumber: user.xpNumber,
        privateKey: user.privateKey,
        tiplinkUrl: user.tiplinkUrl, // Include tiplinkUrl
        publicKey: user.publicKey,
        name: user.name,
        email: user.email,
        _id: user._id,
      },
      token, // Return the token in the response body
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Server error" });
  }
};

///////////////////////////////////////////////////////////////

const tokenIsValid = async (req, res) => {
  try {
    const token = req.header("x-auth-token"); // Use the x-auth-token header
    if (!token) return res.json(false);

    // Verify the token
    const verified = jwt.verify(token, process.env.JWT_SECRET);
    if (!verified) return res.json(false);

    // Find user by ID from the token
    const user = await User.findById(verified.id);
    if (!user) return res.json(false);

    return res.json(true);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


// Get user credentials endpoint
const getUserCredentials = async (req, res) => {
  try {
    // Assuming you have middleware that sets req.user from the token
    const user = await User.findById(req.user.id).select('-password');
    
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json({
      privateKey: user.privateKey,
      eth_publickey: user.eth_publickey,
      xpNumber: user.xpNumber,
      tiplinkUrl: user.tiplinkUrl,
      publicKey: user.publicKey,
      img: user.img,
      portfolio: user.portfolio,
      github_url: user.github_url,
      linkedin_url: user.linkedin_url,
      facebook_url: user.facebook_url,
      twitter_url: user.twitter_url,
      bio: user.bio,
      status: user.status,
      name: user.name,
      email: user.email,
      id: user._id,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


const updateProfile = async (req, res) => {
  try {
    const { id } = req.user; // Assuming req.user is set by authentication middleware
    const { status, bio, twitter_url, facebook_url, linkedin_url, github_url, portfolio, eth_publickey } = req.body;

    console.log("Request Body:", req.body); // Log the request body for debugging

    // Find the user by ID
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Update profile fields if provided
    if (status) user.status = status;
    if (bio) user.bio = bio;
    if (twitter_url) user.twitter_url = twitter_url;
    if (facebook_url) user.facebook_url = facebook_url;
    if (linkedin_url) user.linkedin_url = linkedin_url;
    if (github_url) user.github_url = github_url;
    if (portfolio) user.portfolio = portfolio;
    if (eth_publickey) {
      // Optional: Validate Ethereum address format (42 characters, starts with 0x)
      if (!/^0x[a-fA-F0-9]{40}$/.test(eth_publickey)) {
        return res.status(400).json({ error: "Invalid Ethereum public key" });
      }
      user.eth_publickey = eth_publickey;
    }

    // Handle image upload
    if (req.file) {
      user.img = `/uploads/${req.file.filename}`; // Save the file path
    }

    // Save the updated user
    await user.save();

    // Return the updated user profile (excluding sensitive data)
    const updatedUser = {
      name: user.name,
      email: user.email,
      img: user.img,
      status: user.status,
      bio: user.bio,
      twitter_url: user.twitter_url,
      facebook_url: user.facebook_url,
      linkedin_url: user.linkedin_url,
      github_url: user.github_url,
      portfolio: user.portfolio,
      eth_publickey: user.eth_publickey
    };

    res.json({ message: "Profile updated successfully", user: updatedUser });
  } catch (error) {
    console.error("Update profile error:", error);
    res.status(500).json({ error: "Server error" });
  }
};

const sendSol = async (req, res) => {
  try {
    const { recipientAddress, amount } = req.body;
    const userId = req.user.id; // Assuming req.user is set by your authentication middleware

    // Fetch the user from the database
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Decrypt the private key
    const decryptedPrivateKey = decrypt(user.privateKey);
    const privateKeyBuffer = Buffer.from(decryptedPrivateKey, 'base64');
    const senderKeypair = Keypair.fromSecretKey(privateKeyBuffer);

    // Convert the recipient address to a PublicKey
    const recipientPublicKey = new PublicKey(recipientAddress);

    // Connect to the Solana network
    const connection = new Connection("https://api.mainnet-beta.solana.com", "confirmed");

    // Create a transaction to send SOL
    const transaction = new Transaction().add(
      SystemProgram.transfer({
        fromPubkey: senderKeypair.publicKey,
        toPubkey: recipientPublicKey,
        lamports: amount * 1e9, // Convert SOL to lamports (1 SOL = 1e9 lamports)
      })
    );

    // Sign and send the transaction
    const signature = await sendAndConfirmTransaction(connection, transaction, [senderKeypair]);

    // Return the transaction signature
    res.json({
      message: "Transaction successful",
      signature,
    });
  } catch (error) {
    console.error("Error sending SOL:", error);
    res.status(500).json({ error: "Failed to send SOL" });
  }
};

const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    // Check if the user exists
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Generate a reset token
    const resetToken = crypto.randomBytes(20).toString("hex");
    const resetPasswordToken = crypto
      .createHash("sha256")
      .update(resetToken)
      .digest("hex");

    // Set token expiration (e.g., 1 hour)
    user.resetPasswordToken = resetPasswordToken;
    user.resetPasswordExpires = Date.now() + 3600000; // 1 hour
    await user.save();

    // Create reset URL
    const resetUrl = `http://linkup-ruddy.vercel.app/reset-password/${resetToken}`;

    // Send email
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: user.email,
      subject: "Password Reset Request",
      html: `
        <div style="font-family: Arial, sans-serif; color: #333;">
          <h1>Password Reset</h1>
          <p>You requested a password reset. Click the link below to reset your password:</p>
          <a href="${resetUrl}" style="display: inline-block; padding: 10px 20px; background-color: #007BFF; color: #fff; text-decoration: none; border-radius: 5px;">
            Reset Password
          </a>
          <p>If you did not request this, please ignore this email.</p>
        </div>
      `,
    };

    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.error("Error sending email:", error);
        return res.status(500).json({ error: "Error sending reset email" });
      }
      res.json({ message: "Reset email sent successfully" });
    });
  } catch (error) {
    console.error("Forgot password error:", error);
    res.status(500).json({ error: "Server error" });
  }
};

const resetPassword = async (req, res) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    // Hash the token to compare with the one in the database
    const resetPasswordToken = crypto
      .createHash("sha256")
      .update(token)
      .digest("hex");

    // Find the user by the token and check if it's expired
    const user = await User.findOne({
      resetPasswordToken,
      resetPasswordExpires: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({ error: "Invalid or expired token" });
    }

    // Hash the new password
    const hashedPassword = await hashPassword(password);

    // Update the user's password and clear the reset token
    user.password = hashedPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    res.json({ message: "Password reset successful" });
  } catch (error) {
    console.error("Reset password error:", error);
    res.status(500).json({ error: "Server error" });
  }
};

const updatePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user.id; // Assuming req.user is set by your auth middleware

    // Find the user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Verify the current password
    const isValidPassword = await comparePassword(currentPassword, user.password);
    if (!isValidPassword) {
      return res.status(400).json({ error: "Current password is incorrect" });
    }

    // Hash the new password
    const hashedPassword = await hashPassword(newPassword);

    // Update the password
    user.password = hashedPassword;
    await user.save();

    res.json({ message: "Password updated successfully" });
  } catch (error) {
    console.error("Update password error:", error);
    res.status(500).json({ error: "Server error" });
  }
};

// Update exports
module.exports = {
  signupUser,
  loginUser,
  tokenIsValid,
  getUserCredentials,
  updateProfile,
  verifyEmail,
  sendSol,
  forgotPassword,
  resetPassword,
  updatePassword
};


