// models/ShoppingPost.js
const mongoose = require("mongoose");

const commentSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    text: { type: String, required: true },
  },
  { timestamps: true }
);

const shoppingPostSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: { type: String, default: "" },
    price: { type: Number, required: true },
    images: [{ type: String }], // multiple product images
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ShoppingCategory",
      required: true,
    },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    likes: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    comments: [commentSchema],
    views: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    status: { type: String, enum: ["active", "inactive"], default: "active" },
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

// Index for faster queries
shoppingPostSchema.index({ deletedAt: 1 });
shoppingPostSchema.index({ createdBy: 1, category: 1 });

module.exports = mongoose.model("ShoppingPost", shoppingPostSchema);
