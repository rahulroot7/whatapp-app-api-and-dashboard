const controller = {};
const Role = require("../../models/Role");
const User = require("../../models/User");
const ApiError = require("../../utils/ApiError");
const ApiResponse = require("../../utils/ApiResponse");
const { validationResult } = require("express-validator");

controller.userProfile = async (req, res) => {
  try {
    const userId = req.user._id;
    const user = await User.findById(userId)
      .populate('role', 'name')
      .select('-password');
    return res.status(200).json(new ApiResponse(200, user, "Profile fetched successfully"));
  } catch (error) {
    return res.status(500).json(new ApiError(500, "Internal Server Error", [error.message]));
  }
}

controller.businessUserList = async (req, res) => {
  try {
    const role = await Role.findOne({ name: "Business" }).select('_id');
    const users = await User.find({ deletedAt: null, role: role?._id })
      .populate('role', 'name')
      .select('-password');

    const data = {
      users,
    };
    return res.status(200).json(
      new ApiResponse(200, data, "Business User list fetched successfully")
    );
  } catch (error) {
    return res.status(500).json(
      new ApiError(500, "Internal Server Error", [error.message])
    );
  }
};

controller.adminUserList = async (req, res) => {
  try {
    const roles = await Role.find({ name: { $in: ["Admin", "Super Admin"] } }).select('_id');
    const roleIds = roles.map(role => role._id);
    const users = await User.find({ deletedAt: null, role: { $in: roleIds } })
      .populate('role', 'name')
      .select('-password');

    const data = {
      users,
    };
    return res.status(200).json(
      new ApiResponse(200, data, "Admin User list fetched successfully")
    );
  } catch (error) {
    return res.status(500).json(
      new ApiError(500, "Internal Server Error", [error.message])
    );
  }
};

controller.userList = async (req, res) => {
  try {
    const role = await Role.findOne({ name: "User" }).select('_id');
    const users = await User.find({ deletedAt: null, role: role?._id })
      .populate('role', 'name')
      .select('-password');

    const data = {
      users,
    };
    return res.status(200).json(
      new ApiResponse(200, data, "User list fetched successfully")
    );
  } catch (error) {
    return res.status(500).json(
      new ApiError(500, "Internal Server Error", [error.message])
    );
  }
};


controller.userCreate = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(200).json(new ApiError(422, "Validation error", errors.array()));
    }
    const { first_name, last_name, email, phone, role } = req.body;
    const profileImage = req.file ? req.file.path : null;
    if (!phone || !role) {
      return res.status(200).json(new ApiResponse(400, null, "Phone and role are required"));
    }
    const existingUser = await User.findOne({ phone });
    if (existingUser) {
      return res.status(200).json(new ApiResponse(409, null, "User with this phone already exists"));
    }
    const emailExist = await User.findOne({ email });
    if (emailExist) {
      return res.status(200).json(new ApiResponse(409, null, "User with this email already exists"));
    }
    const newUser = new User({
      first_name,
      last_name,
      email,
      phone,
      role,
      status: '1',
      profilePic: profileImage
    });
    await newUser.save();
    return res.status(200).json(new ApiResponse(200, newUser, "User created successfully"));
  } catch (error) {
    console.error("User Create Error:", error);
    return res.status(500).json(new ApiResponse(500, error.message, "Something went wrong!"));
  }
};

controller.userUpdate = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(200).json(new ApiError(422, "Validation error", errors.array()));
    }
    const userId = req.params.id;
    const { first_name, last_name, email, phone, role } = req.body;
    const profileImage = req.file ? req.file.path : null;
    const existingUser = await User.findById(userId);
    if (!existingUser) {
      return res.status(200).json(new ApiResponse(404, null, "User not found"));
    }
    if (phone && phone !== existingUser.phone) {
      const userWithPhone = await User.findOne({ phone });
      if (userWithPhone) {
        return res.status(200).json(new ApiResponse(409, null, "Phone number already exists"));
      }
    }

    if (email && email !== existingUser.email) {
      const userWithEmail = await User.findOne({ email });
      if (userWithEmail) {
        return res.status(200).json(new ApiResponse(409, null, "Email already exists"));
      }
    }
    existingUser.first_name = first_name || existingUser.first_name;
    existingUser.last_name = last_name || existingUser.last_name;
    existingUser.email = email || existingUser.email;
    existingUser.phone = phone || existingUser.phone;
    existingUser.profilePic = profileImage || existingUser.profilePic;
    existingUser.role = role || existingUser.role;
    await existingUser.save();
    return res.status(200).json(new ApiResponse(200, existingUser, "User updated successfully"));
  } catch (error) {
    console.error("User Update Error:", error);
    return res.status(500).json(new ApiResponse(500, error.message, "Something went wrong!"));
  }
};

controller.userDetail = async (req, res) => {
  try {
    const userId = req.params.id;
    const user = await User.findById(userId)
      .populate('role', 'name')
      .select('-password');
    return res.status(200).json(new ApiResponse(200, user, "User Detail fetched successfully"));
  } catch (error) {
    return res.status(500).json(new ApiError(500, "Internal Server Error", [error.message]));
  }
}

controller.userChangeStatus = async (req, res) => {
  try {
    const userId = req.params.id;
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json(new ApiError(404, "User not found"));
    }
    const newStatus = user.status === '1' ? '0' : '1';
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { status: newStatus },
      { new: true }
    )
      .populate('role', 'name')
      .select('-password');
    return res.status(200).json(new ApiResponse(200, updatedUser, "User status changed successfully")
    );
  } catch (error) {
    return res.status(500).json(new ApiError(500, "Internal Server Error", [error.message]));
  }
};

controller.userDelete = async (req, res) => {
  try {
    const userId = req.params.id;
    const user = await User.findByIdAndUpdate(
      userId,
      { deletedAt: new Date(), status: '0' },
      { new: true }
    ).populate('role', 'name').select('-password');
    return res.status(200).json(new ApiResponse(200, user, "User Deleted successfully"));
  } catch (error) {
    return res.status(500).json(new ApiError(500, "Internal Server Error", [error.message]));
  }
}

controller.restoreUser = async (req, res) => {
  try {
    const userId = 'req.params.id';
    const user = await User.findByIdAndUpdate(
      userId,
      { deletedAt: null },
      { new: true }
    )
    .populate('role', 'name')
    .select('-password');

    if (!user) {
      return res.status(404).json(new ApiError(404, "User not found"));
    }

    return res.status(200).json(new ApiResponse(200, user, "User restored successfully"));
  } catch (error) {
    return res.status(500).json(new ApiError(500, "Internal Server Error", [error.message]));
  }
}

controller.dashboardUserRoleGet = async (req, res) => {
  try {
    const roles = await Role.find({ isDeleted: false }).select('_id name');
    return res.status(200).json(
      new ApiResponse(200, roles, "Roles fetched successfully")
    );
  } catch (error) {
    return res.status(500).json(
      new ApiError(500, "Internal Server Error", [error.message])
    );
  }
}

controller.dashboardUserRoleDetails = async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
            .select('-password')
            .populate({ path: 'role', select: 'permissions' });
    return res.status(200).json(
      new ApiResponse(200, user, "Dashboard user details fetched successfully")
    );
  } catch (error) {
    return res.status(500).json(
      new ApiError(500, "Internal Server Error", [error.message])
    );
  }
}

module.exports = controller;
