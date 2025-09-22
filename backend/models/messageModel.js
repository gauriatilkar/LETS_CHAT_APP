const mongoose = require("mongoose");

const messageSchema = mongoose.Schema(
  {
    sender: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    content: { type: String, trim: true },
    chat: { type: mongoose.Schema.Types.ObjectId, ref: "Chat" },
    readBy: [
      {
        user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        readAt: { type: Date, default: Date.now },
      },
    ],
    // View-once related fields
    isViewOnce: { type: Boolean, default: false },
    viewedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    isDeleted: { type: Boolean, default: false },
    deleteType: {
      type: String,
      enum: ["sender", "everyone"], // "sender" = delete for me, "everyone" = delete for everyone
      default: null,
    },
    // Media type field
    mediaType: {
      type: String,
      enum: ["text", "image", "video"],
      default: "text",
    },
    // Emoji-only message indicator
    isOnlyEmojis: { type: Boolean, default: false },
    // Edit functionality (15 minute limit enforced in controller)
    isEdited: { type: Boolean, default: false },
    editHistory: [
      {
        content: String,
        editedAt: { type: Date, default: Date.now },
      },
    ],
    editedAt: { type: Date },
    // Reply functionality
    replyTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Message",
      default: null,
    },
    // Deleted by sender only (not visible to sender but visible to others)
    deletedBySender: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// Method to check if message can be edited (15 minute limit)
messageSchema.methods.canBeEdited = function () {
  const now = new Date();
  const messageTime = this.createdAt;
  const fifteenMinutesAgo = new Date(now.getTime() - 15 * 60 * 1000);

  return (
    messageTime >= fifteenMinutesAgo && !this.isDeleted && !this.deletedBySender
  );
};

// Method to check if user can edit/delete this message
messageSchema.methods.canUserModify = function (userId) {
  return this.sender.toString() === userId.toString();
};

const Message = mongoose.model("Message", messageSchema);
module.exports = Message;
