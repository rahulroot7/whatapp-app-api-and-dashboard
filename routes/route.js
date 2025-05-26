const express = require("express");
const multer = require("multer");
const { protect, adminAuth } = require('../middleware/authMiddleware');
const { Op } = require('sequelize');
const UserController = require('../controllers/api/userController')

const router = express.Router();

// Multer setup for image uploads and form-data parsing
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/"); // Directory to store uploaded files
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname); // Unique filename
  },
});
const upload = multer({ storage });
const uploadMulti = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, "uploads/"); // Directory to store files
    },
    filename: (req, file, cb) => {
      cb(null, `${Date.now()}-${file.originalname}`);
    },
  }),
});
const uploadNone = upload.none();
// Dashboard Route
router.get("/profile", protect, UserController.userDashboard);

module.exports = router;