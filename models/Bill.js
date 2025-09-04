const mongoose = require("mongoose");

const billSchema = new mongoose.Schema(
  {
    chatId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Chat",
      required: true,
    },
    creator: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    title: { type: String, required: true }, // e.g. "Dinner at Cafe"
    label: { type: String }, // e.g. "Trip", "Rent", "Dinner"

    totalAmount: { type: Number, required: true },
    splitType: {
      type: String,
      enum: ["equal", "custom"],
      default: "equal",
    },
    tax: { type: Number, default: 0 },
    tip: { type: Number, default: 0 },
    discount: { type: Number, default: 0 },

    participants: [
      {
        user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        share: { type: Number, default: 0 }, // calculated share
        paid: { type: Number, default: 0 }, // how much user paid
        settled: { type: Boolean, default: false },
      },
    ],

    receipts: [
      {
        type: String, // file paths for images/PDFs
      },
    ],

    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.models.Bill || mongoose.model("Bill", billSchema);