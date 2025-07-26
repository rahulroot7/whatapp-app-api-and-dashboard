const Status = require("../../models/Status");
const User = require("../../models/User");
const ApiError = require("../../utils/ApiError");
const ApiResponse = require("../../utils/ApiResponse");

const controller = {};

controller.createStatus = async (req, res) => {
  const { contentType, text, visibility } = req.body;
  const allowedUsers = safeJsonParse(req.body.allowedUsers);
  const excludedGroups = safeJsonParse(req.body.excludedGroups);
  let mediaUrl = null;

  if (req.file) {
    mediaUrl = `uploads/status/${req.file.filename}`;
  }

  const newStatus = await Status.create({
    user: req.rootUserId,
    contentType,
    text,
    mediaUrl,
    visibility,
    allowedUsers,
    excludedGroups,
  });

  res.status(200).json(new ApiResponse(201, newStatus, 'Status posted successfull'));
};

function safeJsonParse(input) {
  try {
    if (typeof input === 'string') return JSON.parse(input);
    return Array.isArray(input) ? input : [];
  } catch (err) {
    return [];
  }
}

controller.getOwnStatuses = async (req, res) => {
  const userId = req.rootUserId;
  const statuses = await Status.find({ user: userId })
    .populate('views.user', 'first_name profilePic') // populate viewers
    .sort({ createdAt: -1 });
  res.status(200).json(new ApiResponse(200, statuses, 'Status posted'));
};

controller.viewStatus = async (req, res) => {
  const userId = req.rootUserId;
  const { statusId } = req.params;

  const status = await Status.findById(statusId);

  if (!status) {
    res.status(404).json(new ApiError(404, "Status not found", [error.message]));
  }

  // Don't track self-views
  if (status.user.toString() !== userId.toString()) {
    const alreadyViewed = status.views.find(v => v.user.toString() === userId);
    if (!alreadyViewed) {
      status.views.push({ user: userId });
      await status.save();
    }
  }
  res.status(200).json(new ApiResponse(200, null , 'Status marked as viewed'));
};

controller.deleteStatus = async (req, res) => {
  const userId = req.rootUserId;
  const { statusId } = req.params;
  try {
    const status = await Status.findById(statusId);
    if (!status) {
      return res.status(404).json(new ApiError(404, "Status not found"));
    }
    // Only the owner can delete their own status
    if (status.user.toString() !== userId.toString()) {
      return res.status(403).json(new ApiError(403, "Unauthorized to delete this status"));
    }
    await status.deleteOne();
    return res.status(200).json(new ApiResponse(200, null, "Status deleted successfully"));
  } catch (error) {
    console.error(error);
    return res.status(500).json(new ApiError(500, "Failed to delete status", [error.message]));
  }
};


module.exports = controller;
