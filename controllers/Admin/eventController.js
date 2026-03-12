const controller = {};
const Event = require("../../models/Event");
const User = require("../../models/User");
const ApiError = require("../../utils/ApiError");
const ApiResponse = require("../../utils/ApiResponse");
const { validationResult } = require("express-validator");

controller.eventList = async (req, res) => {
  try {
    const events = await Event.find({ isDeleted: false })
      .populate({
        path: "creator",
        select: "first_name last_name photo" // <-- added photo
      })
      .populate({
        path: "chatId",
        select: "chatName"
      })
      .populate({
        path: "itinerary.addedBy",
        select: "first_name last_name photo" // <-- added photo
      })
      .populate({
        path: "rsvps.user",
        select: "first_name last_name photo" // <-- added photo
      });

    return res.status(200).json(
      new ApiResponse(200, { events }, "Events list fetched successfully")
    );
  } catch (error) {
    return res.status(500).json(
      new ApiError(500, "Internal Server Error", [error.message])
    );
  }
};

module.exports = controller;
