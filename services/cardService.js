const Boom = require("boom");
const {
  updateWatchList,
  addWatchList,
  deleteWatchList,
} = require("./notificationService");
const { requireBoardAccess } = require("./boardAccessService");
const uuid = require("uuid");

const addCard = async (req, boardId, listId, addingCard, userId) => {
  try {
    const access = await requireBoardAccess(req, boardId, userId);
    if (access.error) {
      return access.error;
    }

    const updatingBoard = { ...access.board };
    const updatingList = updatingBoard.kanbanList.find((list) => list.id === listId);
    if (!updatingList) {
      return Boom.notFound("List is not found in the board");
    }

    if (addingCard.isWatching) {
      delete addingCard.isWatching;
      addingCard.watchers = [...(addingCard.watchers || []), userId];
    } else {
      delete addingCard.isWatching;
      addingCard.watchers = [];
    }

    updatingList.children.push(addingCard);

    const collection = req.mongo.db.collection("boards");
    await collection.findOneAndUpdate(
      { id: boardId, "kanbanList.id": listId },
      {
        $set: { "kanbanList.$[xxx]": updatingList },
        $currentDate: { lastModified: true },
      },
      { arrayFilters: [{ "xxx.id": listId }] }
    );

    if (addingCard.watchers?.length) {
      await addWatchList(req, userId, {
        id: uuid.v4(),
        boardId,
        listId,
        cardId: addingCard.id,
        type: "card",
        isWatching: true,
        lastModified: new Date(),
      });
    }

    return { success: true, board: updatingBoard };
  } catch (ex) {
    return Boom.notImplemented("Adding Card failed", ex);
  }
};

const updateCard = async (req, boardId, listId, cardId, card, triggeredBy) => {
  try {
    const access = await requireBoardAccess(req, boardId, triggeredBy);
    if (access.error) {
      return access.error;
    }

    if (card.isWatching) {
      delete card.isWatching;
      if (!card.watchers.includes(triggeredBy)) {
        card.watchers = [...card.watchers, triggeredBy];
      }
      await addWatchList(req, triggeredBy, {
        id: uuid.v4(),
        boardId,
        listId,
        cardId,
        type: "card",
        isWatching: true,
        lastModified: new Date(),
      });
    } else {
      card.watchers = card.watchers.filter((watcher) => watcher !== triggeredBy);
      await deleteWatchList(req, triggeredBy, cardId, "cardId");
    }

    const collection = req.mongo.db.collection("boards");
    const board = await collection.findOneAndUpdate(
      {
        id: boardId,
        "kanbanList.id": listId,
        "kanbanList.children.id": cardId,
      },
      {
        $set: { "kanbanList.$[xxx].children.$[xxxx]": card },
        $currentDate: { lastModified: true },
      },
      {
        arrayFilters: [{ "xxx.id": listId }, { "xxxx.id": cardId }],
        returnDocument: "after",
      }
    );

    return { success: true, board: board.value };
  } catch (ex) {
    return Boom.notImplemented("Updating Card failed", ex);
  }
};

const deleteCard = async (req, boardId, listId, cardId, userId) => {
  try {
    const access = await requireBoardAccess(req, boardId, userId);
    if (access.error) {
      return access.error;
    }

    const collection = req.mongo.db.collection("boards");
    const board = await collection.findOneAndUpdate(
      {
        id: boardId,
        "kanbanList.id": listId,
        "kanbanList.children.id": cardId,
      },
      {
        $pull: { "kanbanList.$[xxx].children": { id: cardId } },
      },
      {
        arrayFilters: [{ "xxx.id": listId }],
        returnDocument: "after",
      }
    );
    await deleteWatchList(req, userId, cardId, "cardId");
    return { success: true, board: board.value };
  } catch (ex) {
    return Boom.notImplemented("Deleting Card failed", ex);
  }
};

const swapCardExternal = async (req, boardId, originalList, targetList, userId) => {
  try {
    const access = await requireBoardAccess(req, boardId, userId);
    if (access.error) {
      return access.error;
    }

    const updatingBoard = { ...access.board };
    const originalIndex = updatingBoard.kanbanList.findIndex(
      (list) => list.id === originalList.id
    );
    const targetIndex = updatingBoard.kanbanList.findIndex(
      (list) => list.id === targetList.id
    );
    updatingBoard.kanbanList[targetIndex] = { ...targetList };
    updatingBoard.kanbanList[originalIndex] = { ...originalList };

    const collection = req.mongo.db.collection("boards");
    await collection.findOneAndUpdate(
      { id: boardId },
      {
        $set: { kanbanList: updatingBoard.kanbanList },
        $currentDate: { lastModified: true },
      }
    );
    return { success: true, board: updatingBoard };
  } catch (ex) {
    return Boom.notImplemented("Swapping cards externally failed", ex);
  }
};

const swapCardInternal = async (req, boardId, listId, originalIndex, targetIndex, userId) => {
  try {
    const access = await requireBoardAccess(req, boardId, userId);
    if (access.error) {
      return access.error;
    }

    const updatingBoard = { ...access.board };
    const updatingList = updatingBoard.kanbanList.find((list) => list.id === listId);
    if (!updatingList) {
      return Boom.notFound("List is not found in the board");
    }

    const from = parseInt(originalIndex, 10);
    const to = parseInt(targetIndex, 10);
    const updatingCard = updatingList.children[from];
    updatingList.children = updatingList.children.filter(
      (card) => card.id !== updatingCard.id
    );
    updatingList.children.splice(to, 0, updatingCard);

    const collection = req.mongo.db.collection("boards");
    await collection.findOneAndUpdate(
      { id: boardId },
      {
        $set: { kanbanList: updatingBoard.kanbanList },
        $currentDate: { lastModified: true },
      }
    );
    return { success: true, board: updatingBoard };
  } catch (ex) {
    return Boom.notImplemented("Swapping cards internally failed", ex);
  }
};

module.exports = {
  addCard,
  updateCard,
  deleteCard,
  swapCardExternal,
  swapCardInternal,
};
