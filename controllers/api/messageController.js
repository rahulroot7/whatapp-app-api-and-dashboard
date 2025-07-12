const Message = require("../../models/Message");
const Chat = require("../../models/Chat");
const User = require("../../models/User");
const ApiError = require("../../utils/ApiError");
const ApiResponse = require("../../utils/ApiResponse");

const controller = {};

controller.sendMessage = async (req, res) => {
  const { chatId, message } = req.body;
  let media = null;

  try {
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

    let msg = await Message.create({
      sender: req.rootUserId,
      message,
      chatId,
      media,
    });

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
    const messages = await Message.find({ chatId })
      .populate({
        path: 'sender',
        model: 'User',
        select: 'name profilePic email',
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

module.exports = controller;
