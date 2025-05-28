const controller = {};
const User = require("../../models/User");
const ApiError = require("../../utils/ApiError");
const ApiResponse = require("../../utils/ApiResponse");
const { validationResult } = require("express-validator");

controller.userDashboard = async (req, res) => {
  try {
    const currentUserId = req.user.id;

    const [users, profile] = await Promise.all([
      User.find({ status: "1" }),
      User.findOne({ _id: currentUserId, status: "1" }),
    ]);

    const data = {
      users: users,
      profile: profile,
    };

    res.json(new ApiResponse(200, data, "Dashboard fetched successfully"));
  } catch (error) {
    res.status(500).json(new ApiError(500, "Internal Server Error", [error.message]));
  }
};

controller.profileUpdate = async (req, res) => {
  try {
    const result = validationResult(req);
    if (!result.isEmpty()) {
      return res.status(400).json({ errors: result.array() });
    }

    const userId = req.user.id;
    const { first_name, last_name, email, bio, role } = req.body;

    const existingUser = await User.findById(userId);
    if (!existingUser) {
      return res.status(404).json(new ApiResponse(404, null, "User not found"));
    }

    const profileImage = req.file ? req.file.path : existingUser.profilePic;

    existingUser.first_name = first_name || existingUser.first_name;
    existingUser.last_name = last_name || existingUser.last_name;
    existingUser.email = email || existingUser.email;
    existingUser.bio = bio || existingUser.bio;
    existingUser.role = role || existingUser.role;
    existingUser.profilePic = profileImage;

    await existingUser.save();

    return res.status(200).json(new ApiResponse(200, existingUser, "Profile updated successfully"));
  } catch (error) {
    console.error("Profile Update Error:", error);
    return res.status(500).json({ error: "Something went wrong!", details: error.message });
  }
};

controller.searchUsers = async (req, res) => {
  try {
    const searchTerm = req.query.search || '';
    const rootUserId = req.user.id;
    const query = {};
    if (searchTerm) {
      query.$or = [
        { first_name: { $regex: searchTerm, $options: 'i' } },
        { last_name: { $regex: searchTerm, $options: 'i' } }
      ];
    }
    const users = await User.find(query);
    return res.status(200).json(new ApiResponse(200, users, "Users fetched successfully"));
  } catch (error) {
    console.error("Error in searchUsers:", error);
    return res.status(500).json({
      error: "Something went wrong!",
      details: error.message,
    });
  }
};

module.exports = controller;
