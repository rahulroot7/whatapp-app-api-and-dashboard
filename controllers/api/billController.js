const Bill = require("../../models/Bill");
const Message = require("../../models/Message");
const Chat = require("../../models/Chat");
const ApiError = require("../../utils/ApiError");
const ApiResponse = require("../../utils/ApiResponse");

const controller = {};

controller.createBillGroup = async (req, res) => {
    try {
        let { chatName, users } = req.body;

        if (!chatName || !users) {
        return res.status(400).json(new ApiError(400, null, "Chat name and users are required"));
        }
        if (typeof users === "string") {
        try {
            users = JSON.parse(users);
        } catch {
            users = [users];
        }
        }
        if (!users.includes(req.rootUserId.toString())) {
        users.push(req.rootUserId);
        }
        const groupChat = await Chat.create({
        chatName,
        users,
        isGroup: true,
        groupAdmin: req.rootUserId,
        billSplit: true,
        });

        const createdChat = await Chat.findById(groupChat._id)
        .populate("users", "-password -contacts -deletedAt")
        .populate("groupAdmin", "-password -contacts -deletedAt");

        return res.status(200).json(new ApiResponse(200, createdChat, "Bill Split created successfully"));
    } catch (error) {
        return res.status(500).json(new ApiError(500, "Internal Server Error", [error.message]));
    }
};

// CREATE BILL
controller.createBill = async (req, res) => {
  try {
    const { chatId, title, label, totalAmount, splitType, tax, tip, discount, participants } = req.body;

    // Parse participants if coming as JSON string
    const parsedParticipants =
      typeof participants === "string" ? JSON.parse(participants) : participants;

    if (!chatId || !title || !parsedParticipants || parsedParticipants.length === 0) {
      return res
        .status(400)
        .json(new ApiError(400, null, "chatId, title, and participants are required"));
    }

    // Attach receipts if uploaded
    let receipts = [];
    if (req.files && req.files.length > 0) {
      receipts = req.files.map((file) => `uploads/receipts/${file.filename}`);
    }

    // Calculate final amount including tax/tip/discount
    const finalAmount =
      (Number(totalAmount) || 0) +
      (Number(tax) || 0) +
      (Number(tip) || 0) -
      (Number(discount) || 0);

    let finalParticipants = [];

    if (splitType === "equal") {
      const perPerson = finalAmount / parsedParticipants.length;
      finalParticipants = parsedParticipants.map((p) => ({
        user: p.user,
        share: perPerson,
        paid: p.paid || 0,
        settled: p.settled || false,
      }));
    } else if (splitType === "custom") {
      // In custom split, frontend must send each participant's share
      const totalShare = parsedParticipants.reduce(
        (sum, p) => sum + Number(p.share || 0),
        0
      );

      if (totalShare !== finalAmount) {
        return res
          .status(400)
          .json(new ApiError(400, null, "Custom shares must equal final amount"));
      }

      finalParticipants = parsedParticipants.map((p) => ({
        user: p.user,
        share: Number(p.share),
        paid: p.paid || 0,
        settled: p.settled || false,
      }));
    } else {
      return res.status(400).json(new ApiError(400, null, "Invalid splitType"));
    }

    // Create bill
    const bill = await Bill.create({
      creator: req.rootUserId,
      chatId,
      title,
      label,
      totalAmount,
      splitType,
      tax,
      tip,
      discount,
      participants: finalParticipants,
      receipts,
    });

    //Send a chat message about the bill
    await Message.create({
      sender: req.rootUserId,
      chatId: bill.chatId,
      billId: bill._id,
    });

    return res
      .status(201)
      .json(new ApiResponse(201, bill, "Bill created successfully"));
  } catch (error) {
    console.error("CreateBill Error:", error);
    return res
      .status(500)
      .json(new ApiError(500, "Failed to create bill", [error.message]));
  }
};


// GET BILL DETAILS
controller.getBill = async (req, res) => {
  try {
    const bill = await Bill.findById(req.params.id).populate("participants.user", "first_name email");
    if (!bill) return res.status(404).json(new ApiError(404, "Bill not found"));
    res.status(200).json(new ApiResponse(200, bill, "Bill fetched"));
  } catch (error) {
    res.status(500).json(new ApiError(500, "Error fetching bill", [error.message]));
  }
};

// SETTLE PAYMENT
controller.settlePayment = async (req, res) => {
  try {
    const { id } = req.params;
    const bill = await Bill.findById(id);
    if (!bill) return res.status(404).json(new ApiError(404, null, "Bill not found"));

    const participant = bill.participants.find((p) => p.user.toString() === req.rootUserId);
    if (!participant) return res.status(400).json(new ApiError(400, null, "You are not part of this bill"));

    participant.settled = true;
    await bill.save();

    res.status(200).json(new ApiResponse(200, null, "Payment settled"));
  } catch (error) {
    res.status(500).json(new ApiError(500, "Failed to settle payment", [error.message]));
  }
};

// GET BILL SUMMARY / RESULTS
controller.getBillSummary = async (req, res) => {
  try {
    const bill = await Bill.findById(req.params.id).populate("participants.user", "first_name email phone");
    if (!bill) return res.status(404).json(new ApiError(404, "Bill not found"));

    const summary = bill.participants.map((p) => ({
      user: p.user,
      share: p.share,
      paid: p.paid,
      balance: p.paid - p.share,
      settled: p.settled,
    }));

    res.status(200).json(new ApiResponse(200, summary, "Bill summary"));
  } catch (error) {
    res.status(500).json(new ApiError(500, "Failed to fetch bill summary", [error.message]));
  }
};

// DELETE BILL
controller.deleteBill = async (req, res) => {
  try {
    const bill = await Bill.findById(req.params.id);
    if (!bill) return res.status(404).json(new ApiError(404, "Bill not found"));

    if (bill.creator.toString() !== req.rootUserId.toString()) {
      return res.status(403).json(new ApiError(403, "You are not authorized to delete this bill"));
    }

    bill.isDeleted = true;
    await bill.save();

    res.status(200).json(new ApiResponse(200, null, "Bill deleted (soft) successfully"));
  } catch (error) {
    res.status(500).json(new ApiError(500, "Failed to delete bill", [error.message]));
  }
};

module.exports = controller;