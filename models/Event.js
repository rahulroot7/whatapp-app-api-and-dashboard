const mongoose = require("mongoose");

const eventSchema = new mongoose.Schema({
    creator: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    chatId: { type: mongoose.Schema.Types.ObjectId, ref: "Chat", required: true },
    title: { type: String, required: true },
    description: { type: String },
    location: { type: String },
    startTime: { type: Date, required: true },
    endTime: { type: Date },
    rsvpDeadline: { type: Date },
    reminders: [{ type: String }], // e.g., ["24h", "1h"]
    recurrence: { 
        type: String, 
        enum: ["none", "daily", "weekly", "monthly"], 
        default: "none" 
    },
    invitedChats: [{ type: mongoose.Schema.Types.ObjectId, ref: "Chat" }], // Share in multiple groups

    itinerary: [
        {
        item: String,
        addedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        completed: { type: Boolean, default: false },
        }
    ],

    rsvps: [
        {
        user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        status: { type: String, enum: ["yes", "no", "maybe"], default: "maybe" },
        respondedAt: { type: Date, default: Date.now }
        }
    ],

    isDeleted: { type: Boolean, default: false }
}, { timestamps: true });

module.exports = mongoose.model("Event", eventSchema);