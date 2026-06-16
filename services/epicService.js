const Boom = require("boom");
const { requireBoardAccess } = require("./boardAccessService");
const { flattenIssues } = require("./issueSearchService");
const { createEntry } = require("./activityService");

const getEpics = async (req, boardId, userId) => {
  try {
    const access = await requireBoardAccess(req, boardId, userId);
    if (access.error) {
      return access.error;
    }

    const epics = flattenIssues(access.board).filter(
      (issue) => issue.issueType === "epic"
    );

    return { success: true, epics };
  } catch (ex) {
    return Boom.notImplemented("Getting epics failed", ex);
  }
};

const linkToEpic = async (req, boardId, listId, cardId, epicId, userId, username = "user") => {
  try {
    const access = await requireBoardAccess(req, boardId, userId);
    if (access.error) {
      return access.error;
    }

    const epicIssue = flattenIssues(access.board).find(
      (issue) => issue.id === epicId && issue.issueType === "epic"
    );
    if (!epicIssue) {
      return Boom.notFound("Epic not found");
    }

    const updatingBoard = { ...access.board };
    const list = updatingBoard.kanbanList.find((l) => l.id === listId);
    if (!list) {
      return Boom.notFound("List not found");
    }

    const cardIndex = list.children.findIndex((c) => c.id === cardId);
    if (cardIndex === -1) {
      return Boom.notFound("Issue not found");
    }

    list.children[cardIndex] = {
      ...list.children[cardIndex],
      epicId,
      parentEpicKey: epicIssue.issueKey,
      activity: [
        ...(list.children[cardIndex].activity || []),
        createEntry("epic_linked", userId, username, {
          meta: { epicId, epicKey: epicIssue.issueKey },
        }),
      ],
    };

    const collection = req.mongo.db.collection("boards");
    const result = await collection.findOneAndUpdate(
      { id: boardId },
      {
        $set: { kanbanList: updatingBoard.kanbanList },
        $currentDate: { lastModified: true },
      },
      { returnDocument: "after" }
    );

    return {
      success: true,
      card: list.children[cardIndex],
      board: result.value,
    };
  } catch (ex) {
    return Boom.notImplemented("Linking to epic failed", ex);
  }
};

const getEpicChildren = async (req, boardId, epicId, userId) => {
  try {
    const access = await requireBoardAccess(req, boardId, userId);
    if (access.error) {
      return access.error;
    }

    const children = flattenIssues(access.board).filter(
      (issue) => issue.epicId === epicId
    );

    return { success: true, children, count: children.length };
  } catch (ex) {
    return Boom.notImplemented("Getting epic children failed", ex);
  }
};

module.exports = { getEpics, linkToEpic, getEpicChildren };
