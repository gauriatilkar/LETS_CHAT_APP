const express = require("express");
const {
  accessChat,
  fetchChats,
  createGroupChat,
  removeFromGroup,
  addToGroup,
  renameGroup,
  generateInviteLink,
  joinGroupByInvite,
  getInviteLinks,
  revokeInviteLink,
} = require("../controllers/chatControllers");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

// Existing routes
router.route("/").post(protect, accessChat);
router.route("/").get(protect, fetchChats);
router.route("/group").post(protect, createGroupChat);
router.route("/rename").put(protect, renameGroup);
router.route("/groupremove").put(protect, removeFromGroup);
router.route("/groupadd").put(protect, addToGroup);

// New invite link routes
router.route("/generate-invite").post(protect, generateInviteLink);
router.route("/join/:inviteCode").post(protect, joinGroupByInvite);
router.route("/invite-links/:chatId").get(protect, getInviteLinks);
router.route("/revoke-invite/:inviteLinkId").delete(protect, revokeInviteLink);

module.exports = router;
