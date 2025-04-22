const express = require("express");
const router = express.Router();
const { updateProfile, verifyEmail } = require("../controllers/authControllers");
const upload = require("../uploads/upload");

const {
  signupUser,
  loginUser,
  getUserCredentials,
  tokenIsValid,
  forgotPassword,
  updatePassword,
  resetPassword,
  addReview,
  getAverageRating,
  getUserReviews
} = require("../controllers/authControllers");
const auth = require("../middleware/authMiddleware");

router.put("/update-profile", auth, upload.single("img"), updateProfile);
router.post("/tokenIsValid", tokenIsValid);
router.get("/user", auth, getUserCredentials);
router.post("/signup", signupUser);
router.post("/", loginUser);
router.get("/verify-email/:token", verifyEmail); 

router.post("/forgot-password", forgotPassword);
router.post("/reset-password/:token", resetPassword);
router.put("/update-password", auth, updatePassword);

router.post('/users/:userId/reviews', auth, addReview);
router.get('/users/:userId/reviews', getUserReviews);
router.get('/users/:userId/average-rating', getAverageRating);

module.exports = router;
