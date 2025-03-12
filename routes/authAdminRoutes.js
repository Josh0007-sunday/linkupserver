const express = require("express");
// const cors = require("cors"); 
const router = express.Router();
const {
  signupAdmin,
  loginAdmin,
  tokenIsValid,
  getAdminCredentials
} = require("../controllers/authAdminController");
const auth = require("../middleware/authAdminMiddleware");



router.post("/adminTokenIsValid", tokenIsValid);
router.post("/signupAdmin", signupAdmin);
router.post("/loginAdmin", loginAdmin);
router.post("/admin", auth, getAdminCredentials);

module.exports = router;
