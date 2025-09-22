const express = require("express");
const {
  allMessages,
  sendMessage,
  editMessage,
  deleteMessage,
  getViewOnceMessage,
  getMessageHistory,
  markMessageAsRead,
  markAllMessagesAsRead,
  getReadStatus,
} = require("../controllers/messageControllers");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

// Base routes
router.route("/").post(protect, sendMessage);
router.route("/:chatId").get(protect, allMessages);

// View-once message endpoints (must come BEFORE other messageId routes)
router.route("/view-once/:messageId").get(protect, getViewOnceMessage);

// Message read status routes
router.route("/read-all/:chatId").put(protect, markAllMessagesAsRead);
router.route("/read-status/:chatId").get(protect, getReadStatus);
router.route("/:messageId/read").put(protect, markMessageAsRead);

// Message modification routes
router.route("/edit/:messageId").put(protect, editMessage);
router.route("/delete/:messageId").delete(protect, deleteMessage);

// Message history
router.route("/:messageId/history").get(protect, getMessageHistory);

module.exports = router;
