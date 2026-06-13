const Boom = require("boom");
const commentService = require("../services/commentService");

const parsePayload = (req) =>
  typeof req?.payload === "string" ? JSON.parse(req.payload) : req.payload;

const commentHandler = {
  get: (req) =>
    commentService.getComments(
      req,
      req.params.boardId,
      req.params.listId,
      req.params.cardId,
      req.triggered_by.id
    ),
  post: (req) => {
    const { text } = parsePayload(req);
    if (!text?.trim()) {
      return Boom.badRequest("Comment text is required");
    }
    return commentService.addComment(
      req,
      req.params.boardId,
      req.params.listId,
      req.params.cardId,
      text.trim(),
      req.triggered_by.id,
      req.triggered_by.username
    );
  },
};

module.exports = { commentHandler };
