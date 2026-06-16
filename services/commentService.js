const Boom = require("boom");
const uuid = require("uuid");
const { requireBoardAccess } = require("./boardAccessService");
const { createEntry } = require("./activityService");

const getComments = async (req, boardId, listId, cardId, userId) => {
  try {
    const access = await requireBoardAccess(req, boardId, userId);
    if (access.error) {
      return access.error;
    }

    const list = access.board.kanbanList.find((l) => l.id === listId);
    if (!list) {
      return Boom.notFound("List not found");
    }

    const card = list.children.find((c) => c.id === cardId);
    if (!card) {
      return Boom.notFound("Issue not found");
    }

    return { success: true, comments: card.comments || [], card };
  } catch (ex) {
    return Boom.notImplemented("Getting comments failed", ex);
  }
};

const addComment = async (req, boardId, listId, cardId, text, userId, username) => {
  try {
    const access = await requireBoardAccess(req, boardId, userId);
    if (access.error) {
      return access.error;
    }

    const list = access.board.kanbanList.find((l) => l.id === listId);
    if (!list) {
      return Boom.notFound("List not found");
    }

    const card = list.children.find((c) => c.id === cardId);
    if (!card) {
      return Boom.notFound("Issue not found");
    }

    const comment = {
      id: uuid.v4(),
      userId,
      username,
      text,
      createdAt: new Date(),
    };

    const updatedCard = {
      ...card,
      comments: [...(card.comments || []), comment],
      activity: [
        ...(card.activity || []),
        createEntry("comment_added", userId, username, { text }),
      ],
    };

    const collection = req.mongo.db.collection("boards");
    const board = await collection.findOneAndUpdate(
      {
        id: boardId,
        "kanbanList.id": listId,
        "kanbanList.children.id": cardId,
      },
      {
        $set: { "kanbanList.$[list].children.$[card]": updatedCard },
        $currentDate: { lastModified: true },
      },
      {
        arrayFilters: [{ "list.id": listId }, { "card.id": cardId }],
        returnDocument: "after",
      }
    );

    return { success: true, comment, card: updatedCard, board: board.value };
  } catch (ex) {
    return Boom.notImplemented("Adding comment failed", ex);
  }
};

module.exports = { getComments, addComment };
