const express = require("express");
const multer = require("multer");
const bodyParser = require("body-parser");
const controller = require("../controllers/auth/auth");
const { requestOtp: validateRequestOtp } = require("../utils/validator/auth.validation");
const app = express();
const router = express.Router();
const storage = multer.memoryStorage();
const upload = multer({ storage });
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Routes
router.post("/request-otp", upload.none(), validateRequestOtp, controller.requestOtp);
router.post("/otp-verify", upload.none(), validateRequestOtp, controller.otpVerify);

module.exports = router;
