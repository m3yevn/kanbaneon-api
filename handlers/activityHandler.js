const activityService = require("../services/activityService");

const activityHandler = {
  get: (req) =>
    activityService.getActivity(
      req,
      req.params.boardId,
      req.params.listId,
      req.params.cardId,
      req.triggered_by.id
    ),
};

module.exports = { activityHandler };
