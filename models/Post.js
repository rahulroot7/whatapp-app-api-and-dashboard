const mongoose = require("mongoose");

const commentSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    text: { type: String, trim: true, required: true },
  },
  { _id: true, timestamps: { createdAt: true, updatedAt: false } }
);

const viewSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    viewedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const postSchema = new mongoose.Schema(
  {
    creator: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    title: {
      type: String,
      trim: true,
      required: true,
    },
    content: {
      type: String,
      trim: true,
    },
    media: [
      {
        type: String,
      },
    ],
    tags: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    likes: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    comments: [commentSchema],
    views: [viewSchema],
    isPublic: {
      type: Boolean,
      default: true,
    },
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

// helpful indexes
postSchema.index({ isPublic: 1, createdAt: -1 });
postSchema.index({ deletedAt: 1 });

module.exports = mongoose.models.Post || mongoose.model("Post", postSchema);
