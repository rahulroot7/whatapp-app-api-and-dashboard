const { body, buildCheckFunction } = require("express-validator");
const checkBodyAndParams = buildCheckFunction(["body", "params"]);

module.exports = {
    examStoreValidation: [
    body("title")
      .notEmpty().withMessage("Title is required")
      .isLength({ min: 3, max: 255 }).withMessage("Title must be between 3 and 255 characters"),

    body("categoryId")
      .notEmpty().withMessage("Category ID is required")
      .isInt({ min: 1 }).withMessage("Category ID must be a positive integer"),

    body("exam_date")
      .notEmpty().withMessage("Exam date is required")
      .isISO8601().withMessage("Exam date must be a valid date (YYYY-MM-DD)")
      .custom((value) => {
        const examDate = new Date(value);
        const currentDate = new Date();
        // Set the current date time to midnight to only compare the date
        currentDate.setHours(0, 0, 0, 0);
        if (examDate <= currentDate) {
          throw new Error("Exam date must be in the future and not today");
        }
        return true;
      }),

    body("exam_duration")
      .notEmpty().withMessage("Exam duration is required")
      .isInt({ min: 1 }).withMessage("Exam duration must be at least 1 minute"),

    // body("status")
    //   .isIn(["0", "1"]).withMessage("Status must be either '0' (inactive) or '1' (active)"),
  ],

  examUpdateValidation: [
    body("title")
      .notEmpty().withMessage("Title is required")
      .isLength({ min: 3, max: 255 }).withMessage("Title must be between 3 and 255 characters"),

    body("categoryId")
      .notEmpty().withMessage("Category ID is required")
      .isInt({ min: 1 }).withMessage("Category ID must be a positive integer"),

    body("exam_date")
      .notEmpty().withMessage("Exam date is required")
      .isISO8601().withMessage("Exam date must be a valid date (YYYY-MM-DD)")
      .custom((value) => {
        const examDate = new Date(value);
        const currentDate = new Date();
        // Set the current date time to midnight to only compare the date
        currentDate.setHours(0, 0, 0, 0);
        if (examDate <= currentDate) {
          throw new Error("Exam date must be in the future and not today");
        }
        return true;
      }),

    body("exam_duration")
      .notEmpty().withMessage("Exam duration is required")
      .isInt({ min: 1 }).withMessage("Exam duration must be at least 1 minute"),

    // body("status")
    //   .isIn(["0", "1"]).withMessage("Status must be either '0' (inactive) or '1' (active)"),
  ]
};
