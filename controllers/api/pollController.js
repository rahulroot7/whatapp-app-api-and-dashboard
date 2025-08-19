const Poll = require("../../models/Poll");
const Message = require("../../models/Message");
const ApiError = require("../../utils/ApiError");
const ApiResponse = require("../../utils/ApiResponse");

const controller = {};

controller.createPoll = async (req, res) => {
  try {
    const { chatId, type, title, isAnonymous, allowsMultipleVotes, expiresAt } = req.body;
    const questions = JSON.parse(req.body.questions);

    if (req.files && req.files.length) {
    let fileIndex = 0;
    for (let q of questions) {
        if (q.questionType === 'mcq' && Array.isArray(q.options)) {
        for (let opt of q.options) {
            if (req.files[fileIndex]) {
            opt.media = `uploads/poolEvent/${req.files[fileIndex].filename}`;
            fileIndex++;
            }
        }
        }
    }
    }
    const poll = await Poll.create({
      creator: req.rootUserId,
      chatId,
      type,
      title,
      isAnonymous,
      allowsMultipleVotes,
      expiresAt,
      questions
    });
    const message = await Message.create({
        sender: req.rootUserId,
        chatId: poll.chatId,
        pollId: poll._id,
    });

    res.status(201).json(new ApiResponse(201, poll, 'Poll created successfully'));
  } catch (error) {
    console.error(error);
    res.status(500).json(new ApiError(500, 'Failed to create poll', [error.message]));
  }
};

controller.getPoll = async (req, res) => {
  try {
    const poll = await Poll.findById(req.params.id);
    if (!poll) return res.status(404).json(new ApiError(404, 'Poll not found'));
    res.status(200).json(new ApiResponse(200, poll, 'Poll fetched'));
  } catch (error) {
    res.status(500).json(new ApiError(500, 'Error fetching poll', [error.message]));
  }
};

controller.submitResponse = async (req, res) => {
  try {
    const { id } = req.params;
    const { answers } = req.body;

    const poll = await Poll.findById(id);
    if (!poll) return res.status(404).json(new ApiError(404, null, 'Poll not found'));

    if (poll.expiresAt && new Date() > new Date(poll.expiresAt)) {
      return res.status(400).json(new ApiError(400, null, 'Poll has expired'));
    }

    // Check if user already responded
    const alreadyVoted = poll.responses.some(r => r.user.toString() === req.rootUserId);
    if (alreadyVoted && !poll.allowsMultipleVotes) {
      return res.status(403).json(new ApiError(403, null, 'You have already voted'));
    }

    poll.responses.push({ user: req.rootUserId, answers });
    await poll.save();

    res.status(200).json(new ApiResponse(200, null, 'Response submitted'));
  } catch (error) {
    res.status(500).json(new ApiError(500, 'Failed to submit response', [error.message]));
  }
};

controller.getResults = async (req, res) => {
  try {
    const poll = await Poll.findById(req.params.id);
    if (!poll) return res.status(404).json(new ApiError(404, 'Poll not found'));

    const results = poll.questions.map((q, qi) => {
      const questionResult = { 
        question: q.questionText, 
        type: q.questionType, 
        options: [], 
        responses: [] 
      };

      if (q.questionType === 'mcq') {
        // Count votes per option
        questionResult.options = q.options.map((opt, oi) => ({
          text: opt.text,
          media: opt.media,
          votes: poll.responses.reduce((acc, r) => {
            const answer = r.answers.find(a => a.questionIndex === qi);
            if (answer?.selectedOptions?.includes(oi)) acc++;
            return acc;
          }, 0),
        }));
      } 
      else if (q.questionType === 'rating') {
        // Collect ratings & average
        const ratings = poll.responses
          .map(r => r.answers.find(a => a.questionIndex === qi)?.rating)
          .filter(r => r !== undefined);

        questionResult.responses = ratings;
        questionResult.average =
          ratings.length > 0
            ? (ratings.reduce((a, b) => a + b, 0) / ratings.length).toFixed(2)
            : null;
      } 
      else if (q.questionType === 'yesno') {
        // Count yes / no
        let yes = 0, no = 0;
        poll.responses.forEach(r => {
          const answer = r.answers.find(a => a.questionIndex === qi);
          if (answer?.yesNo === true) yes++;
          if (answer?.yesNo === false) no++;
        });
        questionResult.options = [
          { text: 'Yes', votes: yes },
          { text: 'No', votes: no },
        ];
      } 
      else if (q.questionType === 'text') {
        // Collect all text answers
        questionResult.responses = poll.responses
          .map(r => r.answers.find(a => a.questionIndex === qi)?.text)
          .filter(t => t !== undefined);
      }

      return questionResult;
    });

    res.status(200).json(new ApiResponse(200, results, 'Poll results'));
  } catch (error) {
    res.status(500).json(new ApiError(500, 'Failed to fetch results', [error.message]));
  }
};


controller.deletePoll = async (req, res) => {
  try {
    const pollId = req.params.id;
    const userId = req.rootUserId;
    const poll = await Poll.findById(pollId);
    if (!poll) {
      return res.status(404).json(new ApiError(404, 'Poll not found'));
    }
    if (poll.creator.toString() !== userId.toString()) {
      return res.status(403).json(new ApiError(403, 'You are not authorized to delete this poll'));
    }
    poll.isDeleted = true;
    await poll.save();
    res.status(200).json(new ApiResponse(200, null, 'Poll deleted (soft) successfully'));
  } catch (error) {
    console.error(error);
    res.status(500).json(new ApiError(500, 'Failed to delete poll', [error.message]));
  }
};

module.exports = controller;
