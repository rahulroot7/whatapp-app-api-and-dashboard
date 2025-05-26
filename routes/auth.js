const express = require("express");
const multer = require("multer");
const bodyParser = require("body-parser");
const app = express();
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });
const controller = require('../controllers/auth/auth')
const {register, requestOtp ,login} = require('../utils/validator/auth.validation')
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
const router = express.Router();

// Register a new user
router.post("/request-otp", upload.none(), requestOtp, controller.requestOtp);
router.post("/otp-verify", upload.none(), requestOtp, controller.otpVerify);

module.exports = router;

