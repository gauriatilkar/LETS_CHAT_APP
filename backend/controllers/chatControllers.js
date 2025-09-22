const asyncHandler = require("express-async-handler");
const Chat = require("../models/chatModel");
const User = require("../models/userModel");
const Message = require("../models/messageModel");
const crypto = require("crypto");

//@description     Create or fetch One to One Chat
//@route           POST /api/chat/
//@access          Protected
const accessChat = asyncHandler(async (req, res) => {
  const { userId } = req.body;

  if (!userId) {
    console.log("UserId param not sent with request");
    return res.sendStatus(400);
  }

  var isChat = await Chat.find({
    isGroupChat: false,
    $and: [
      { users: { $elemMatch: { $eq: req.user._id } } },
      { users: { $elemMatch: { $eq: userId } } },
    ],
  })
    .populate("users", "-password")
    .populate("latestMessage");

  isChat = await User.populate(isChat, {
    path: "latestMessage.sender",
    select: "name pic email",
  });

  if (isChat.length > 0) {
    res.send(isChat[0]);
  } else {
    var chatData = {
      chatName: "sender",
      isGroupChat: false,
      users: [req.user._id, userId],
      // Don't include inviteLinks for one-to-one chats
    };

    try {
      const createdChat = await Chat.create(chatData);
      const FullChat = await Chat.findOne({ _id: createdChat._id }).populate(
        "users",
        "-password"
      );
      res.status(200).json(FullChat);
    } catch (error) {
      res.status(400);
      throw new Error(error.message);
    }
  }
});

//@description     Fetch all chats for a user
//@route           GET /api/chat/
//@access          Protected
const fetchChats = asyncHandler(async (req, res) => {
  try {
    let results = await Chat.find({
      users: { $elemMatch: { $eq: req.user._id } },
    })
      .populate("users", "-password")
      .populate("groupAdmin", "-password")
      .populate("latestMessage")
      .sort({ updatedAt: -1 });

    results = await User.populate(results, {
      path: "latestMessage.sender",
      select: "name pic email",
    });

    // Process each chat to handle view-once messages
    const processedResults = await Promise.all(
      results.map(async (chat) => {
        // If latest message is a view-once message, find the last non-view-once message
        if (chat.latestMessage && chat.latestMessage.isViewOnce) {
          const lastNonViewOnceMessage = await Message.findOne({
            chat: chat._id,
            isViewOnce: { $ne: true }, // Not a view-once message
          })
            .populate("sender", "name pic email")
            .sort({ createdAt: -1 });

          // Update the latestMessage to the last non-view-once message
          chat.latestMessage = lastNonViewOnceMessage;
        }
        return chat;
      })
    );

    res.status(200).send(processedResults);
  } catch (error) {
    res.status(400);
    throw new Error(error.message);
  }
});

//@description     Create New Group Chat
//@route           POST /api/chat/group
//@access          Protected
const createGroupChat = asyncHandler(async (req, res) => {
  if (!req.body.users || !req.body.name) {
    return res.status(400).send({ message: "Please Fill all the fields" });
  }

  var users = JSON.parse(req.body.users);

  if (users.length < 2) {
    return res
      .status(400)
      .send("More than 2 users are required to form a group chat");
  }

  users.push(req.user);

  try {
    const groupChat = await Chat.create({
      chatName: req.body.name,
      users: users,
      isGroupChat: true,
      groupAdmin: req.user,
      // Initialize inviteLinks as empty array for group chats
      inviteLinks: [],
    });

    const fullGroupChat = await Chat.findOne({ _id: groupChat._id })
      .populate("users", "-password")
      .populate("groupAdmin", "-password");

    res.status(200).json(fullGroupChat);
  } catch (error) {
    res.status(400);
    throw new Error(error.message);
  }
});

// @desc    Rename Group
// @route   PUT /api/chat/rename
// @access  Protected
const renameGroup = asyncHandler(async (req, res) => {
  const { chatId, chatName } = req.body;

  const updatedChat = await Chat.findByIdAndUpdate(
    chatId,
    {
      chatName: chatName,
    },
    {
      new: true,
    }
  )
    .populate("users", "-password")
    .populate("groupAdmin", "-password");

  if (!updatedChat) {
    res.status(404);
    throw new Error("Chat Not Found");
  } else {
    res.json(updatedChat);
  }
});

// @desc    Remove user from Group
// @route   PUT /api/chat/groupremove
// @access  Protected
const removeFromGroup = asyncHandler(async (req, res) => {
  const { chatId, userId } = req.body;

  const removed = await Chat.findByIdAndUpdate(
    chatId,
    {
      $pull: { users: userId },
    },
    {
      new: true,
    }
  )
    .populate("users", "-password")
    .populate("groupAdmin", "-password");

  if (!removed) {
    res.status(404);
    throw new Error("Chat Not Found");
  } else {
    res.json(removed);
  }
});

// @desc    Add user to Group / Leave
// @route   PUT /api/chat/groupadd
// @access  Protected
const addToGroup = asyncHandler(async (req, res) => {
  const { chatId, userId } = req.body;

  const added = await Chat.findByIdAndUpdate(
    chatId,
    {
      $push: { users: userId },
    },
    {
      new: true,
    }
  )
    .populate("users", "-password")
    .populate("groupAdmin", "-password");

  if (!added) {
    res.status(404);
    throw new Error("Chat Not Found");
  } else {
    res.json(added);
  }
});

// @desc    Generate invite link for group chat
// @route   POST /api/chat/generate-invite
// @access  Protected
const generateInviteLink = asyncHandler(async (req, res) => {
  const { chatId, expiresIn = 24 * 60 * 60 * 1000 } = req.body; // Default 24 hours

  if (!chatId) {
    res.status(400);
    throw new Error("Chat ID is required");
  }

  const chat = await Chat.findById(chatId);

  if (!chat) {
    res.status(404);
    throw new Error("Chat not found");
  }

  if (!chat.isGroupChat) {
    res.status(400);
    throw new Error("Invite links can only be created for group chats");
  }

  // Check if user is admin or member of the group
  if (!chat.users.includes(req.user._id)) {
    res.status(403);
    throw new Error("You are not a member of this group");
  }

  // Generate unique invite code
  let inviteCode;
  let isUnique = false;
  let attempts = 0;
  const maxAttempts = 5;

  // Ensure unique invite code by checking against existing codes
  while (!isUnique && attempts < maxAttempts) {
    inviteCode = crypto.randomBytes(16).toString("hex");

    // Check if this code already exists in any chat
    const existingChat = await Chat.findOne({
      "inviteLinks.inviteCode": inviteCode,
    });

    if (!existingChat) {
      isUnique = true;
    }
    attempts++;
  }

  if (!isUnique) {
    res.status(500);
    throw new Error("Failed to generate unique invite code");
  }

  const expiresAt = new Date(Date.now() + expiresIn);

  const inviteLink = {
    inviteCode,
    chat: chatId,
    createdBy: req.user._id,
    expiresAt,
    usedCount: 0,
    isActive: true,
  };

  try {
    // Add invite link to chat - ensure inviteLinks array exists
    const updatedChat = await Chat.findByIdAndUpdate(
      chatId,
      {
        $push: { inviteLinks: inviteLink },
        // Ensure inviteLinks field exists
        $setOnInsert: { inviteLinks: [] },
      },
      { new: true, upsert: false }
    ).populate("inviteLinks.createdBy", "name pic email");

    // Get the newly created invite link
    const newInviteLink =
      updatedChat.inviteLinks[updatedChat.inviteLinks.length - 1];

    res.status(201).json({
      success: true,
      message: "Invite link generated successfully",
      inviteLink: newInviteLink,
    });
  } catch (error) {
    if (error.code === 11000) {
      res.status(400);
      throw new Error("Duplicate invite code. Please try again.");
    }
    throw error;
  }
});

// @desc    Join group using invite link
// @route   POST /api/chat/join/:inviteCode
// @access  Protected
const joinGroupByInvite = asyncHandler(async (req, res) => {
  const { inviteCode } = req.params;

  if (!inviteCode) {
    res.status(400);
    throw new Error("Invite code is required");
  }

  const chat = await Chat.findOne({
    "inviteLinks.inviteCode": inviteCode,
    "inviteLinks.isActive": true,
  })
    .populate("users", "-password")
    .populate("groupAdmin", "-password");

  if (!chat) {
    res.status(404);
    throw new Error("Invalid or expired invite link");
  }

  // Find the specific invite link
  const inviteLink = chat.inviteLinks.find(
    (link) => link.inviteCode === inviteCode && link.isActive
  );

  if (!inviteLink) {
    res.status(404);
    throw new Error("Invalid or expired invite link");
  }

  // Check if invite link has expired
  if (new Date() > inviteLink.expiresAt) {
    res.status(400);
    throw new Error("This invite link has expired");
  }

  // Check if user is already in the group
  if (
    chat.users.some((user) => user._id.toString() === req.user._id.toString())
  ) {
    res.status(400);
    throw new Error("You are already a member of this group");
  }

  // Check if invite has reached max uses (if set)
  if (inviteLink.maxUses && inviteLink.usedCount >= inviteLink.maxUses) {
    res.status(400);
    throw new Error("This invite link has reached its usage limit");
  }

  try {
    // Add user to group and increment usage count
    const updatedChat = await Chat.findOneAndUpdate(
      {
        _id: chat._id,
        "inviteLinks.inviteCode": inviteCode,
      },
      {
        $push: { users: req.user._id },
        $inc: { "inviteLinks.$.usedCount": 1 },
      },
      { new: true }
    )
      .populate("users", "-password")
      .populate("groupAdmin", "-password");

    res.status(200).json({
      success: true,
      message: `Successfully joined ${chat.chatName}`,
      chat: updatedChat,
    });
  } catch (error) {
    res.status(500);
    throw new Error("Failed to join group");
  }
});

// @desc    Get all invite links for a chat
// @route   GET /api/chat/invite-links/:chatId
// @access  Protected
const getInviteLinks = asyncHandler(async (req, res) => {
  const { chatId } = req.params;

  const chat = await Chat.findById(chatId)
    .populate("inviteLinks.createdBy", "name pic email")
    .select("inviteLinks groupAdmin users");

  if (!chat) {
    res.status(404);
    throw new Error("Chat not found");
  }

  // Check if user is a member of the group
  if (!chat.users.includes(req.user._id)) {
    res.status(403);
    throw new Error("You are not a member of this group");
  }

  // Handle case where inviteLinks doesn't exist
  if (!chat.inviteLinks) {
    res.status(200).json({
      success: true,
      inviteLinks: [],
    });
    return;
  }

  // Filter active invite links and remove expired ones
  const activeInviteLinks = chat.inviteLinks.filter((link) => {
    if (new Date() > link.expiresAt) {
      link.isActive = false;
      return false;
    }
    return link.isActive;
  });

  // Update the chat to mark expired links as inactive
  await Chat.findByIdAndUpdate(
    chatId,
    {
      $set: {
        "inviteLinks.$[elem].isActive": false,
      },
    },
    {
      arrayFilters: [{ "elem.expiresAt": { $lt: new Date() } }],
    }
  );

  res.status(200).json({
    success: true,
    inviteLinks: activeInviteLinks,
  });
});

// @desc    Revoke/Delete invite link
// @route   DELETE /api/chat/revoke-invite/:inviteLinkId
// @access  Protected
const revokeInviteLink = asyncHandler(async (req, res) => {
  const { inviteLinkId } = req.params;

  const chat = await Chat.findOne({
    "inviteLinks._id": inviteLinkId,
  });

  if (!chat) {
    res.status(404);
    throw new Error("Invite link not found");
  }

  // Check if user is admin or creator of the invite link
  const inviteLink = chat.inviteLinks.id(inviteLinkId);
  if (
    chat.groupAdmin.toString() !== req.user._id.toString() &&
    inviteLink.createdBy.toString() !== req.user._id.toString()
  ) {
    res.status(403);
    throw new Error("Only group admin or invite creator can revoke this link");
  }

  // Remove the invite link
  await Chat.findByIdAndUpdate(chat._id, {
    $pull: { inviteLinks: { _id: inviteLinkId } },
  });

  res.status(200).json({
    success: true,
    message: "Invite link revoked successfully",
  });
});

module.exports = {
  accessChat,
  fetchChats,
  createGroupChat,
  renameGroup,
  addToGroup,
  removeFromGroup,
  generateInviteLink,
  joinGroupByInvite,
  getInviteLinks,
  revokeInviteLink,
};
