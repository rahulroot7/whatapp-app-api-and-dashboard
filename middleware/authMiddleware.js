const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Role = require('../models/Role');
const ApiError = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');
const { match } = require('path-to-regexp');

const JWT_SECRET = process.env.JWT_SECRET || 'defaultsecret';

const protect = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json(new ApiResponse(401, null, 'No token provided'));
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await User.findById(decoded.id).select('-password');
    if (!user) {
      return res.status(401).json(new ApiResponse(401, null, 'User not found'));
    }
    if (user.status !== '1') {
      console.log('ssdssdasdasdf');
      return res.status(401).json(new ApiError(401, 'User is not active', 'Unauthorized'));
    }

    req.token = token;
    req.user = user;
    req.rootUserId = user._id;
    next();
  } catch (error) {
    return res.status(401).json(new ApiError(401, error.message, 'Unauthorized'));
  }
};

const adminProtect = async (req, res, next) => {
  await protect(req, res, async () => {
    try {
      const role = await Role.findById(req.user.role).select('name');
      if (!role) {
        return res.status(403).json(new ApiError(403, null, 'Role not found'));
      }
      const allowedRoleNames = ['admin', 'super admin', 'sub admin'];
      if (!allowedRoleNames.includes(role.name.toLowerCase())) {
        return res.status(403).json(new ApiError(403, null, 'Access denied: Admins only'));
      }
      next();
    } catch (err) {
      return res.status(403).json(new ApiError(403, err.message, 'Role validation failed'));
    }
  });
};

const dashboardProtect = async (req, res, next) => {
  await protect(req, res, async () => {
    try {
      const user = await User.findById(req.user._id)
        .select('-password')
        .populate({ path: 'role', select: 'routes' });

      if (!user || user.status !== '1') {
        return res.status(401).json(new ApiError(401, null, 'Unauthorized or inactive user'));
      }
      const allowedRoutes = user.role?.routes || [];
      const requestedPath = req.originalUrl.split('?')[0].trim();
      const isAllowed = allowedRoutes.some(routePattern => {
        try {
          const matcher = match(routePattern.trim(), { decode: decodeURIComponent });
          const matched = matcher(requestedPath);
          return matched !== false;
        } catch (e) {
          return false;
        }
      });
      if (!isAllowed) {
        return res.status(403).json(new ApiError(403, null, 'Access to this dashboard route is denied'));
      }
      req.user = user;
      next();
    } catch (err) {
      return res.status(401).json(new ApiError(401, err.message, 'Dashboard Access Denied'));
    }
  });
};


module.exports = { protect, adminProtect, dashboardProtect };