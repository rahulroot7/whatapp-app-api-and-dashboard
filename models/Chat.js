const mongoose = require('mongoose');

const chatSchema = new mongoose.Schema(
  {
    photo: {
      type: String,
      default: 'https://cdn-icons-png.flaticon.com/512/9790/9790561.png',
    },
    chatName: {
      type: String,
    },
    isGroup: {
      type: Boolean,
      default: false,
    },
    users: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    latestMessage: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Message',
    },
    groupAdmin: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    // For temporary group
    isTemporary: {
      type: Boolean,
      default: false,
    },
    expiresAt: {
      type: Date, // group expiry
    },
    temporaryMembers: [
      {
        user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        expiresAt: { type: Date }, // member expiry
      }
    ],
    deletedAt: { type: Date, default: null },
  },
  {
    timestamps: true,
  }
);

chatSchema.index({ isTemporary: 1, expiresAt: 1 });
chatSchema.index({ "temporaryMembers.expiresAt": 1 });
chatSchema.index({ deletedAt: 1 });

module.exports = mongoose.models.Chat || mongoose.model('Chat', chatSchema);
