// controllers/shoppingCategoryController.js
const controller = {};
const ShoppingCategory = require("../../models/Category");
const ApiError = require("../../utils/ApiError");
const ApiResponse = require("../../utils/ApiResponse");
const { validationResult } = require("express-validator");

controller.createCategory = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json(new ApiError(400, "Validation failed", errors.array()));
    }

    const { name, description } = req.body;
    const category = await ShoppingCategory.create({
      name,
      description
    });

    return res
      .status(201)
      .json(new ApiResponse(201, category, "Category created successfully"));
  } catch (error) {
    return res
      .status(500)
      .json(new ApiError(500, "Failed to create category", [error.message]));
  }
};

controller.listCategories = async (req, res) => {
  try {
    const categories = await ShoppingCategory.find()
      .sort({ createdAt: -1 });

    const data = categories.map((cat) => ({
      _id: cat._id,
      name: cat.name,
      description: cat.description,
      status: cat.status,
      createdAt: cat.createdAt,
    }));

    return res
      .status(200)
      .json(new ApiResponse(200, data, "Categories fetched successfully"));
  } catch (error) {
    return res
      .status(500)
      .json(new ApiError(500, "Failed to fetch categories", [error.message]));
  }
};

controller.updateCategory = async (req, res) => {
  try {
    const { categoryId } = req.params;

    const category = await ShoppingCategory.findByIdAndUpdate(
      categoryId,
      req.body,
      { new: true }
    );

    if (!category) {
      return res
        .status(404)
        .json(new ApiError(404, null, "Category not found"));
    }
    return res.status(200).json(new ApiResponse(200, category, "Category updated successfully"));
  } catch (error) {
    return res.status(500).json(new ApiError(500, "Failed to update category", [error.message]));
  }
};

controller.deleteCategory = async (req, res) => {
  try {
    const { categoryId } = req.params;
    const deleted = await ShoppingCategory.findByIdAndDelete(categoryId);
    if (!deleted) {
      return res
        .status(404)
        .json(new ApiError(404, null, "Category not found"));
    }
    return res.status(200).json(new ApiResponse(200, null, "Category deleted successfully"));
  } catch (error) {
    return res.status(500).json(new ApiError(500, "Failed to delete category", [error.message]));
  }
};

module.exports = controller;
