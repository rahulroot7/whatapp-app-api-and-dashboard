const mongoose = require('mongoose');

const statusSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  contentType: {
    type: String,
    enum: ['text', 'image', 'video'],
    required: true,
  },
  text: String, // for text status
  mediaUrl: String, // for image/video
  visibility: {
    type: String,
    enum: ['public', 'user', 'business', 'custom'],
    default: 'public',
  },
  allowedUsers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }], // for custom
  excludedGroups: [String], // optional group/category exclusion
  views: [
    {
      user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      viewedAt: { type: Date, default: Date.now }
    }
  ],
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 86400 // auto-delete after 24 hours
  },
}, { timestamps: true });

module.exports = mongoose.model('Status', statusSchema);
