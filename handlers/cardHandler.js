const Boom = require("boom");
const cardService = require("../services/cardService");

const cardHandler = {
  post: (req, h) => {
    try {
      const boardId = req.params.boardId;
      const listId = req.params.listId;
      const addingCard =
        typeof req?.payload === "string"
          ? JSON.parse(req.payload)
          : req.payload;
      const ownedBy = req.triggered_by.id;

      return cardService.addCard(
        req,
        boardId,
        listId,
        addingCard,
        ownedBy,
        req.triggered_by.username
      );
    } catch (ex) {
      throw new Error(ex);
    }
  },
  putById: (req, h) => {
    try {
      const boardId = req.params.boardId;
      const listId = req.params.listId;
      const cardId = req.params.cardId;
      const triggeredBy = req.triggered_by.id;
      const card =
        typeof req?.payload === "string"
          ? JSON.parse(req.payload)
          : req.payload;
      return cardService.updateCard(
        req,
        boardId,
        listId,
        cardId,
        card,
        triggeredBy,
        req.triggered_by.username
      );
    } catch (ex) {
      throw new Error(ex);
    }
  },
  deleteById: (req, h) => {
    try {
      const boardId = req.params.boardId;
      const listId = req.params.listId;
      const cardId = req.params.cardId;
      const ownedBy = req.triggered_by.id;
      return cardService.deleteCard(req, boardId, listId, cardId, ownedBy);
    } catch (ex) {
      throw new Error(ex);
    }
  },
  swapExternal: (req, h) => {
    try {
      const boardId = req.params.boardId;
      const ownedBy = req.triggered_by.id;
      const { parentList, foundList } =
        typeof req?.payload === "string"
          ? JSON.parse(req.payload)
          : req.payload;
      return cardService.swapCardExternal(
        req,
        boardId,
        parentList,
        foundList,
        ownedBy
      );
    } catch (ex) {
      throw new Error(ex);
    }
  },
  swapInternal: (req, h) => {
    try {
      const boardId = req.params.boardId;
      const listId = req.params.listId;
      const ownedBy = req.triggered_by.id;
      const originalIndex = req.query.from;
      const targetIndex = req.query.to;
      return cardService.swapCardInternal(
        req,
        boardId,
        listId,
        originalIndex,
        targetIndex,
        ownedBy
      );
    } catch (ex) {
      throw new Error(ex);
    }
  },
};

module.exports = { cardHandler };
