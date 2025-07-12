const { body, buildCheckFunction } = require("express-validator");
const checkBodyAndParams = buildCheckFunction(["body", "params"]);

module.exports = {
  profileUpdate: [
    body("first_name")
      .notEmpty().withMessage("First name is required")
      .isLength({ min: 3, max: 100 }).withMessage("First name must be between 3 and 100 characters")
      .customSanitizer(value => (typeof value === 'string' ? value.replace(/\s+/g, " ").trim() : value)),

    body("last_name")
      .notEmpty().withMessage("Last name is required")
      .isLength({ min: 3, max: 100 }).withMessage("Last name must be between 3 and 100 characters")
      .customSanitizer(value => (typeof value === 'string' ? value.replace(/\s+/g, " ").trim() : value)),

    body("bio")
      .notEmpty().withMessage("Bio is required")
      .isLength({ min: 3, max: 100 }).withMessage("Bio must be between 3 and 100 characters")
      .customSanitizer(value => (typeof value === 'string' ? value.replace(/\s+/g, " ").trim() : value)),

    body("email")
      .notEmpty().withMessage("Email is required")
      .isEmail().withMessage("Invalid email format")
      .isLength({ min: 5, max: 255 }).withMessage("Email must be between 5 and 255 characters")
      .normalizeEmail()
      .customSanitizer(value => value.replace(/\s+/g, " ").trim())
      .custom(value => {
        const gmailRegex = /^[a-zA-Z0-9._%+-]+@gmail\.com$/;
        if (!gmailRegex.test(value)) {
          throw new Error("Email must be a valid Gmail address");
        }
        return true;
      }),

    body("role")
      .notEmpty().withMessage("Role is required")
      .isIn(["user", "business"]).withMessage("Role must be either 'user' or 'business'"),

    body("businessDetails")
      .if(body("role").equals("business"))
      .notEmpty().withMessage("businessDetails is required")
      .custom((value) => {
        let parsed;
        try {
          parsed = typeof value === 'string' ? JSON.parse(value) : value;
        } catch (err) {
          throw new Error("businessDetails must be valid JSON");
        }

        if (!parsed.fullName || parsed.fullName.length < 3) {
          throw new Error("businessDetails.fullName is required and must be at least 3 characters");
        }

        if (!parsed.contactDetails || !/^\d{10}$/.test(parsed.contactDetails)) {
          throw new Error("businessDetails.contactDetails must be a valid 10-digit number");
        }

        if (!parsed.businessName || parsed.businessName.length < 3) {
          throw new Error("businessDetails.businessName is required and must be at least 3 characters");
        }

        const otpVerified = String(parsed.idProof.otpVerified).trim().toLowerCase();
        if (otpVerified !== "true") {
          throw new Error("businessDetails.otpVerified must be true");
        }

        return true;
      }),
  ],

  requestOtp: [
    body("phone")
      .notEmpty().withMessage("Phone number is required")
      .isMobilePhone('en-IN').withMessage("Invalid mobile number format")
      .isLength({ min: 10, max: 10 }).withMessage("Mobile number must be exactly 10 digits")
      .customSanitizer(value => value.replace(/\s+/g, "").trim())
      .custom(value => {
        const mobileRegex = /^[7-9][0-9]{9}$/;
        if (!mobileRegex.test(value)) {
          throw new Error("Mobile number must start with 7, 8, or 9 and have exactly 10 digits");
        }
        return true;
      }),
  ],

  aadharverification: [
    body("aadharNumber")
      .notEmpty().withMessage("Aadhar number is required")
      .isLength({ min: 12, max: 12 }).withMessage("Aadhar number must be 12 digits")
      .isNumeric().withMessage("Aadhar number must contain only numbers"),
  ],
  aadharVerify: [
    body("otp")
      .notEmpty().withMessage("OTP is required")
      .isLength({ min: 4, max: 4 }).withMessage("otp number must be 4 digits")
      .isNumeric().withMessage("OTP number must contain only numbers"),
  ],

  adminLogin: [
    body("email")
      .notEmpty().withMessage("Email is required")
      .isEmail().withMessage("Invalid email format")
      .isLength({ min: 5, max: 255 }).withMessage("Email must be between 5 and 255 characters")
      .normalizeEmail()
      .customSanitizer(value => value.replace(/\s+/g, " ").trim())
      .custom(value => {
        const gmailRegex = /^[a-zA-Z0-9._%+-]+@gmail\.com$/;
        if (!gmailRegex.test(value)) {
          throw new Error("Email must be a valid Gmail address");
        }
        return true;
      }),

    body("password")
      .notEmpty().withMessage("Password is required")
      .isLength({ min: 6, max: 20 }).withMessage("Password must be between 8 and 20 characters")
      .customSanitizer(value => value.replace(/\s+/g, " ").trim())
      .custom(value => {
        const alphanumericRegex = /^[a-zA-Z0-9\s]+$/;
        if (!alphanumericRegex.test(value)) {
          throw new Error("Password must contain only letters and numbers");
        }
        return true;
      }),
  ],
};
