const { body, buildCheckFunction } = require("express-validator");
const checkBodyAndParams = buildCheckFunction(["body", "params"]);

module.exports = {
  questionStoreValidation: [
    body("question")
      .notEmpty().withMessage("Question is required")
      .isLength({ min: 3, max: 255 }).withMessage("Question must be between 3 and 255 characters"),

    body("examId")
      .notEmpty().withMessage("Exam ID is required")
      .isInt({ min: 1 }).withMessage("Exam ID must be a positive integer"),

    body("answer")
      .notEmpty().withMessage("Answer is required")
      .isString().withMessage("Answer must be a valid string"),

    body("option_1")
      .notEmpty().withMessage("Option is required")
      .isLength({ min: 1, max: 100 })
      .withMessage("Name must be a min 3 and max 100 characters long"),
    
    body("option_2")
        .notEmpty().withMessage("Option is required")
        .isLength({ min: 1, max: 100 })
        .withMessage("Name must be a min 3 and max 100 characters long"),

    body("option_3")
        .notEmpty().withMessage("Option is required")
        .isLength({ min: 1, max: 100 })
        .withMessage("Name must be a min 3 and max 100 characters long"),

    body("option_4")
        .notEmpty().withMessage("Option is required")
        .isLength({ min: 1, max: 100 })
        .withMessage("Name must be a min 3 and max 100 characters long"),
  ],
};
