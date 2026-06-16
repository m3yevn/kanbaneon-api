const Boom = require("boom");
const uuid = require("uuid");
const { requireBoardAccess } = require("./boardAccessService");

const TRACKED_FIELDS = [
  "title",
  "text",
  "issueType",
  "priority",
  "assigneeUsername",
  "status",
];

const createEntry = (type, userId, username, extra = {}) => ({
  id: uuid.v4(),
  type,
  userId,
  username,
  createdAt: new Date(),
  ...extra,
});

const diffCardFields = (oldCard, newCard, userId, username) => {
  const entries = [];
  for (const field of TRACKED_FIELDS) {
    const from = oldCard[field] ?? null;
    const to = newCard[field] ?? null;
    if (String(from) !== String(to)) {
      entries.push(createEntry("field_changed", userId, username, { field, from, to }));
    }
  }
  return entries;
};

const findCard = (board, listId, cardId) => {
  const list = board.kanbanList.find((l) => l.id === listId);
  if (!list) return null;
  return list.children.find((c) => c.id === cardId) || null;
};

const appendToCard = async (req, boardId, listId, cardId, entries) => {
  if (!entries.length) return null;

  const access = await requireBoardAccess(req, boardId, req.triggered_by?.id);
  if (access.error) return access.error;

  const card = findCard(access.board, listId, cardId);
  if (!card) return Boom.notFound("Issue not found");

  const updatedCard = {
    ...card,
    activity: [...(card.activity || []), ...entries],
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

  return { card: updatedCard, board: board.value };
};

const getActivity = async (req, boardId, listId, cardId, userId) => {
  try {
    const access = await requireBoardAccess(req, boardId, userId);
    if (access.error) {
      return access.error;
    }

    const card = findCard(access.board, listId, cardId);
    if (!card) {
      return Boom.notFound("Issue not found");
    }

    const activity = [...(card.activity || [])].sort(
      (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
    );

    return { success: true, activity, card };
  } catch (ex) {
    return Boom.notImplemented("Getting activity failed", ex);
  }
};

module.exports = {
  TRACKED_FIELDS,
  createEntry,
  diffCardFields,
  appendToCard,
  getActivity,
};
