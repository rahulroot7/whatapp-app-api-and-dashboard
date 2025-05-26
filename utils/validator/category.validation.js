const { body, buildCheckFunction } = require("express-validator");
const checkBodyAndParams = buildCheckFunction(["body", "params"]);
module.exports = {
  createCategory: [
    body("name_en")
      .isString()
      .withMessage("Name must be a string")
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
          throw new Error("Name must contain only letters and number");
        }
        return true;
      })
      .isLength({ min: 3, max: 100 })
      .withMessage("Name must be a min 3 and max 100 characters long"),
  ],

  statusWithId: [
    body("status")
      .exists()
      .isLength({ min: 1 })
      .withMessage("Status must be a 1 length")
      .isInt()
      .withMessage("Status must be an integer")
      .isIn([0, 1])
      .withMessage("Status value must be in [0,1]"),
    body("_id")
      .isLength(24)
      .withMessage("Id must be 24 characters")
      .isString()
      .withMessage("Id must be a string"),
  ],

  updateCategory: [
    checkBodyAndParams("id")
        .isNumeric()
        .withMessage("Id must be a numeric")
        .isLength({ min: 1, max: 1000000 })
        .withMessage("Id  must be a min 1 and max 1000000 digit long"),

    body("name_en")
      .isString()
      .withMessage("Name must be a string")
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
          throw new Error("Name must contain only letters and number");
        }
        return true;
      })
      .isLength({ min: 3, max: 100 })
      .withMessage("Name must be a min 3 and max 100 characters long"),
  ],
};
