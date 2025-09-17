const express = require("express");
const {
  allMessages,
  sendMessage,
  markViewOnceAsViewed,
  getViewOnceMessage,
} = require("../controllers/messageControllers");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

router.route("/:chatId").get(protect, allMessages);
router.route("/").post(protect, sendMessage);
router
  .route("/view-once/:messageId")
  .get(protect, getViewOnceMessage)
  .put(protect, markViewOnceAsViewed);

module.exports = router;
