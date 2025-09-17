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
      // Only show messages that haven't been deleted due to view-once
      isDeleted: { $ne: true },
    })
      .populate("sender", "name pic email")
      .populate("chat");

    // Filter out view-once messages that have been viewed by current user
    const filteredMessages = messages.filter((message) => {
      if (message.isViewOnce && message.viewedBy.includes(req.user._id)) {
        return false; // Don't show if already viewed by current user
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
  const { content, chatId, isViewOnce = false } = req.body;

  if (!content || !chatId) {
    console.log("Invalid data passed into request");
    return res.sendStatus(400);
  }

  var newMessage = {
    sender: req.user._id,
    content: content,
    chat: chatId,
    isViewOnce: isViewOnce,
    viewedBy: [], // Track who has viewed this message
    isDeleted: false,
  };

  try {
    var message = await Message.create(newMessage);

    message = await message.populate("sender", "name pic");
    message = await message.populate("chat");
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
      res.status(410); // Gone
      throw new Error("Message has been deleted");
    }

    // Check if user has already viewed this message
    if (message.viewedBy.includes(userId)) {
      res.status(410); // Gone
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
    });
  } catch (error) {
    res.status(400);
    throw new Error(error.message);
  }
});

//@description     Mark View Once Message as Viewed (alternative endpoint)
//@route           PUT /api/Message/view-once/:messageId
//@access          Protected
const markViewOnceAsViewed = asyncHandler(async (req, res) => {
  try {
    const messageId = req.params.messageId;
    const userId = req.user._id;

    const message = await Message.findById(messageId);

    if (!message) {
      res.status(404);
      throw new Error("Message not found");
    }

    if (!message.isViewOnce) {
      res.status(400);
      throw new Error("This is not a view-once message");
    }

    // Check if user has already viewed this message
    if (message.viewedBy.includes(userId)) {
      res.status(400);
      throw new Error("Message already viewed");
    }

    // Add user to viewedBy array
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
      message: "Message marked as viewed",
      isDeleted: message.isDeleted,
      content: message.isDeleted ? null : message.content,
      viewedBy: message.viewedBy,
    });
  } catch (error) {
    res.status(400);
    throw new Error(error.message);
  }
});

module.exports = {
  allMessages,
  sendMessage,
  markViewOnceAsViewed,
  getViewOnceMessage,
};
