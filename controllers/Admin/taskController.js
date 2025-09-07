const controller = {};
const Task = require("../../models/Task");
const User = require("../../models/User");
const ApiError = require("../../utils/ApiError");
const ApiResponse = require("../../utils/ApiResponse");
const { validationResult } = require("express-validator");

controller.taskList = async (req, res) => {
  try {
    const tasks = await Task.find({ isDeleted: false })
      .sort({ dueDate: 1, createdAt: -1 })
      .populate("creator", "first_name last_name photo profilePic")
      .populate("assignees.user", "first_name last_name photo profilePic")
      .populate("chatId", "chatName")
      .populate("checklist.completedBy", "first_name last_name photo profilePic")
      .populate("history.user", "first_name last_name photo profilePic")
      .lean();

    const now = new Date();

    const data = tasks.map((t) => {
      // counts per assignee status
      const byStatus = { pending: 0, todo: 0, in_progress: 0, complete: 0 };
      t.assignees.forEach((a) => {
        if (a?.status && byStatus[a.status] !== undefined) byStatus[a.status]++;
      });

      const totalAssignees = t.assignees.length;
      const completedCount = byStatus.complete;
      const progressPercent =
        totalAssignees > 0 ? Math.round((completedCount / totalAssignees) * 100) : 0;

      // checklist stats
      const checklistTotal = (t.checklist || []).length;
      const checklistCompleted = (t.checklist || []).filter((c) => c.completed).length;

      // overdue: dueDate passed and not all complete
      const overdue = t.dueDate
        ? new Date(t.dueDate) < now && completedCount < totalAssignees
        : false;

      // Build per-assignee minimal info
      const assignees = (t.assignees || []).map((a) => ({
        userId: a.user?._id ?? null,
        name:
          a.user?.name ||
          `${a.user?.first_name || ""} ${a.user?.last_name || ""}`.trim() ||
          "Unknown",
        status: a.status,
        updatedAt: a.updatedAt,
        photo: a.user?.photo || a.user?.profilePic || null,
      }));

      // Checklist with completedBy user info
      const checklist = (t.checklist || []).map((c) => ({
        id: c.id,
        item: c.item,
        completed: c.completed,
        completedBy: c.completedBy
          ? {
              userId: c.completedBy._id,
              name:
                `${c.completedBy.first_name || ""} ${
                  c.completedBy.last_name || ""
                }`.trim() || "Unknown",
              photo: c.completedBy.photo || c.completedBy.profilePic || null,
            }
          : null,
        updatedAt: c.updatedAt,
      }));

      // History with user info
      const history = (t.history || []).map((h) => ({
        action: h.action,
        meta: h.meta,
        timestamp: h.timestamp,
        user: h.user
          ? {
              userId: h.user._id,
              name:
                `${h.user.first_name || ""} ${h.user.last_name || ""}`.trim() ||
                "Unknown",
              photo: h.user.photo || h.user.profilePic || null,
            }
          : null,
      }));

      return {
        _id: t._id,
        title: t.title,
        description: t.description,
        chatName: t.chatId?.chatName || "",
        creator:
          t.creator?.name ||
          `${t.creator?.first_name || ""} ${t.creator?.last_name || ""}`.trim() ||
          "Unknown",
        creatorPhoto: t.creator?.photo || t.creator?.profilePic || null,
        dueDate: t.dueDate,
        priority: t.priority,
        totalAssignees,
        byStatus,
        progressPercent,
        checklistTotal,
        checklistCompleted,
        attachments: t.attachments || [], // return actual attachments
        overdue,
        assignees,
        checklist,
        history,
        createdAt: t.createdAt,
        updatedAt: t.updatedAt,
      };
    });

    return res
      .status(200)
      .json(new ApiResponse(200, data, "Tasks dashboard fetched successfully"));
  } catch (error) {
    return res
      .status(500)
      .json(new ApiError(500, "Internal Server Error", [error.message]));
  }
};


module.exports = controller;
