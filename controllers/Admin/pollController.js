const controller = {};
const Poll = require("../../models/Poll");
const User = require("../../models/User");
const ApiError = require("../../utils/ApiError");
const ApiResponse = require("../../utils/ApiResponse");
const { validationResult } = require("express-validator");

controller.pollSurvaytList = async (req, res) => {
  try {
    const polls = await Poll.find()
      .populate({
        path: "creator",
        select: "first_name last_name profilePic"
      })
      .populate({
        path: "chatId",
        select: "chatName"
      })
      .populate({
        path: "responses.user",
        select: "first_name last_name profilePic"
      });

    const data = polls.map((poll) => {
      const now = new Date();
      const expired = poll.expiresAt && now > poll.expiresAt;

      const questionsSummary = poll.questions.map((q, qi) => {
        let summary = {
          question: q.questionText,
          type: q.questionType,
          responses: []
        };

        if (q.questionType === "mcq") {
          summary.options = q.options.map((opt, oi) => ({
            text: opt.text,
            media: opt.media,
            votes: poll.responses.reduce((acc, r) => {
              const answer = r.answers.find((a) => a.questionIndex === qi);
              if (answer?.selectedOptions?.includes(oi)) acc++;
              return acc;
            }, 0),
          }));

          summary.responses = poll.responses.map((r) => {
            const answer = r.answers.find((a) => a.questionIndex === qi);
            return {
              user: {
                name: `${r.user?.first_name || ""} ${r.user?.last_name || ""}`.trim(),
                photo: r.user?.profilePic || null,
              },
              selectedOptions:
                answer?.selectedOptions?.map((idx) => q.options[idx]?.text) || [],
            };
          }).filter(r => r.selectedOptions.length > 0);

        } else if (q.questionType === "yesno") {
          let yes = 0, no = 0;
          poll.responses.forEach((r) => {
            const answer = r.answers.find((a) => a.questionIndex === qi);
            if (answer?.yesNo === true) yes++;
            if (answer?.yesNo === false) no++;
          });
          summary.options = [
            { text: "Yes", votes: yes },
            { text: "No", votes: no },
          ];

          summary.responses = poll.responses.map((r) => {
            const answer = r.answers.find((a) => a.questionIndex === qi);
            return {
              user: {
                name: `${r.user?.first_name || ""} ${r.user?.last_name || ""}`.trim(),
                photo: r.user?.profilePic || null,
              },
              choice:
                answer?.yesNo === true
                  ? "Yes"
                  : answer?.yesNo === false
                  ? "No"
                  : null,
            };
          }).filter(r => r.choice);

        } else if (q.questionType === "rating") {
          const ratings = poll.responses
            .map((r) => r.answers.find((a) => a.questionIndex === qi)?.rating)
            .filter((r) => r !== undefined);

          summary.average =
            ratings.length > 0
              ? (ratings.reduce((a, b) => a + b, 0) / ratings.length).toFixed(2)
              : null;

          summary.responses = poll.responses.map((r) => {
            const answer = r.answers.find((a) => a.questionIndex === qi);
            return {
              user: {
                name: `${r.user?.first_name || ""} ${r.user?.last_name || ""}`.trim(),
                photo: r.user?.profilePic || null,
              },
              rating: answer?.rating || null,
            };
          }).filter(r => r.rating !== null);

        } else if (q.questionType === "text") {
          summary.responses = poll.responses.map((r) => {
            const answer = r.answers.find((a) => a.questionIndex === qi);
            return {
              user: {
                name: `${r.user?.first_name || ""} ${r.user?.last_name || ""}`.trim(),
                photo: r.user?.profilePic || null,
              },
              text: answer?.text || null,
            };
          }).filter(r => r.text);
        }

        return summary;
      });

      return {
        _id: poll._id,
        type: poll.type,
        title: poll.title,
        creator: {
          name: `${poll.creator?.first_name || ""} ${poll.creator?.last_name || ""}`.trim(),
          photo: poll.creator?.profilePic || null,
        },
        chatName: poll.chatId?.chatName || "",
        isAnonymous: poll.isAnonymous,
        allowsMultipleVotes: poll.allowsMultipleVotes,
        expiresAt: poll.expiresAt,
        expired,
        totalResponses: poll.responses.length,
        questions: questionsSummary,
        createdAt: poll.createdAt,
      };
    });

    return res.status(200).json(
      new ApiResponse(200, data, "Poll & Survey list fetched successfully")
    );
  } catch (error) {
    return res.status(500).json(
      new ApiError(500, "Internal Server Error", [error.message])
    );
  }
};

module.exports = controller;
