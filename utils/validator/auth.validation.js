const { body, buildCheckFunction } = require("express-validator");
const checkBodyAndParams = buildCheckFunction(["body", "params"]);
module.exports = {
    register: [
    body("username")
      .notEmpty()
      .withMessage("Name is required")
      .isLength({ min: 3, max: 100 })
      .withMessage("Name must be a min 3 and max 100 characters long")
      .customSanitizer((value) => {
        return value.replace(/\s+/g, " ").trim();
      })
      .custom((value) => {
        const alphanumericRegex = /^[a-zA-Z0-9\s]+$/;
        if (!alphanumericRegex.test(value)) {
          throw new Error("Name must contain only letters");
        }
        return true;
      })
      .isLength({ min: 3, max: 100 })
      .withMessage("Name must be a min 3 and max 100 characters long"),
    
    body("email")
    .isEmail()
    .withMessage("Invalid email format")
    .normalizeEmail()
    .customSanitizer((value) => {
        return value.replace(/\s+/g, " ").trim();
    })
    .isLength({ min: 5, max: 255 })
    .withMessage("Email must be between 5 and 255 characters")
    .custom((value) => {
        // Checking if the email is from Gmail
        const gmailRegex = /^[a-zA-Z0-9._%+-]+@gmail\.com$/;
        if (!gmailRegex.test(value)) {
            throw new Error("Email must be a valid Gmail address");
        }
        return true;
    }),

    body("mobile")
    .isMobilePhone('en-IN') // Validates an Indian mobile number
    .withMessage("Invalid mobile number format")
    .customSanitizer((value) => {
        return value.replace(/\s+/g, "").trim();
    })
    .isLength({ min: 10, max: 10 })
    .withMessage("Mobile number must be exactly 10 digits long")
    .custom((value) => {
        const mobileRegex = /^[7-9][0-9]{9}$/;
        if (!mobileRegex.test(value)) {
            throw new Error("Mobile number must start with 7, 8, or 9 and have exactly 10 digits");
        }
        return true;
    }),
    body("password")
      .notEmpty()
      .withMessage("Password is required")
      .isLength({ min: 8, max: 20 })
      .withMessage("Password must be a min 3 and max 20 characters long")
      .customSanitizer((value) => {
        return value.replace(/\s+/g, " ").trim();
      })
      .custom((value) => {
        const alphanumericRegex = /^[a-zA-Z0-9\s]+$/;
        if (!alphanumericRegex.test(value)) {
          throw new Error("Password must contain only letters");
        }
        return true;
      })
      .isLength({ min: 3, max: 100 })
      .withMessage("Password must be a min 3 and max 100 characters long"),
  
  ],

  requestOtp: [
    body("phone")
    .isMobilePhone('en-IN') // Validates an Indian mobile number
    .withMessage("Invalid mobile number format")
    .customSanitizer((value) => {
        return value.replace(/\s+/g, "").trim();
    })
    .isLength({ min: 10, max: 10 })
    .withMessage("Mobile number must be exactly 10 digits long")
    .custom((value) => {
        const mobileRegex = /^[7-9][0-9]{9}$/;
        if (!mobileRegex.test(value)) {
            throw new Error("Mobile number must start with 7, 8, or 9 and have exactly 10 digits");
        }
        return true;
    }),
  ],

  login: [
    body("email")
    .notEmpty()
    .withMessage("Email is required")
    .isEmail()
    .withMessage("Invalid email format")
    .normalizeEmail()
    .customSanitizer((value) => {
        return value.replace(/\s+/g, " ").trim();
    })
    .isLength({ min: 5, max: 255 })
    .withMessage("Email must be between 5 and 255 characters")
    .custom((value) => {
        // Checking if the email is from Gmail
        const gmailRegex = /^[a-zA-Z0-9._%+-]+@gmail\.com$/;
        if (!gmailRegex.test(value)) {
            throw new Error("Email must be a valid Gmail address");
        }
        return true;
    }),

    body("password")
      .notEmpty()
      .withMessage("Password is required")
      .isLength({ min: 8, max: 20 })
      .withMessage("Password must be a min 3 and max 20 characters long")
      .customSanitizer((value) => {
        return value.replace(/\s+/g, " ").trim();
      })
      .custom((value) => {
        const alphanumericRegex = /^[a-zA-Z0-9\s]+$/;
        if (!alphanumericRegex.test(value)) {
          throw new Error("Password must contain only letters");
        }
        return true;
      })
      .isLength({ min: 3, max: 100 })
      .withMessage("Password must be a min 3 and max 100 characters long"),
  ],
};
