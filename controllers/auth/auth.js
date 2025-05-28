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

const JWT_TOKEN = process.env.JWT_SECRET || "signin";

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

    const token = jwt.sign({ id: user._id, role: user.role }, JWT_TOKEN, {
      expiresIn: "1h",
    });

    const data = {
      token: token,
      user: user,
    };

    await Otp.deleteOne({ _id: validOtp._id });

    return res.status(200).json(new ApiResponse(200, data, "OTP verified successfully"));
  } catch (error) {
    console.error("OTP Verification Error:", error);
    return res.status(500).json({ error: "OTP verification failed", details: error.message });
  }
};

module.exports = controller;