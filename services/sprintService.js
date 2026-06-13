const Boom = require("boom");
const uuid = require("uuid");
const { requireBoardAccess } = require("./boardAccessService");
const {
  findBacklogList,
  findTodoList,
  findCardInBoard,
} = require("./boardHelpers");

const getSprints = async (req, boardId, userId) => {
  try {
    const access = await requireBoardAccess(req, boardId, userId);
    if (access.error) {
      return access.error;
    }

    return {
      success: true,
      sprints: access.board.sprints || [],
      activeSprintId: access.board.activeSprintId || null,
      board: access.board,
    };
  } catch (ex) {
    return Boom.notImplemented("Getting sprints failed", ex);
  }
};

const addSprint = async (req, boardId, sprint, userId) => {
  try {
    const access = await requireBoardAccess(req, boardId, userId);
    if (access.error) {
      return access.error;
    }

    const newSprint = {
      id: sprint.id || uuid.v4(),
      name: sprint.name,
      goal: sprint.goal || "",
      startDate: sprint.startDate || null,
      endDate: sprint.endDate || null,
      status: "planned",
      issueIds: [],
      createdAt: new Date(),
    };

    const sprints = [...(access.board.sprints || []), newSprint];
    const collection = req.mongo.db.collection("boards");
    const result = await collection.findOneAndUpdate(
      { id: boardId },
      {
        $set: { sprints },
        $currentDate: { lastModified: true },
      },
      { returnDocument: "after" }
    );

    return { success: true, sprint: newSprint, board: result.value };
  } catch (ex) {
    return Boom.notImplemented("Adding sprint failed", ex);
  }
};

const assignIssuesToSprint = async (req, boardId, sprintId, issueRefs, userId) => {
  try {
    const access = await requireBoardAccess(req, boardId, userId);
    if (access.error) {
      return access.error;
    }

    const updatingBoard = { ...access.board };
    const sprint = (updatingBoard.sprints || []).find((s) => s.id === sprintId);
    if (!sprint) {
      return Boom.notFound("Sprint not found");
    }

    const todoList = findTodoList(updatingBoard.kanbanList);

    issueRefs.forEach(({ cardId, listId }) => {
      const list = updatingBoard.kanbanList.find((l) => l.id === listId);
      if (!list) {
        return;
      }
      const cardIndex = list.children.findIndex((c) => c.id === cardId);
      if (cardIndex === -1) {
        return;
      }

      const card = { ...list.children[cardIndex], sprintId };
      const fromBacklog = list.name === "Backlog" || list.id === "backlog";

      if (fromBacklog && todoList) {
        list.children.splice(cardIndex, 1);
        card.status = "To Do";
        todoList.children.push(card);
      } else {
        list.children[cardIndex] = card;
      }

      if (!sprint.issueIds.includes(cardId)) {
        sprint.issueIds.push(cardId);
      }
    });

    const collection = req.mongo.db.collection("boards");
    await collection.findOneAndUpdate(
      { id: boardId },
      {
        $set: {
          kanbanList: updatingBoard.kanbanList,
          sprints: updatingBoard.sprints,
        },
        $currentDate: { lastModified: true },
      }
    );

    return { success: true, board: updatingBoard, sprint };
  } catch (ex) {
    return Boom.notImplemented("Assigning issues to sprint failed", ex);
  }
};

const startSprint = async (req, boardId, sprintId, userId) => {
  try {
    const access = await requireBoardAccess(req, boardId, userId);
    if (access.error) {
      return access.error;
    }

    const sprints = (access.board.sprints || []).map((sprint) => ({
      ...sprint,
      status:
        sprint.id === sprintId
          ? "active"
          : sprint.status === "active"
          ? "completed"
          : sprint.status,
    }));

    const collection = req.mongo.db.collection("boards");
    const result = await collection.findOneAndUpdate(
      { id: boardId },
      {
        $set: { sprints, activeSprintId: sprintId },
        $currentDate: { lastModified: true },
      },
      { returnDocument: "after" }
    );

    return { success: true, board: result.value, activeSprintId: sprintId };
  } catch (ex) {
    return Boom.notImplemented("Starting sprint failed", ex);
  }
};

const getSprintIssues = async (req, boardId, sprintId, userId) => {
  try {
    const access = await requireBoardAccess(req, boardId, userId);
    if (access.error) {
      return access.error;
    }

    const issues = [];
    (access.board.kanbanList || []).forEach((list) => {
      (list.children || []).forEach((card) => {
        if (card.sprintId === sprintId) {
          issues.push({ ...card, listId: list.id, listName: list.name });
        }
      });
    });

    return { success: true, issues };
  } catch (ex) {
    return Boom.notImplemented("Getting sprint issues failed", ex);
  }
};

module.exports = {
  getSprints,
  addSprint,
  assignIssuesToSprint,
  startSprint,
  getSprintIssues,
  findCardInBoard,
};
