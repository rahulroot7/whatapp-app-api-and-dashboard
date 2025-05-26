const jwt = require('jsonwebtoken');
const { User } = require('../models');
const ApiError = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');
const JWT_SECRET = "signin";

// Protect middleware to verify token
const protect = async (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');

  if (!token) {
    return res.json(new ApiResponse(401, null, "No token, authorization denied"));
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    res.status(200).send(new ApiError(401, "", "Invalid token, authorization denied"));
  }
};

// Admin check middleware
const adminAuth = async (req, res, next) => {
  try {
    
    const user = await User.findByPk(req.user.id);
    if (user && user.role === 'admin') {
      return next();
    } else {
      return res.json(new ApiResponse(403, null, "Access denied, admin role required"));
    }
  } catch (error) {
    res.status(200).send(new ApiError(500, "", "Server error"));
  }
};

module.exports = { protect, adminAuth };
