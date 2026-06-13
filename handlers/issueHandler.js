const issueSearchService = require("../services/issueSearchService");
const epicService = require("../services/epicService");

const issueHandler = {
  search: (req) => {
    const filters = {
      q: req.query.q || "",
      issueType: req.query.issueType || null,
      priority: req.query.priority || null,
      assigneeId: req.query.assigneeId || null,
      sprintId: req.query.sprintId || null,
      epicId: req.query.epicId || null,
      listName: req.query.listName || null,
    };
    return issueSearchService.searchIssues(
      req,
      req.params.boardId,
      filters,
      req.triggered_by.id
    );
  },
  getEpics: (req) =>
    epicService.getEpics(req, req.params.boardId, req.triggered_by.id),
  linkEpic: (req) => {
    const payload =
      typeof req?.payload === "string" ? JSON.parse(req.payload) : req.payload;
    return epicService.linkToEpic(
      req,
      req.params.boardId,
      req.params.listId,
      req.params.cardId,
      payload.epicId,
      req.triggered_by.id
    );
  },
  getEpicChildren: (req) =>
    epicService.getEpicChildren(
      req,
      req.params.boardId,
      req.params.epicId,
      req.triggered_by.id
    ),
};

module.exports = { issueHandler };
