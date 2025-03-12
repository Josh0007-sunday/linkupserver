const express = require("express");
const router = express.Router();
const { updateProfile, verifyEmail } = require("../controllers/authControllers");
const upload = require("../uploads/upload");

const {
  signupUser,
  loginUser,
  getUserCredentials,
  tokenIsValid,
} = require("../controllers/authControllers");
const auth = require("../middleware/authMiddleware");

router.put("/update-profile", auth, upload.single("img"), updateProfile);
router.post("/tokenIsValid", tokenIsValid);
router.get("/user", auth, getUserCredentials);
router.post("/signup", signupUser);
router.post("/", loginUser);
router.get("/verify-email/:token", verifyEmail); 

module.exports = router;
