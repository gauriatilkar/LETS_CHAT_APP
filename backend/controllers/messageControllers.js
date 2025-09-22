const asyncHandler = require("express-async-handler");
const Message = require("../models/messageModel");
const User = require("../models/userModel");
const Chat = require("../models/chatModel");

//@description     Get all Messages
//@route           GET /api/Message/:chatId
//@access          Protected
const allMessages = asyncHandler(async (req, res) => {
  try {
    const messages = await Message.find({
      chat: req.params.chatId,
      // Only show messages that haven't been deleted for everyone
      $or: [
        { isDeleted: false },
        {
          isDeleted: true,
          deleteType: "sender",
          sender: { $ne: req.user._id },
        },
      ],
      // Don't show messages deleted by sender to the sender
      $or: [
        { deletedBySender: false },
        { deletedBySender: true, sender: { $ne: req.user._id } },
      ],
    })
      .populate("sender", "name pic email")
      .populate("chat")
      .populate({
        path: "replyTo",
        populate: {
          path: "sender",
          select: "name pic email",
        },
      });

    // Filter out view-once messages that have been viewed by current user
    const filteredMessages = messages.filter((message) => {
      if (message.isViewOnce && message.viewedBy.includes(req.user._id)) {
        return false;
      }
      return true;
    });

    res.json(filteredMessages);
  } catch (error) {
    res.status(400);
    throw new Error(error.message);
  }
});

//@description     Create New Message
//@route           POST /api/Message/
//@access          Protected
const sendMessage = asyncHandler(async (req, res) => {
  const {
    content,
    chatId,
    isViewOnce = false,
    mediaType = "text",
    isOnlyEmojis = false,
    replyTo = null,
  } = req.body;

  if (!content || !chatId) {
    console.log("Invalid data passed into request");
    return res.sendStatus(400);
  }

  var newMessage = {
    sender: req.user._id,
    content: content,
    chat: chatId,
    isViewOnce: isViewOnce,
    viewedBy: [],
    isDeleted: false,
    mediaType: mediaType,
    isOnlyEmojis: isOnlyEmojis,
    replyTo: replyTo, // Add reply reference
  };

  try {
    var message = await Message.create(newMessage);

    message = await message.populate("sender", "name pic");
    message = await message.populate("chat");
    message = await message.populate({
      path: "replyTo",
      populate: {
        path: "sender",
        select: "name pic email",
      },
    });
    message = await User.populate(message, {
      path: "chat.users",
      select: "name pic email",
    });

    await Chat.findByIdAndUpdate(req.body.chatId, { latestMessage: message });

    res.json(message);
  } catch (error) {
    res.status(400);
    throw new Error(error.message);
  }
});

//@description     Edit Message (only by sender, within 15 minutes)
//@route           PUT /api/Message/edit/:messageId
//@access          Protected
const editMessage = asyncHandler(async (req, res) => {
  try {
    const { messageId } = req.params;
    const { content } = req.body;
    const userId = req.user._id;

    if (!content || content.trim() === "") {
      res.status(400);
      throw new Error("Message content cannot be empty");
    }

    const message = await Message.findById(messageId);

    if (!message) {
      res.status(404);
      throw new Error("Message not found");
    }

    // Add chat ID check and fetch
    const chat = await Chat.findById(message.chat);
    if (!chat) {
      res.status(404);
      throw new Error("Chat not found");
    }

    // Update message
    message.content = content.trim();
    message.isEdited = true;
    message.editedAt = new Date();

    await message.save();

    // Emit socket event
    req.io.to(chat._id.toString()).emit("message updated", {
      chatId: chat._id,
      message: message,
    });

    res.json(message);
  } catch (error) {
    res.status(400);
    throw new Error(error.message);
  }
});

//@description     Delete Message (only by sender)
//@route           DELETE /api/Message/delete/:messageId
//@access          Protected
const deleteMessage = asyncHandler(async (req, res) => {
  try {
    const { messageId } = req.params;
    const userId = req.user._id;

    // Find message and populate chat
    const message = await Message.findById(messageId)
      .populate("chat")
      .populate("sender");

    if (!message) {
      return res.status(404).json({
        success: false,
        message: "Message not found",
      });
    }

    // Check ownership
    if (message.sender._id.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to delete this message",
      });
    }

    // Update message
    message.isDeleted = true;
    message.deleteType = req.body.deleteFor || "sender";
    await message.save();

    // Emit socket event
    if (req.io) {
      req.io.to(message.chat._id.toString()).emit("message deleted", {
        messageId: message._id,
        chatId: message.chat._id,
        deleteFor: message.deleteType,
      });
    }

    return res.json({
      success: true,
      messageId: message._id,
      deleteType: message.deleteType,
    });
  } catch (error) {
    console.error("Delete message error:", error);
    return res.status(500).json({
      success: false,
      message: "Error deleting message",
      error: error.message,
    });
  }
});

//@description     Get View Once Message Content (one time only)
//@route           GET /api/Message/view-once/:messageId
//@access          Protected
const getViewOnceMessage = asyncHandler(async (req, res) => {
  try {
    const messageId = req.params.messageId;
    const userId = req.user._id;

    const message = await Message.findById(messageId).populate(
      "sender",
      "name pic email"
    );

    if (!message) {
      res.status(404);
      throw new Error("Message not found");
    }

    if (!message.isViewOnce) {
      res.status(400);
      throw new Error("This is not a view-once message");
    }

    if (message.isDeleted) {
      res.status(410);
      throw new Error("Message has been deleted");
    }

    // Check if user has already viewed this message
    if (message.viewedBy.includes(userId)) {
      res.status(410);
      throw new Error("Message already viewed by you");
    }

    // Check if sender is trying to view their own message
    if (message.sender._id.toString() === userId.toString()) {
      res.status(400);
      throw new Error("You cannot view your own view-once message");
    }

    // Mark as viewed by current user
    message.viewedBy.push(userId);

    // Get chat to determine if all recipients have viewed
    const chat = await Chat.findById(message.chat);
    const recipients = chat.users.filter(
      (user) => user.toString() !== message.sender._id.toString()
    );

    // If all recipients have viewed the message, mark it as deleted
    if (message.viewedBy.length >= recipients.length) {
      message.isDeleted = true;
    }

    await message.save();

    res.json({
      _id: message._id,
      content: message.content,
      sender: message.sender,
      createdAt: message.createdAt,
      isViewOnce: true,
      hasBeenViewed: true,
      viewedBy: message.viewedBy,
      isDeleted: message.isDeleted,
      mediaType: message.mediaType,
    });
  } catch (error) {
    res.status(400);
    throw new Error(error.message);
  }
});

//@description     Get Message Edit History
//@route           GET /api/Message/:messageId/history
//@access          Protected
const getMessageHistory = asyncHandler(async (req, res) => {
  try {
    const { messageId } = req.params;
    const userId = req.user._id;

    const message = await Message.findById(messageId).populate(
      "sender",
      "name pic email"
    );

    if (!message) {
      res.status(404);
      throw new Error("Message not found");
    }

    // Only sender can view edit history
    if (message.sender._id.toString() !== userId.toString()) {
      res.status(403);
      throw new Error("You can only view history of your own messages");
    }

    if (!message.isEdited) {
      res.status(400);
      throw new Error("This message has not been edited");
    }

    res.json({
      messageId: message._id,
      currentContent: message.content,
      isEdited: message.isEdited,
      editedAt: message.editedAt,
      editHistory: message.editHistory,
    });
  } catch (error) {
    res.status(400);
    throw new Error(error.message);
  }
});

//@description     Mark Message as Read
//@route           PUT /api/Message/:messageId/read
//@access          Protected
const markMessageAsRead = asyncHandler(async (req, res) => {
  try {
    const { messageId } = req.params;
    const userId = req.user._id;

    const message = await Message.findById(messageId);

    if (!message) {
      res.status(404);
      throw new Error("Message not found");
    }

    // Don't mark own messages as read
    if (message.sender.toString() === userId.toString()) {
      res.status(400);
      throw new Error("Cannot mark your own message as read");
    }

    // Check if already marked as read by this user
    const alreadyRead = message.readBy.some(
      (read) => read.user.toString() === userId.toString()
    );

    if (!alreadyRead) {
      message.readBy.push({
        user: userId,
        readAt: new Date(),
      });
      await message.save();
    }

    res.json({
      success: true,
      messageId: message._id,
      readBy: message.readBy,
    });
  } catch (error) {
    res.status(400);
    throw new Error(error.message);
  }
});

//@description     Mark Multiple Messages as Read (for a chat)
//@route           PUT /api/Message/read-all/:chatId
//@access          Protected
const markAllMessagesAsRead = asyncHandler(async (req, res) => {
  try {
    const { chatId } = req.params;
    const userId = req.user._id;

    // Get all unread messages in the chat that weren't sent by current user
    const messages = await Message.find({
      chat: chatId,
      sender: { $ne: userId },
      "readBy.user": { $ne: userId },
    });

    // Mark all messages as read
    const updatePromises = messages.map((message) => {
      message.readBy.push({
        user: userId,
        readAt: new Date(),
      });
      return message.save();
    });

    await Promise.all(updatePromises);

    res.json({
      success: true,
      markedCount: messages.length,
      chatId: chatId,
    });
  } catch (error) {
    res.status(400);
    throw new Error(error.message);
  }
});

//@description     Get Read Status for Messages
//@route           GET /api/Message/read-status/:chatId
//@access          Protected
const getReadStatus = asyncHandler(async (req, res) => {
  try {
    const { chatId } = req.params;
    const userId = req.user._id;

    const messages = await Message.find({
      chat: chatId,
      sender: userId, // Only get messages sent by current user
    })
      .populate("readBy.user", "name pic email")
      .select("_id content readBy createdAt");

    const readStatus = messages.map((message) => ({
      messageId: message._id,
      content: message.content.substring(0, 50), // Preview of content
      createdAt: message.createdAt,
      readBy: message.readBy,
      readCount: message.readBy.length,
    }));

    res.json(readStatus);
  } catch (error) {
    res.status(400);
    throw new Error(error.message);
  }
});

module.exports = {
  allMessages,
  sendMessage,
  editMessage,
  deleteMessage,
  getViewOnceMessage,
  getMessageHistory,
  markMessageAsRead,
  markAllMessagesAsRead,
  getReadStatus,
};
