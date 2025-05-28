const express = require("express");
const multer = require("multer");
const { protect, adminAuth } = require("../middleware/authMiddleware");
const UserController = require("../controllers/api/userController");
const { profileUpdate } = require('../utils/validator/auth.validation');

const router = express.Router();

// Multer storage setup (for single and multiple uploads)
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/"); 
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`); // Unique filename
  },
});

const uploadSingle = multer({ storage });
const uploadMulti = multer({ storage }).array("files", 10); 

router.get("/profile", protect, UserController.userDashboard);
router.post("/profile-update", protect, uploadSingle.single('profilePic'), profileUpdate, UserController.profileUpdate);
router.get("/user", protect, UserController.searchUsers);

module.exports = router;
