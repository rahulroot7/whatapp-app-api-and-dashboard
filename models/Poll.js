const mongoose = require('mongoose');

const pollSchema = new mongoose.Schema({
  creator: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  chatId: { type: mongoose.Schema.Types.ObjectId, ref: 'Chat' },
  type: { type: String, enum: ['poll', 'survey'], default: 'poll' },
  title: { type: String },
  isAnonymous: { type: Boolean, default: true },
  allowsMultipleVotes: { type: Boolean, default: false },
  expiresAt: { type: Date },
  questions: [
    {
      questionText: String,
      questionType: {
        type: String,
        enum: ['mcq', 'yesno', 'rating', 'text'],
        required: true,
      },
      options: [
        {
          text: String,
          media: String,
        },
      ],
    },
  ],
  responses: [
    {
      user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      answers: [
        {
          questionIndex: Number,
          selectedOptions: [Number],
          rating: Number,
          text: String,
          yesNo: Boolean,
        },
      ],
    },
  ],
  isDeleted: {
    type: Boolean,
    default: false
  },
}, { timestamps: true });

module.exports = mongoose.model('Poll', pollSchema);