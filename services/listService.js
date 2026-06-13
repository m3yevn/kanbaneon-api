const Boom = require("boom");
const { deleteWatchList } = require("./notificationService");
const { requireBoardAccess } = require("./boardAccessService");

const addList = async (req, boardId, addingList, userId) => {
  try {
    const access = await requireBoardAccess(req, boardId, userId);
    if (access.error) {
      return access.error;
    }

    const collection = req.mongo.db.collection("boards");
    const kanbanList = [...access.board.kanbanList, addingList];
    await collection.findOneAndUpdate(
      { id: boardId },
      {
        $set: { kanbanList },
        $currentDate: { lastModified: true },
      }
    );
    return { success: true, board: { ...access.board, kanbanList } };
  } catch (ex) {
    return Boom.notImplemented("Adding List failed", ex);
  }
};

const updateList = async (req, boardId, listId, list, userId) => {
  try {
    const access = await requireBoardAccess(req, boardId, userId);
    if (access.error) {
      return access.error;
    }

    const updatingBoard = { ...access.board };
    const updatingListIndex = updatingBoard.kanbanList.findIndex(
      (entry) => entry.id === listId
    );
    if (updatingListIndex === -1) {
      return Boom.notFound("List is not found in the board");
    }

    updatingBoard.kanbanList[updatingListIndex] = {
      ...updatingBoard.kanbanList[updatingListIndex],
      id: list.listId,
      name: list.name,
    };

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
    return Boom.notImplemented("Updating List failed", ex);
  }
};

const deleteList = async (req, boardId, listId, userId) => {
  try {
    const access = await requireBoardAccess(req, boardId, userId);
    if (access.error) {
      return access.error;
    }

    const deletingList = access.board.kanbanList.find((list) => list.id === listId);
    if (!deletingList) {
      return Boom.notFound("List is not found in the board");
    }

    const kanbanList = access.board.kanbanList.filter((list) => list.id !== listId);
    const collection = req.mongo.db.collection("boards");
    await collection.findOneAndUpdate(
      { id: boardId },
      {
        $set: { kanbanList },
        $currentDate: { lastModified: true },
      }
    );
    await deleteWatchList(req, userId, listId, "listId");
    return { success: true, board: { ...access.board, kanbanList } };
  } catch (ex) {
    return Boom.notImplemented("Deleting List failed", ex);
  }
};

const swapList = async (req, boardId, originalIndex, targetIndex, userId) => {
  try {
    const access = await requireBoardAccess(req, boardId, userId);
    if (access.error) {
      return access.error;
    }

    const updatingBoard = { ...access.board };
    const from = parseInt(originalIndex, 10);
    const to = parseInt(targetIndex, 10);
    const originalList = updatingBoard.kanbanList[from];
    const targetList = updatingBoard.kanbanList[to];
    updatingBoard.kanbanList[to] = { ...originalList };
    updatingBoard.kanbanList[from] = { ...targetList };

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
    return Boom.notImplemented("Swapping lists failed", ex);
  }
};

module.exports = {
  addList,
  updateList,
  deleteList,
  swapList,
};
