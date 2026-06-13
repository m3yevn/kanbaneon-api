const Boom = require("boom");
const { requireBoardAccess } = require("./boardAccessService");
const { findBacklogList } = require("./boardHelpers");

const getBacklog = async (req, boardId, userId) => {
  try {
    const access = await requireBoardAccess(req, boardId, userId);
    if (access.error) {
      return access.error;
    }

    const backlogList = findBacklogList(access.board.kanbanList);
    if (!backlogList) {
      return Boom.notFound("Backlog list not found on this board");
    }

    const issues = [...(backlogList.children || [])].sort(
      (a, b) => (a.backlogRank ?? 0) - (b.backlogRank ?? 0)
    );

    return {
      success: true,
      listId: backlogList.id,
      issues,
      sprints: access.board.sprints || [],
      activeSprintId: access.board.activeSprintId || null,
    };
  } catch (ex) {
    return Boom.notImplemented("Getting backlog failed", ex);
  }
};

const reorderBacklog = async (req, boardId, orderedIds, userId) => {
  try {
    const access = await requireBoardAccess(req, boardId, userId);
    if (access.error) {
      return access.error;
    }

    const updatingBoard = { ...access.board };
    const backlogList = findBacklogList(updatingBoard.kanbanList);
    if (!backlogList) {
      return Boom.notFound("Backlog list not found");
    }

    const byId = new Map(backlogList.children.map((card) => [card.id, card]));
    const reordered = orderedIds
      .map((id, index) => {
        const card = byId.get(id);
        if (!card) {
          return null;
        }
        return { ...card, backlogRank: index };
      })
      .filter(Boolean);

    backlogList.children.forEach((card) => {
      if (!orderedIds.includes(card.id)) {
        reordered.push(card);
      }
    });

    backlogList.children = reordered;

    const collection = req.mongo.db.collection("boards");
    await collection.findOneAndUpdate(
      { id: boardId },
      {
        $set: { kanbanList: updatingBoard.kanbanList },
        $currentDate: { lastModified: true },
      }
    );

    return { success: true, board: updatingBoard, issues: reordered };
  } catch (ex) {
    return Boom.notImplemented("Reordering backlog failed", ex);
  }
};

module.exports = { getBacklog, reorderBacklog };
