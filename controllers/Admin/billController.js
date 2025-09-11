const Bill = require("../../models/Bill");
const ApiError = require("../../utils/ApiError");
const ApiResponse = require("../../utils/ApiResponse");

const controller = {};

// Get All Bills (with filters, pagination)
controller.getAllBills = async (req, res) => {
  try {
    let { page = 1, limit = 10, search = "" } = req.query;
    page = parseInt(page);
    limit = parseInt(limit);

    const query = {
      isDeleted: false,
      ...(search && { title: { $regex: search, $options: "i" } }),
    };

    const bills = await Bill.find(query)
      .populate("chatId", "chatName")
      .populate("creator", "first_name last_name email phone profilePic")
      .populate("participants.user", "first_name last_name email phone profilePic")
      .skip((page - 1) * limit)
      .limit(limit)
      .sort({ createdAt: -1 });

    const total = await Bill.countDocuments(query);

    res.status(200).json(
      new ApiResponse(200, {
        bills,
        pagination: {
          total,
          page,
          pages: Math.ceil(total / limit),
        },
      }, "Bills fetched successfully")
    );
  } catch (error) {
    res.status(500).json(new ApiError(500, "Failed to fetch bills", [error.message]));
  }
};

// Get Bill Details
controller.getBillDetails = async (req, res) => {
  try {
    const bill = await Bill.findById(req.params.id)
      .populate("creator", "first_name email phone")
      .populate("participants.user", "first_name email phone");
    if (!bill) return res.status(404).json(new ApiError(404, "Bill not found"));

    res.status(200).json(new ApiResponse(200, bill, "Bill details fetched successfully"));
  } catch (error) {
    res.status(500).json(new ApiError(500, "Failed to fetch bill details", [error.message]));
  }
};

// Update Bill (Admin can modify title, label, status, etc.)
controller.updateBill = async (req, res) => {
  try {
    const { title, label, isDeleted } = req.body;

    const bill = await Bill.findById(req.params.id);
    if (!bill) return res.status(404).json(new ApiError(404, "Bill not found"));

    if (title) bill.title = title;
    if (label) bill.label = label;
    if (typeof isDeleted === "boolean") bill.isDeleted = isDeleted;

    await bill.save();

    res.status(200).json(new ApiResponse(200, bill, "Bill updated successfully"));
  } catch (error) {
    res.status(500).json(new ApiError(500, "Failed to update bill", [error.message]));
  }
};

// Delete Bill (Hard delete by admin)
controller.deleteBill = async (req, res) => {
  try {
    const bill = await Bill.findById(req.params.id);
    if (!bill) {
      return res.status(404).json(new ApiError(404, "Bill not found"));
    }
    if (bill.isDeleted) {
      return res.status(400).json(new ApiError(400, "Bill already deleted"));
    }
    bill.isDeleted = true;
    await bill.save();
    res.status(200).json(new ApiResponse(200, bill, "Bill soft deleted successfully"));
  } catch (error) {
    res
      .status(500)
      .json(new ApiError(500, "Failed to soft delete bill", [error.message]));
    }
};

module.exports = controller;
