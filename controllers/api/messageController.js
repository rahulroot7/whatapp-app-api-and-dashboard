const Message = require("../../models/Message");
const Chat = require("../../models/Chat");
const User = require("../../models/User");
const ApiError = require("../../utils/ApiError");
const ApiResponse = require("../../utils/ApiResponse");

const controller = {};

controller.sendMessage = async (req, res) => {
  const { chatId, message, contact, location } = req.body;
  let media = null;

  try {
    // Handle media upload
    if (req.file) {
      const mimeType = req.file.mimetype;
      let type = 'document';

      if (mimeType.startsWith('image')) type = 'image';
      else if (mimeType.startsWith('video')) type = 'video';
      else if (mimeType.startsWith('audio')) type = 'audio';

      media = {
        url: `uploads/messages/${req.file.filename}`,
        type,
      };
    }

    // Build payload dynamically
    const payload = {
      sender: req.rootUserId,
      chatId,
      message,
      media,
    };

    if (contact) {
      payload.contact = JSON.parse(contact); 
      // Example: { "name":"Rahul", "phone":"+91 9999999999", "email":"rahul@test.com" }
    }

    if (location) {
      payload.location = JSON.parse(location);
      // Example: { "latitude":28.6139, "longitude":77.2090, "address":"New Delhi, India" }
    }
    let msg = await Message.create(payload);

    msg = await (
      await msg.populate('sender', 'name profilePic email')
    ).populate({
      path: 'chatId',
      select: 'chatName isGroup users',
      populate: {
        path: 'users',
        select: 'name email profilePic',
      },
    });

    await Chat.findByIdAndUpdate(chatId, { latestMessage: msg });

    res.status(200).json(new ApiResponse(200, msg, 'Message sent successfully'));
  } catch (error) {
    console.error(error);
    res.status(500).json(new ApiError(500, 'Failed to send message', [error.message]));
  }
};

controller.getMessages = async (req, res) => {
  const { chatId } = req.params;
  try {
    const messages = await Message.find({ chatId, deletedForUsers: { $ne: req.rootUserId }, })
      .populate({
        path: 'sender',
        model: 'User',
        select: 'name profilePic email',
      })
      .populate({
        path: 'pollId',
        populate: [
          { path: 'creator', select: 'name profilePic' },
          {
            path: 'responses.user',
            select: 'name profilePic',
          }
        ]
      })
      .populate({
        path: 'eventId',
        populate: [
          { path: 'creator', select: 'name profilePic' },
          { path: 'rsvps.user', select: 'name profilePic' }
        ]
      })
      .populate({
        path: 'taskId',
        populate: [
          { path: 'creator', select: 'name photo' },
          { path: 'assignees.user', select: 'name photo' }
        ],
        select: 'title priority dueDate attachments assignees checklist'
      })
      .populate({
        path: 'chatId',
        model: 'Chat',
      });

    res.status(200).json(new ApiResponse(200, messages, "Messages fetched successfully"));
  } catch (error) {
    console.log(error);
    res.status(500).json(new ApiError(500, "Failed to fetch messages", [error.message]));
  }
};

controller.deleteMessage = async (req, res) => {
  const { messageId } = req.params;
  const { forEveryone = false } = req.query; 
  const userId = req.rootUserId;
  try {
    const message = await Message.findById(messageId);

    if (!message) {
      return res.status(404).json(new ApiError(404, "Message not found"));
    }
    // If deleting for everyone
    if (forEveryone === 'true') {
      if (String(message.sender) !== String(userId)) {
        return res.status(403).json(new ApiError(403, "You can only delete your own messages for everyone"));
      }
      // Optional: allow within 1 hour only
      const messageTime = new Date(message.createdAt).getTime();
      const currentTime = Date.now();
      const timeDifference = (currentTime - messageTime) / 1000 / 60; // in minutes

      if (timeDifference > 60) {
        return res.status(403).json(new ApiError(403, "You can delete messages for everyone within 1 hour only"));
      }
      message.message = "This message was deleted";
      message.media = null;
      message.deletedForEveryone = true;
      await message.save();
      return res.status(200).json(new ApiResponse(200, message, "Message deleted for everyone"));
    }
    // Deleting for me only
    if (!message.deletedForUsers.includes(userId)) {
      message.deletedForUsers.push(userId);
      await message.save();
    }
    return res.status(200).json(new ApiResponse(200, message, "Message deleted for you"));
  } catch (error) {
    console.error(error);
    return res.status(500).json(new ApiError(500, "Failed to delete message", [error.message]));
  }
};

module.exports = controller;
