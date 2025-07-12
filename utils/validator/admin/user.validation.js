const { body, buildCheckFunction } = require("express-validator");
const checkBodyAndParams = buildCheckFunction(["body", "params"]);

module.exports = {
  userCreate: [
    body("first_name")
      .notEmpty().withMessage("First name is required")
      .isLength({ min: 3, max: 100 }).withMessage("First name must be between 3 and 100 characters")
      .customSanitizer(value => (typeof value === "string" ? value.replace(/\s+/g, " ").trim() : value)),

    body("email")
      .notEmpty().withMessage("Email is required")
      .isEmail().withMessage("Invalid email format")
      .isLength({ min: 5, max: 255 }).withMessage("Email must be between 5 and 255 characters")
      .normalizeEmail()
      .customSanitizer(value => (typeof value === "string" ? value.replace(/\s+/g, " ").trim() : value))
      .custom(value => {
        const gmailRegex = /^[a-zA-Z0-9._%+-]+@gmail\.com$/i;
        if (!gmailRegex.test(value)) {
          throw new Error("Email must be a valid Gmail address");
        }
        return true;
      }),

    body("phone")
      .notEmpty().withMessage("Phone number is required")
      .isLength({ min: 10, max: 10 }).withMessage("Phone number must be exactly 10 digits")
      .customSanitizer(value => (typeof value === "string" ? value.replace(/\s+/g, "").trim() : value))
  ],
};
