const Boom = require("boom");
const backlogService = require("../services/backlogService");

const parsePayload = (req) =>
  typeof req?.payload === "string" ? JSON.parse(req.payload) : req.payload;

const backlogHandler = {
  get: (req) =>
    backlogService.getBacklog(req, req.params.boardId, req.triggered_by.id),
  reorder: (req) => {
    const { orderedIds } = parsePayload(req);
    if (!Array.isArray(orderedIds)) {
      return Boom.badRequest("orderedIds must be an array");
    }
    return backlogService.reorderBacklog(
      req,
      req.params.boardId,
      orderedIds,
      req.triggered_by.id
    );
  },
};

module.exports = { backlogHandler };
