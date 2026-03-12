const mongoose = require("mongoose");

const shoppingCategorySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true },
    description: { type: String, default: "" },
    status: { type: String, enum: ["active", "inactive"], default: "active" },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, // Admin ID
  },
  { timestamps: true }
);

module.exports = mongoose.model("ShoppingCategory", shoppingCategorySchema);
