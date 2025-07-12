const controller = {};
const jwt = require("jsonwebtoken");
const { validationResult } = require("express-validator");
const bcrypt = require("bcrypt");
require("dotenv").config({ path: "./.env.development" });

const User = require("../../models/User");
const Otp = require("../../models/Otp");
const ApiError = require("../../utils/ApiError");
const ApiResponse = require("../../utils/ApiResponse");
const sendOtp = require("../../services/sendOtp");
const crypto = require("crypto");
const sendEmail = require("../../services/sendEmail");

const JWT_TOKEN = process.env.JWT_SECRET || "signin";

controller.getOtp = async (req, res) => {
  try{
    const otp = await Otp.findOne().sort({ createdAt: -1 });
    return res.status(200).json(new ApiResponse(200, otp, "OTP get successfully"));
  }catch (error) {
    res.status(500).json({ error: "Internal server error", details: error.message });
  }
}

controller.requestOtp = async (req, res) => {
  try {
    const result = validationResult(req);
    if (!result.isEmpty()) {
      return res.status(400).json({ errors: result.array() });
    }

    const { phone } = req.body;
    if (!phone) {
      return res.status(400).json({ error: "Phone number is required" });
    }

    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 1 * 60 * 1000); // 1 minute from now

    const sendResult = await sendOtp(phone, otpCode);
    if (!sendResult.success) {
      return res.status(500).json({ error: "Failed to send OTP", details: sendResult.message });
    }

    const existingOtp = await Otp.findOne({ phone, type: "register" });

    if (existingOtp) {
      existingOtp.otp = otpCode;
      existingOtp.expires_at = expiresAt;
      await existingOtp.save();
    } else {
      await Otp.create({
        phone,
        otp: otpCode,
        type: "register",
        expires_at: expiresAt,
      });
    }

    return res.status(200).json(new ApiResponse(200, null, "OTP sent successfully"));
  } catch (error) {
    console.error("OTP Request Error:", error);
    res.status(500).json({ error: "Internal server error", details: error.message });
  }
};

controller.otpVerify = async (req, res) => {
  try {
    const result = validationResult(req);
    if (!result.isEmpty()) {
      return res.status(400).json({ errors: result.array() });
    }
    const { phone, otp } = req.body;
    const validOtp = await Otp.findOne({ phone, otp, type: "register" });
    if (!validOtp || validOtp.expires_at < new Date()) {
      return res.status(400).json({ error: "Invalid or expired OTP" });
    }
    let user = await User.findOne({ phone });

    if (!user) {
      user = await User.create({
        phone,
        status: "1",
      });
    }
    const token = await user.generateAuthToken();
    const data = {
      token: token,
      user: user,
    };
    await Otp.deleteOne({ _id: validOtp._id });
    return res.status(200).json(new ApiResponse(200, data, "OTP verified successfully"));
  } catch (error) {
    console.error("OTP Verification Error:", error);
    res.status(500).json(new ApiError(500, "OTP verification failed", error.message));
  }
};

// Admin Auth Function
controller.adminLogin = async (req, res) => {
  try {
    const result = validationResult(req);
    if (!result.isEmpty()) {
      return res.status(400).json({ errors: result.array() });
    }

    const { email, password } = req.body;

    const user = await User.findOne({ email });

    if (!user) {
      res.status(404).json(new ApiError(404, "User not found", error.message));
    }
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      res.status(401).json(new ApiError(401, "Invalid email or password", error.message));
    }

    const token = await user.generateAuthToken();

    const data = {
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    };

    return res.status(200).json(new ApiResponse(200, data, "Admin login successful"));
  } catch (error) {
    console.log(error);
    res.status(500).json(new ApiError(500, "Admin login failed", error.message));
  }
};

controller.adminForgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email })
      .populate('role', 'name')
      .select('-password');

    if (!user || !["Admin", "Super Admin"].includes(user.role?.name)) {
      return res.status(404).json(new ApiResponse(404, null, "Admin not found"));
    }
    const resetToken = crypto.randomBytes(20).toString("hex");
    user.resetPasswordToken = crypto.createHash("sha256").update(resetToken).digest("hex");
    user.resetPasswordExpires = Date.now() + 15 * 60 * 1000; // 15 minutes

    await user.save({ validateBeforeSave: false });

    const resetUrl = `http://localhost:3000/reset-password/${resetToken}`;
    const message = `Reset your password by clicking the following link:\n\n${resetUrl}`;

    await sendEmail({
      to: user.email,
      subject: "Admin Password Reset",
      text: message,
    });
    return res.status(200).json(new ApiResponse(200, null, "Reset password email sent Please Check"));
  } catch (error) {
    console.error("Forgot Password Error:", error);
    return res.status(500).json(new ApiError(500, null, "Error sending reset email", error.message));
  }
};

// Admin Reset Password
controller.adminResetPassword = async (req, res) => {
  try {
    const { token, password } = req.body;

    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: Date.now() },
    }).populate('role', 'name');

    if (!user || !["Admin", "Super Admin"].includes(user.role?.name)) {
      return res.status(400).json(new ApiError(400, null, "Invalid or expired token"));
    }

    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;

    await user.save();

    return res.status(200).json(new ApiResponse(200, null, "Password reset successful"));
  } catch (error) {
    console.error("Reset Password Error:", error);
    return res.status(500).json(new ApiError(500, "Reset password failed", error.message));
  }
};

module.exports = controller;