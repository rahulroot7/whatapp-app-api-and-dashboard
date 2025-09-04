const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema(
  {
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    chatId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Chat',
    },
    billId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Bill',
    },
    message: {
      type: String,
      trim: true,
    },
    media: {
      url: { type: String },
      type: {
        type: String,
        enum: ['image', 'video', 'audio', 'document'],
      },
    },
    contact: {
      name: { type: String },
      phone: { type: String },
      email: { type: String },
      photo: { type: String }, // optional
    },
    location: {
      latitude: { type: Number },
      longitude: { type: Number },
      address: { type: String }, // optional human-readable address
    },
    pollId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Poll',
    },
    eventId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Event',
    },
    taskId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "Task" 
    },
    billId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Bill',
    },
    deletedForEveryone: {
      type: Boolean,
      default: false,
    },
    deletedForUsers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.models.Message || mongoose.model('Message', messageSchema);