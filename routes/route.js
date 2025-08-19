const express = require("express");
const multer = require("multer");
const fs = require("fs");
const { protect } = require("../middleware/authMiddleware");
const UserController = require("../controllers/api/userController");
const ChatController = require("../controllers/api/chatController");
const MessageController = require("../controllers/api/messageController");
const StatusController = require("../controllers/api/statusController");
const PollController = require('../controllers/api/pollController');
const EventController = require('../controllers/api/eventController');
const { profileUpdate, aadharverification, aadharVerify } = require('../utils/validator/auth.validation');

const router = express.Router();

// Multer storage setup (for single and multiple uploads)
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    let folder = "uploads/";

    // Decide folder based on field name
    if (file.fieldname === "profilePic" || file.fieldname === "selfie") {
      folder += "profiles";
    } else if (file.fieldname === "media") {
      folder += "messages";
    }else if (file.fieldname === "statusMedia") {
      folder += "status";
    }else if (file.fieldname === "mediaFiles") {
      folder += "poolEvent";
    }

    // Ensure the folder exists
    fs.mkdirSync(folder, { recursive: true });

    cb(null, folder);
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});

const uploadSingle = multer({ storage });
const uploadMulti = multer({ storage }).fields([
  { name: 'profilePic', maxCount: 1 },
  { name: 'selfie', maxCount: 1 }
]);

router.post("/aadhar-verification", protect, aadharverification, UserController.aadharVerification);
router.post("/aadhar-verify", protect, aadharVerify, UserController.aadharVerify);
router.get("/profile", protect, UserController.userDashboard);
router.post("/profile-update", protect, uploadMulti, profileUpdate, UserController.profileUpdate);
router.get("/user", protect, UserController.searchUsers);
// Chat Route
router.post('/chat', protect, ChatController.accessChats);
router.get('/chat/access', protect, ChatController.fetchAllChats);
router.post('/group', protect, ChatController.createGroup);
router.patch('/group/rename', protect, ChatController.renameGroup);
router.patch('/groupAdd', protect, ChatController.addToGroup);
router.patch('/groupRemove', protect, ChatController.removeFromGroup);
router.delete('/removeuser', protect);
// Message Route
router.post("/message", protect, uploadSingle.single('media'), MessageController.sendMessage);
router.get("/message/:chatId", protect, MessageController.getMessages);
router.delete("/message/:messageId", protect, MessageController.deleteMessage);
// Status Route
router.post('/status', protect, uploadSingle.single('statusMedia'), StatusController.createStatus);
router.get('/status/me', protect, StatusController.getOwnStatuses );
router.post('/status/view/:statusId', protect, StatusController.viewStatus);
router.delete('/status/:statusId', protect, StatusController.deleteStatus);
// Poll Controller
router.post('/poll', protect, uploadSingle.array('mediaFiles'), PollController.createPoll);
router.get('/poll/:id', protect, PollController.getPoll);
router.post('/poll/:id/response', protect, PollController.submitResponse);
router.get('/poll/:id/results', protect, PollController.getResults);
router.delete('/poll/:id', protect, PollController.deletePoll);
// Event Routes
router.post("/event", protect, EventController.createEvent);
router.get("/event/:id", protect, EventController.getEvent);
router.get("/events/chat/:chatId", protect, EventController.getChatEvents);
router.post("/event/:id/rsvp", protect, EventController.submitRSVP);
router.patch("/event/:id", protect, EventController.updateEvent);
router.delete("/event/:id", protect, EventController.deleteEvent);

module.exports = router;
