const Boom = require("boom");
const boardService = require("../services/boardService");

const parsePayload = (req) =>
  typeof req?.payload === "string" ? JSON.parse(req.payload) : req.payload;

const boardHandler = {
  get: (req) => {
    try {
      const userId = req.triggered_by.id;
      return boardService.getBoards(req, userId);
    } catch (ex) {
      throw new Error(ex);
    }
  },
  getById: (req) => {
    try {
      const id = req.params.boardId;
      const userId = req.triggered_by.id;
      return boardService.getBoard(req, id, userId);
    } catch (ex) {
      throw new Error(ex);
    }
  },
  getTeamBoards: (req) => {
    try {
      const teamId = req.params.teamId;
      const userId = req.triggered_by.id;
      return boardService.getTeamBoards(req, teamId, userId);
    } catch (ex) {
      throw new Error(ex);
    }
  },
  getOrganizationBoards: (req) => {
    try {
      const organizationId = req.params.organizationId;
      const userId = req.triggered_by.id;
      return boardService.getOrganizationBoards(req, organizationId, userId);
    } catch (ex) {
      throw new Error(ex);
    }
  },
  putById: (req) => {
    try {
      const id = req.params.boardId;
      const userId = req.triggered_by.id;
      const board = parsePayload(req);
      return boardService.updateBoard(req, id, board, userId);
    } catch (ex) {
      throw new Error(ex);
    }
  },
  post: (req) => {
    try {
      const { id, kanbanList, name, teamId, organizationId, projectKey } = parsePayload(req);
      const ownedBy = req.triggered_by.id;
      if (!id || !name) {
        return Boom.badRequest("ID or name is empty");
      }
      return boardService.addBoard(
        req,
        id,
        kanbanList,
        name,
        ownedBy,
        teamId,
        organizationId,
        projectKey
      );
    } catch (ex) {
      throw new Error(ex);
    }
  },
  postTeamBoard: (req) => {
    try {
      const teamId = req.params.teamId;
      const { id, kanbanList, name, projectKey } = parsePayload(req);
      const ownedBy = req.triggered_by.id;
      if (!id || !name) {
        return Boom.badRequest("ID or name is empty");
      }
      return boardService.addBoard(
        req,
        id,
        kanbanList,
        name,
        ownedBy,
        teamId,
        null,
        projectKey
      );
    } catch (ex) {
      throw new Error(ex);
    }
  },
  postOrganizationBoard: (req) => {
    try {
      const organizationId = req.params.organizationId;
      const { id, kanbanList, name, projectKey } = parsePayload(req);
      const ownedBy = req.triggered_by.id;
      if (!id || !name) {
        return Boom.badRequest("ID or name is empty");
      }
      return boardService.addBoard(
        req,
        id,
        kanbanList,
        name,
        ownedBy,
        null,
        organizationId,
        projectKey
      );
    } catch (ex) {
      throw new Error(ex);
    }
  },
  deleteById: (req) => {
    try {
      const id = req.params.boardId;
      const userId = req.triggered_by.id;
      return boardService.deleteBoard(req, id, userId);
    } catch (ex) {
      throw new Error(ex);
    }
  },
};

module.exports = { boardHandler };
