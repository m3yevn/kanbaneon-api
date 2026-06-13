const Boom = require("boom");
const sprintService = require("../services/sprintService");

const parsePayload = (req) =>
  typeof req?.payload === "string" ? JSON.parse(req.payload) : req.payload;

const sprintHandler = {
  get: (req) =>
    sprintService.getSprints(req, req.params.boardId, req.triggered_by.id),
  post: (req) => {
    const sprint = parsePayload(req);
    if (!sprint?.name) {
      return Boom.badRequest("Sprint name is required");
    }
    return sprintService.addSprint(
      req,
      req.params.boardId,
      sprint,
      req.triggered_by.id
    );
  },
  assign: (req) => {
    const { issues } = parsePayload(req);
    if (!Array.isArray(issues)) {
      return Boom.badRequest("issues must be an array");
    }
    return sprintService.assignIssuesToSprint(
      req,
      req.params.boardId,
      req.params.sprintId,
      issues,
      req.triggered_by.id
    );
  },
  start: (req) =>
    sprintService.startSprint(
      req,
      req.params.boardId,
      req.params.sprintId,
      req.triggered_by.id
    ),
  getIssues: (req) =>
    sprintService.getSprintIssues(
      req,
      req.params.boardId,
      req.params.sprintId,
      req.triggered_by.id
    ),
};

module.exports = { sprintHandler };
