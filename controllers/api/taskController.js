const Task = require("../../models/Task");
const Chat = require("../../models/Chat");
const Message = require("../../models/Message");
const ApiError = require("../../utils/ApiError");
const ApiResponse = require("../../utils/ApiResponse");
const { ASSIGNEE_STATUS } = require("../../models/Task");

const controller = {};

// Helper: map any aliases to canonical status values
const normalizeStatus = (s) => {
  if (!s) return null;
  const x = String(s).trim().toLowerCase();
  if (x === "completed") return "complete";
  if (x === "in progress" || x === "in-progress") return "in_progress";
  if (["pending","todo","in_progress","complete"].includes(x)) return x;
  return null;
};

// Broadcast helper (Socket.IO assumed attached to app)
const emitToChat = (req, chatId, event, payload) => {
  try {
    const io = req.app.get("io");
    if (io) io.to(String(chatId)).emit(event, payload);
  } catch (_) {}
};

// ---------------------- Create Task (assign to all users in chat) ----------------------
controller.createTask = async (req, res) => {
  try {
    const { chatId, title, description, dueDate, priority, checklist } = req.body;

    const chat = await Chat.findById(chatId).lean(); 
    if (!chat) return res.status(404).json(new ApiError(404, null, "Chat not found"));

    const rootUserId = req.rootUserId.toString();
    const isMember =
      chat.users.some(u => u._id.toString() === rootUserId) ||
      chat.groupAdmin?.toString() === rootUserId;

    if (!isMember)
      return res.status(403).json(new ApiError(403, null, "Not a member of this chat"));

    const [existing] = await Task.find({
        chatId,
        title,
        creator: req.rootUserId
        })
        .sort({ createdAt: -1 })
        .limit(1);

    if (existing) {
        const diff = Date.now() - existing.createdAt.getTime();
        if (diff < 3600000) { // 1 hour = 60 * 60 * 1000 ms
            return res.status(409).json(new ApiError(409, null, "Task already created recently"));
        }
    }
    // Normalize group users
    const allUsers = [
      ...(chat.users || []).map(u => (u._id ? u._id.toString() : u.toString())),
      chat.groupAdmin?.toString()
    ].filter(Boolean); 
    const assignees = allUsers.map(uid => ({
      user: uid,
      status: "pending"
    }));

    const task = await Task.create({
      creator: req.rootUserId,
      chatId,
      title,
      description,
      dueDate,
      priority,
      assignees,
      checklist: Array.isArray(checklist)
        ? checklist.map(txt => ({ item: String(txt) }))
        : [],
      history: [{ action: "created", user: req.rootUserId }]
    });

    await Message.create({
      sender: req.rootUserId,
      chatId,
      taskId: task._id
    });

    const populated = await Task.findById(task._id)
      .populate("creator", "name photo")
      .populate("assignees.user", "name photo")
      .lean();

    emitToChat(req, chatId, "task:created", populated);

    res
      .status(201)
      .json(new ApiResponse(201, populated, "Task created for all group members"));
  } catch (error) {
    res
      .status(500)
      .json(new ApiError(500, "Failed to create task", [error.message]));
  }
};


// ---------------------- Get Single Task (see all members' statuses) ----------------------
controller.getTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id)
      .populate("creator", "name photo")
      .populate("assignees.user", "name photo")
      .populate("history.user", "name photo")
      .lean();

    if (!task) return res.status(404).json(new ApiError(404, null, "Task not found"));
    res.status(200).json(new ApiResponse(200, task, "Task fetched"));
  } catch (error) {
    res.status(500).json(new ApiError(500, "Error fetching task", [error.message]));
  }
};

// ---------------------- Get all tasks in a chat (+optional filters) ----------------------
controller.getChatTasks = async (req, res) => {
  try {
    const { chatId } = req.params;
    const { mine, status } = req.query; // mine=1 to get only tasks assigned to me; status filter per-assignee

    const match = { chatId, isDeleted: false };
    let tasks = await Task.find(match)
      .sort({ dueDate: 1, createdAt: -1 })
      .populate("creator", "name photo")
      .populate("assignees.user", "name photo")
      .lean();

    // Per-user filter if requested
    if (mine === "1") {
      tasks = tasks.filter(t => t.assignees.some(a => a.user && a.user._id.toString() === req.rootUserId));
    }

    // Per-assignee status filter if provided
    const norm = normalizeStatus(status);
    if (norm) {
      tasks = tasks.filter(t => t.assignees.some(a => a.status === norm));
    }

    // Quick summary for board views
    const summary = {
      total: tasks.length,
      byStatus: { pending: 0, todo: 0, in_progress: 0, complete: 0 }
    };
    tasks.forEach(t => {
      t.assignees.forEach(a => {
        if (summary.byStatus[a.status] !== undefined) summary.byStatus[a.status]++;
      });
    });

    res.status(200).json(new ApiResponse(200, { tasks, summary }, "Tasks fetched"));
  } catch (error) {
    res.status(500).json(new ApiError(500, "Error fetching tasks", [error.message]));
  }
};

// ---------------------- Update task meta (creator only) ----------------------
controller.updateTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json(new ApiError(404, null, "Task not found"));
    if (task.creator.toString() !== req.rootUserId.toString()) {
      return res.status(403).json(new ApiError(403, null, "Not authorized"));
    }

    // Only allow safe fields to be updated
    const { title, description, dueDate, priority } = req.body;
    if (title !== undefined) task.title = title;
    if (description !== undefined) task.description = description;
    if (dueDate !== undefined) task.dueDate = dueDate;
    if (priority !== undefined) task.priority = priority;

    task.history.push({ action: "updated", user: req.rootUserId });
    await task.save();

    const populated = await Task.findById(task._id)
      .populate("creator", "name photo")
      .populate("assignees.user", "name photo")
      .lean();

    emitToChat(req, task.chatId, "task:updated", populated);

    res.status(200).json(new ApiResponse(200, populated, "Task updated successfully"));
  } catch (error) {
    res.status(500).json(new ApiError(500, "Failed to update task", [error.message]));
  }
};

// ---------------------- Update my status (assignee updates themselves) ----------------------
controller.updateMyTaskStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const norm = normalizeStatus(req.body.status);
    if (!norm) return res.status(400).json(new ApiError(400, null, "Invalid status"));

    const task = await Task.findById(id);
    if (!task) return res.status(404).json(new ApiError(404, null, "Task not found"));

    const assignee = task.assignees.find(a => a.user.toString() === req.rootUserId.toString());
    if (!assignee) return res.status(403).json(new ApiError(403, null, "You are not assigned to this task"));

    assignee.status = norm;
    assignee.updatedAt = new Date();
    task.history.push({
      action: `status:${norm}`,
      user: req.rootUserId,
      meta: { userId: req.rootUserId, status: norm }
    });

    await task.save();

    const populated = await Task.findById(task._id)
      .populate("creator", "name photo")
      .populate("assignees.user", "name photo")
      .lean();

    emitToChat(req, task.chatId, "task:statusUpdated", {
      taskId: task._id,
      userId: req.rootUserId,
      status: norm,
      task: populated
    });

    res.status(200).json(new ApiResponse(200, populated, "Your task status updated"));
  } catch (error) {
    res.status(500).json(new ApiError(500, "Failed to update task status", [error.message]));
  }
};

// ---------------------- Checklist ops (add / toggle / remove) ----------------------
controller.updateChecklist = async (req, res) => {
  try {
    const { id } = req.params; // taskId
    const { action, text, itemId } = req.body; // action: add|toggle|remove

    const task = await Task.findById(id);
    if (!task) return res.status(404).json(new ApiError(404, null, "Task not found"));

    if (action === "add") {
      if (!text) return res.status(400).json(new ApiError(400, null, "Text required"));
      task.checklist.push({ item: text, completed: false });
      task.history.push({ action: "checklist:add", user: req.rootUserId, meta: { text } });
    } else if (action === "toggle") {
      const item = task.checklist.find(c => c.id && c.id.toString() === itemId);
      if (!item) return res.status(404).json(new ApiError(404, null, "Checklist item not found"));
      item.completed = !item.completed;
      item.completedBy = item.completed ? req.rootUserId : undefined;
      item.updatedAt = new Date();
      task.history.push({ action: "checklist:toggle", user: req.rootUserId, meta: { itemId, completed: item.completed } });
    } else if (action === "remove") {
      const before = task.checklist.length;
      task.checklist = task.checklist.filter(c => !(c.id && c.id.toString() === itemId));
      if (before === task.checklist.length) {
        return res.status(404).json(new ApiError(404, null, "Checklist item not found"));
      }
      task.history.push({ action: "checklist:remove", user: req.rootUserId, meta: { itemId } });
    } else {
      return res.status(400).json(new ApiError(400, null, "Invalid action"));
    }

    await task.save();

    const populated = await Task.findById(task._id)
      .populate("creator", "name photo")
      .populate("assignees.user", "name photo")
      .lean();

    emitToChat(req, task.chatId, "task:checklistUpdated", populated);

    res.status(200).json(new ApiResponse(200, populated, "Checklist updated"));
  } catch (error) {
    res.status(500).json(new ApiError(500, "Failed to update checklist", [error.message]));
  }
};

// ---------------------- Attachments (upload) ----------------------
controller.addAttachments = async (req, res) => {
  try {
    const { id } = req.params; // taskId
    const task = await Task.findById(id);
    if (!task) return res.status(404).json(new ApiError(404, null, "Task not found"));

    const files = (req.files || []).map(f => f.path.replace(/\\/g, "/"));
    if (!files.length) return res.status(400).json(new ApiError(400, null, "No files uploaded"));

    task.attachments.push(...files);
    task.history.push({ action: "attachments:add", user: req.rootUserId, meta: { count: files.length } });

    await task.save();

    const populated = await Task.findById(task._id)
      .populate("creator", "name photo")
      .populate("assignees.user", "name photo")
      .lean();

    emitToChat(req, task.chatId, "task:attachmentsAdded", { taskId: task._id, files, task: populated });

    res.status(200).json(new ApiResponse(200, populated, "Attachments added"));
  } catch (error) {
    res.status(500).json(new ApiError(500, "Failed to add attachments", [error.message]));
  }
};

// ---------------------- Delete (soft) — creator only ----------------------
controller.deleteTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json(new ApiError(404, null, "Task not found"));
    if (task.creator.toString() !== req.rootUserId.toString()) {
      return res.status(403).json(new ApiError(403, null, "Not authorized"));
    }

    task.isDeleted = true;
    task.history.push({ action: "delete", user: req.rootUserId });

    await task.save();

    emitToChat(req, task.chatId, "task:deleted", { taskId: task._id });

    res.status(200).json(new ApiResponse(200, null, "Task deleted successfully"));
  } catch (error) {
    res.status(500).json(new ApiError(500, "Failed to delete task", [error.message]));
  }
};

module.exports = controller;
