const Event = require("../../models/Event");
const Message = require("../../models/Message");
const ApiError = require("../../utils/ApiError");
const ApiResponse = require("../../utils/ApiResponse");

const controller = {};

// Create Event
controller.createEvent = async (req, res) => {
  try {
    const { chatId, title, description, location, startTime, endTime, rsvpDeadline, reminders, recurrence, invitedChats, itinerary } = req.body;

    const event = await Event.create({
      creator: req.rootUserId,
      chatId,
      title,
      description,
      location,
      startTime,
      endTime,
      rsvpDeadline,
      reminders,
      recurrence,
      invitedChats,
      itinerary
    });

    // Also save in chat messages
    await Message.create({
      sender: req.rootUserId,
      chatId: chatId,
      eventId: event._id,
    });

    res.status(200).json(new ApiResponse(201, event, "Event created successfully"));
  } catch (error) {
    console.error(error);
    res.status(500).json(new ApiError(500, "Failed to create event", [error.message]));
  }
};

// Get single event
controller.getEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id)
      .populate("creator", "name")
      .populate("rsvps.user", "name");

    if (!event) return res.status(404).json(new ApiError(404, "Event not found"));
    res.status(200).json(new ApiResponse(200, event, "Event fetched"));
  } catch (error) {
    res.status(500).json(new ApiError(500, "Error fetching event", [error.message]));
  }
};

// Get all events in a chat
controller.getChatEvents = async (req, res) => {
  try {
    const events = await Event.find({ chatId: req.params.chatId, isDeleted: false })
      .sort({ startTime: 1 });
    res.status(200).json(new ApiResponse(200, events, "Events fetched"));
  } catch (error) {
    res.status(500).json(new ApiError(500, "Error fetching chat events", [error.message]));
  }
};

// RSVP to event
controller.submitRSVP = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body; // yes / no / maybe

    const event = await Event.findById(id);
    if (!event) return res.status(404).json(new ApiError(404, "Event not found"));

    if (event.rsvpDeadline && new Date() > new Date(event.rsvpDeadline)) {
      return res.status(400).json(new ApiError(400, null, "RSVP deadline has passed"));
    }

    const existing = event.rsvps.find(r => r.user.toString() === req.rootUserId);
    if (existing) {
      existing.status = status;
      existing.respondedAt = new Date();
    } else {
      event.rsvps.push({ user: req.rootUserId, status });
    }

    await event.save();
    res.status(200).json(new ApiResponse(200, null, "RSVP submitted"));
  } catch (error) {
    res.status(500).json(new ApiError(500, "Failed to submit RSVP", [error.message]));
  }
};

// Update Event (only creator)
controller.updateEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json(new ApiError(404, null, "Event not found"));
    if (event.creator.toString() !== req.rootUserId.toString()) {
      return res.status(403).json(new ApiError(403, null,  "Not authorized"));
    }

    Object.assign(event, req.body);
    await event.save();

    res.status(200).json(new ApiResponse(200, event, "Event updated successfully"));
  } catch (error) {
    res.status(500).json(new ApiError(500, "Failed to update event", [error.message]));
  }
};

// Delete Event (soft delete)
controller.deleteEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json(new ApiError(404, "Event not found"));
    if (event.creator.toString() !== req.rootUserId.toString()) {
      return res.status(403).json(new ApiError(403, "Not authorized"));
    }

    event.isDeleted = true;
    await event.save();

    res.status(200).json(new ApiResponse(200, null, "Event deleted (soft) successfully"));
  } catch (error) {
    res.status(500).json(new ApiError(500, "Failed to delete event", [error.message]));
  }
};

module.exports = controller;