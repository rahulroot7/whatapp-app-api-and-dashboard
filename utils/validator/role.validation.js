const { body } = require("express-validator");

module.exports = {
  roleCreate: [
    body("name")
      .notEmpty().withMessage("Role name is required")
      .isLength({ min: 3, max: 100 }).withMessage("Role name must be between 3 and 100 characters")
      .customSanitizer(value => (typeof value === 'string' ? value.replace(/\s+/g, " ").trim() : value)),

    // body("permissions")
    //   .isArray({ min: 1 }).withMessage("At least one permission module is required"),

    // body("permissions.*.module")
    //   .notEmpty().withMessage("Each permission must have a module name"),

    // body("permissions.*.submodules")
    //   .isArray({ min: 1 }).withMessage("Each permission must have at least one submodule"),

    // body("permissions.*.submodules.*.name")
    //   .notEmpty().withMessage("Submodule name is required"),

    // body("permissions.*.submodules.*.actions")
    //   .isObject().withMessage("Submodule actions must be an object"),

    // body("routes")
    //   .optional()
    //   .isArray().withMessage("Routes must be an array of strings")
    //   .custom((routes) => {
    //     if (!Array.isArray(routes)) return false;
    //     for (let r of routes) {
    //       if (typeof r !== "string") return false;
    //     }
    //     return true;
    //   }).withMessage("Each route must be a string")
  ]
};
