const Chat = require('../../models/Chat');
const User = require('../../models/User');
const ApiError = require('../../utils/ApiError');
const ApiResponse = require('../../utils/ApiResponse');

const controller = {};

controller.accessChats = async (req, res) => {
  try {
    const { userId } = req.body;
    if (!userId) {
      return res.status(400).json(new ApiError(400, "User ID is required"));
    }

    let chatExists = await Chat.find({
      isGroup: false,
      $and: [
        { users: { $elemMatch: { $eq: userId } } }, // receiver id
        { users: { $elemMatch: { $eq: req.rootUserId } } }, //sender Id
      ],
    })
      .populate('users', '-password')
      .populate('latestMessage');

    chatExists = await User.populate(chatExists, {
      path: 'latestMessage.sender',
      select: 'first_name last_name email',
    });

    if (chatExists.length > 0) {
      return res.status(200).json(new ApiResponse(200, chatExists[0], "Chat fetched successfully"));
    }

    const chatData = {
      chatName: 'sender',
      users: [userId, req.rootUserId],
      isGroup: false,
    };

    const newChat = await Chat.create(chatData);
    const populatedChat = await Chat.findOne({ _id: newChat._id }).populate('users', '-password');
    
    return res.status(200).json(new ApiResponse(200, populatedChat, "New chat created"));
  } catch (error) {
    return res.status(500).json(new ApiError(500, "Internal Server Error", [error.message]));
  }
};

controller.fetchAllChats = async (req, res) => {
  try {
    const chats = await Chat.find({
      users: { $elemMatch: { $eq: req.rootUserId } },
    })
      .populate('users', '-password')
      .populate('latestMessage')
      .populate('groupAdmin', '-password')
      .sort({ updatedAt: -1 });

    const finalChats = await User.populate(chats, {
      path: 'latestMessage.sender',
      select: 'first_name last_name email',
    });

    return res.status(200).json(new ApiResponse(200, finalChats, "Chats fetched successfully"));
  } catch (error) {
    return res.status(500).json(new ApiError(500, "Internal Server Error", [error.message]));
  }
};

controller.createGroup = async (req, res) => {
  try {
    const { chatName, users, isTemporary, durationDays } = req.body;

    if (!chatName || !users) {
      return res.status(400).json(new ApiError(400, null, "chatName and users are required"));
    }

    const parsedUsers = JSON.parse(users);
    if (parsedUsers.length < 2) {
      return res.status(400).json(new ApiError(400, null, "Group should contain more than 2 users"));
    }

    parsedUsers.push(req.rootUser);

    const groupChat = await Chat.create({
      chatName,
      users: parsedUsers,
      isGroup: true,
      groupAdmin: req.rootUserId,
      isTemporary: isTemporary || false,
      expiresAt: isTemporary ? new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000) : null,
    });

    const createdChat = await Chat.findById(groupChat._id)
      .populate('users', '-password')
      .populate('groupAdmin', '-password');

    return res.status(200).json(new ApiResponse(200, createdChat, "Group chat created successfully"));
  } catch (error) {
    return res.status(500).json(new ApiError(500, "Internal Server Error", [error.message]));
  }
};

controller.renameGroup = async (req, res) => {
  try {
    console.log(req.body);
    const { chatId, chatName } = req.body;

    if (!chatId || !chatName) {
      return res.status(400).json(new ApiError(400, "chatId and chatName are required"));
    }

    const updatedChat = await Chat.findByIdAndUpdate(
      chatId,
      { chatName },
      { new: true }
    )
      .populate('users', '-password')
      .populate('groupAdmin', '-password');

    if (!updatedChat) {
      return res.status(404).json(new ApiError(404, "Chat not found"));
    }

    return res.status(200).json(new ApiResponse(200, updatedChat, "Chat renamed successfully"));
  } catch (error) {
    return res.status(500).json(new ApiError(500, "Internal Server Error", [error.message]));
  }
};

controller.addToGroup = async (req, res) => {
  try {
    const { userId, chatId } = req.body;

    const chat = await Chat.findById(chatId);
    if (!chat) {
      return res.status(404).json(new ApiError(404, "Chat not found"));
    }

    if (chat.users.includes(userId)) {
      return res.status(409).json(new ApiError(409, "User already in the group"));
    }

    const updatedChat = await Chat.findByIdAndUpdate(
      chatId,
      { $push: { users: userId } },
      { new: true }
    )
      .populate('users', '-password')
      .populate('groupAdmin', '-password');

    return res.status(200).json(new ApiResponse(200, updatedChat, "User added to group"));
  } catch (error) {
    return res.status(500).json(new ApiError(500, "Internal Server Error", [error.message]));
  }
};

controller.removeFromGroup = async (req, res) => {
  try {
    const { userId, chatId } = req.body;

    const chat = await Chat.findById(chatId);
    if (!chat) {
      return res.status(404).json(new ApiError(404, "Chat not found"));
    }

    if (!chat.users.includes(userId)) {
      return res.status(409).json(new ApiError(409, "User not in the group"));
    }

    const updatedChat = await Chat.findByIdAndUpdate(
      chatId,
      { $pull: { users: userId } },
      { new: true }
    )
      .populate('users', '-password')
      .populate('groupAdmin', '-password');

    return res.status(200).json(new ApiResponse(200, updatedChat, "User removed from group"));
  } catch (error) {
    return res.status(500).json(new ApiError(500, "Internal Server Error", [error.message]));
  }
};

controller.removeContact = async (req, res) => {
  return res.status(501).json(new ApiError(501, "Not implemented"));
};

controller.addTemporaryMember = async (req, res) => {
  try {
    const { chatId, userId, durationDays } = req.body;

    if (!chatId || !userId || !durationDays) {
      return res.status(400).json(new ApiError(400, null, "chatId, userId and durationDays are required"));
    }

    const chat = await Chat.findById(chatId);
    if (!chat) {
      return res.status(404).json(new ApiError(404, null, "Chat not found"));
    }
    // Add to users if not already there
    if (!chat.users.includes(userId)) {
      chat.users.push(userId);
    }
    // Add to temporaryMembers list
    chat.temporaryMembers.push({
      user: userId,
      expiresAt: new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000),
    });
    await chat.save();
    const updatedChat = await Chat.findById(chatId)
      .populate('users', '-password')
      .populate('groupAdmin', '-password');

    return res.status(200).json(new ApiResponse(200, updatedChat, "Temporary member added successfully"));
  } catch (error) {
    return res.status(500).json(new ApiError(500, "Internal Server Error", [error.message]));
  }
};

module.exports = controller;
