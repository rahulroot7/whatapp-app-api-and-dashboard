const controller = {};
const Role = require("../../models/Role");
const User = require("../../models/User");
const Otp = require("../../models/Otp");
const ApiError = require("../../utils/ApiError");
const ApiResponse = require("../../utils/ApiResponse");
const { validationResult } = require("express-validator");
const { aadharSendOtp, aadharVerifyOtp } = require('../../services/aadhaarApiService.js')

controller.userDashboard = async (req, res) => {
  try {
    const currentUserId = req.user.id;

    const [users, profile] = await Promise.all([
      User.find({ _id: currentUserId, status: "1" }),
      User.findOne({ _id: currentUserId, status: "1" }),
    ]);

    const data = {
      users: users
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
    const {
      first_name,
      last_name,
      email,
      bio,
      role,
      businessDetails
    } = req.body;
    const existingUser = await User.findById(userId);
    if (!existingUser) {
      return res.status(404).json(new ApiResponse(404, null, "User not found"));
    }

    const allowedRoles = ['user', 'business'];
    if (!role || !allowedRoles.includes(role.toLowerCase())) {
      return res.status(400).json(new ApiResponse(400, null, "Invalid role"));
    }

    const roleId = await Role.findOne({
      name: new RegExp(`^${role}$`, 'i'),
    });

    if (!roleId) {
      return res.status(404).json(new ApiResponse(404, null, "Role not found"));
    }

    const profileFile = req.files?.profilePic?.[0];
    const selfieFile = req.files?.selfie?.[0];

    const profileImage = profileFile ? `uploads/profiles/${profileFile.filename}` : existingUser.profilePic;
    const selfieUrl = selfieFile ? `uploads/profiles/${selfieFile.filename}` : existingUser.businessDetails?.selfieUrl || '';

    existingUser.first_name = first_name || existingUser.first_name;
    existingUser.last_name = last_name || existingUser.last_name;
    existingUser.email = email || existingUser.email;
    existingUser.bio = bio || existingUser.bio;
    existingUser.role = roleId._id;
    existingUser.profilePic = profileImage;
    // 👇 Only set business details if role is "business"
    if (role.toLowerCase() === 'business' && businessDetails) {
      let parsedDetails;
      try {
        parsedDetails = typeof businessDetails === 'string'
          ? JSON.parse(businessDetails)
          : businessDetails;
      } catch (err) {
        return res.status(400).json(new ApiResponse(400, null, "Invalid businessDetails JSON"));
      }

      existingUser.businessDetails = {
        fullName: parsedDetails.fullName || '',
        contactDetails: parsedDetails.contactDetails || '',
        businessName: parsedDetails.businessName || '',
        businessCategory: parsedDetails.businessCategory || '',
        businessAddress: {
          addressLine: parsedDetails.businessAddress?.addressLine || '',
          pinCode: parsedDetails.businessAddress?.pinCode || '',
          mapLocation: {
            latitude: parsedDetails.businessAddress?.mapLocation?.latitude || 0,
            longitude: parsedDetails.businessAddress?.mapLocation?.longitude || 0
          }
        },
        idProof: {
          type: parsedDetails.idProof?.type || '',
          number: parsedDetails.idProof?.number || '',
          otpVerified: parsedDetails.idProof?.otpVerified || false
        },
        selfieUrl: selfieUrl,
        socialLinks: {
          facebook: parsedDetails.socialLinks?.facebook || '',
          instagram: parsedDetails.socialLinks?.instagram || '',
          website: parsedDetails.socialLinks?.website || ''
        }
      };
    }

    await existingUser.save();

    return res.status(200).json(new ApiResponse(200, existingUser, "Profile updated successfully"));

  } catch (error) {
    console.error("Profile Update Error:", error);
    return res
      .status(500)
      .json(new ApiResponse(500, error.message, "Something went wrong!"));
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

controller.aadharVerification = async (req, res) => {
  try {
    const result = validationResult(req);
    if (!result.isEmpty()) {
      return res.status(400).json({ errors: result.array() });
    }

    const { aadharNumber } = req.body;
    const expiresAt = new Date(Date.now() + 1 * 60 * 1000);

    const sendResult = await aadharSendOtp(aadharNumber);
    if (!sendResult.success) {
      return res.status(500).json(new ApiError(500, "Failed to send OTP", [sendResult.message]));
    }

    const existingOtp = await Otp.findOne({ aadharNumber, type: 'aadhar' });

    if (existingOtp) {
      existingOtp.otp = '4321';
      existingOtp.expires_at = expiresAt;
      await existingOtp.save();
    } else {
      await Otp.create({
        aadharNumber,
        otp: '4321',
        type: 'aadhar',
        expires_at: expiresAt,
      });
    }

    return res.status(200).json(new ApiResponse(200, '4321', "OTP sent successfully"));

  } catch (error) {
    console.error("Aadhar verification Error:", error);
    return res.status(500).json(new ApiError(500, "Something went wrong", [error.message]));
  }
};

controller.aadharVerify = async (req, res) => {
    try {
        const result = validationResult(req);
        if (!result.isEmpty()) {
            return res.status(400).json({ errors: result.array() });
        }
        const { aadharNumber, otp } = req.body;
        const otpEntry = await Otp.findOne({ aadharNumber, type: 'aadhar' });
        if (!otpEntry) {
            return res.status(400).json(new ApiError(400, null, "No OTP request found"));
        }
        if (otpEntry.expires_at < new Date()) {
            return res.status(400).json(new ApiError(400, null, "OTP expired"));
        }
        const referenceId = otpEntry.otp;
        const sendResult = await aadharVerifyOtp(referenceId, otp);
        if (!sendResult.success) {
            return res.status(400).json(new ApiError(400, "OTP verification failed", [sendResult.message]));
        }
        await otpEntry.deleteOne();
        return res.status(200).json(new ApiResponse(200, null, "OTP verified successfully"));

    } catch (error) {
        console.error("Aadhar verification Error:", error);
        return res.status(500).json(new ApiError(500, "Something went wrong", [error.message]));
    }
};

module.exports = controller;
