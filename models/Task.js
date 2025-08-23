const mongoose = require("mongoose");

const ASSIGNEE_STATUS = ["pending", "todo", "in_progress", "complete"];

const taskSchema = new mongoose.Schema({
  creator: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  chatId: { type: mongoose.Schema.Types.ObjectId, ref: "Chat", required: true },

  title: { type: String, required: true },
  description: { type: String },
  attachments: [{ type: String }], // uploaded files (paths)

  dueDate: { type: Date },
  priority: { type: String, enum: ["High", "Medium", "Low"], default: "Medium" },

  // Assign to all users of the group; each user tracks their own status
  assignees: [
    {
      user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
      status: { type: String, enum: ASSIGNEE_STATUS, default: "pending" },
      updatedAt: { type: Date, default: Date.now }
    }
  ],

  checklist: [
    {
      _id: false,
      id: { type: mongoose.Schema.Types.ObjectId, default: () => new mongoose.Types.ObjectId() },
      item: String,
      completed: { type: Boolean, default: false },
      completedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      updatedAt: { type: Date }
    }
  ],

  history: [
    {
      action: String, // created | updated | status:<userId>:<newStatus> | checklist:add/toggle/remove | delete
      user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      timestamp: { type: Date, default: Date.now },
      meta: { type: Object }
    }
  ],

  isDeleted: { type: Boolean, default: false }
}, { timestamps: true });

taskSchema.index({ chatId: 1, isDeleted: 1 });
taskSchema.index({ "assignees.user": 1, isDeleted: 1 });

module.exports = mongoose.model("Task", taskSchema);
module.exports.ASSIGNEE_STATUS = ASSIGNEE_STATUS;