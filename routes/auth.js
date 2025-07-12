const express = require("express");
const multer = require("multer");
const bodyParser = require("body-parser");
const controller = require("../controllers/auth/auth");
const { requestOtp: validateRequestOtp, adminLogin } = require("../utils/validator/auth.validation");
const app = express();
const router = express.Router();
const storage = multer.memoryStorage();
const upload = multer({ storage });
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Routes App Login
router.post("/request-otp", upload.none(), validateRequestOtp, controller.requestOtp);
router.post("/otp-verify", upload.none(), validateRequestOtp, controller.otpVerify);
router.get("/get-otp", controller.getOtp);

// Admin Auth Route
router.post("/admin-login", upload.none(), adminLogin, controller.adminLogin);
router.post("/admin-forgot-password", upload.none(), controller.adminForgotPassword);
router.post("/admin-reset-password", upload.none(), controller.adminResetPassword);

module.exports = router;
