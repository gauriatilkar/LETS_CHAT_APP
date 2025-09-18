const express = require("express");
const {
  registerUser,
  authUser,
  allUsers,
  forgotPassword,
  resetPassword
} = require("../controllers/userControllers");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

router.route("/").get(protect, allUsers);
router.route("/").post(registerUser);
router.post("/login", authUser);

router.post("/forgot-password", forgotPassword);
router.post("reset-password/:token", resetPassword);

module.exports = router;
