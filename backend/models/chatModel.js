const mongoose = require("mongoose");

const inviteLinkSchema = mongoose.Schema(
  {
    inviteCode: {
      type: String,
      required: true,
      // Remove unique: true from here since it's embedded in an array
    },
    chat: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Chat",
      required: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    expiresAt: {
      type: Date,
      required: true,
    },
    usedCount: {
      type: Number,
      default: 0,
    },
    maxUses: {
      type: Number,
      default: null, // null means unlimited uses
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

const chatModel = mongoose.Schema(
  {
    chatName: { type: String, trim: true },
    isGroupChat: { type: Boolean, default: false },
    users: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    latestMessage: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Message",
    },
    groupAdmin: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    // Only group chats will have this field
    inviteLinks: {
      type: [inviteLinkSchema],
      default: undefined, // This prevents the field from being created for non-group chats
    },
  },
  { timestamps: true }
);

// Create a sparse compound index to ensure unique invite codes across all chats
// This will only index documents that have the inviteLinks.inviteCode field
chatModel.index(
  { "inviteLinks.inviteCode": 1 },
  {
    unique: true,
    sparse: true,
    name: "inviteCode_unique_sparse",
  }
);

// Pre-save middleware to ensure inviteLinks is only set for group chats
chatModel.pre("save", function (next) {
  if (!this.isGroupChat) {
    // Remove inviteLinks for non-group chats
    this.inviteLinks = undefined;
  } else if (this.isGroupChat && !this.inviteLinks) {
    // Initialize empty array for group chats if not set
    this.inviteLinks = [];
  }
  next();
});

// Static method to validate unique invite codes before saving
chatModel.statics.validateInviteCode = async function (
  inviteCode,
  excludeChatId = null
) {
  const query = { "inviteLinks.inviteCode": inviteCode };
  if (excludeChatId) {
    query._id = { $ne: excludeChatId };
  }

  const existingChat = await this.findOne(query);
  return !existingChat;
};

const Chat = mongoose.model("Chat", chatModel);

module.exports = Chat;
