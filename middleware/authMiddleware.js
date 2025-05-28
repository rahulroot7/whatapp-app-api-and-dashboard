const jwt = require('jsonwebtoken');
const User = require('../models/User'); // mongoose model
const ApiError = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');

const JWT_SECRET = process.env.JWT_SECRET || "signin";

// Middleware to protect routes
const protect = async (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');

  if (!token) {
    return res.status(401).json(new ApiResponse(401, null, "No token, authorization denied"));
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded; // contains id and role (if encoded)
    next();
  } catch (error) {
    return res.status(401).json(new ApiError(401, "", "Invalid token, authorization denied"));
  }
};

// Middleware to allow only admins
const adminAuth = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);

    if (user && user.role === 'admin') {
      return next();
    } else {
      return res.status(403).json(new ApiResponse(403, null, "Access denied, admin role required"));
    }
  } catch (error) {
    return res.status(500).json(new ApiError(500, "", "Server error"));
  }
};

module.exports = { protect, adminAuth };
