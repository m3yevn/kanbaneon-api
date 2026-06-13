const Boom = require("boom");
const teamService = require("../services/teamService");

const parsePayload = (req) =>
  typeof req?.payload === "string" ? JSON.parse(req.payload) : req.payload;

const teamHandler = {
  get: (req) => {
    try {
      const userId = req.triggered_by.id;
      return teamService.getTeams(req, userId);
    } catch (ex) {
      throw new Error(ex);
    }
  },
  getById: (req) => {
    try {
      const teamId = req.params.teamId;
      const userId = req.triggered_by.id;
      return teamService.getTeam(req, teamId, userId);
    } catch (ex) {
      throw new Error(ex);
    }
  },
  post: (req) => {
    try {
      const { id, name, description, members } = parsePayload(req);
      const createdBy = req.triggered_by.id;
      if (!id || !name) {
        return Boom.badRequest("ID or name is empty");
      }
      return teamService.addTeam(req, id, name, description, members, createdBy);
    } catch (ex) {
      throw new Error(ex);
    }
  },
  putById: (req) => {
    try {
      const teamId = req.params.teamId;
      const userId = req.triggered_by.id;
      const updates = parsePayload(req);
      return teamService.updateTeam(req, teamId, updates, userId);
    } catch (ex) {
      throw new Error(ex);
    }
  },
  deleteById: (req) => {
    try {
      const teamId = req.params.teamId;
      const userId = req.triggered_by.id;
      return teamService.deleteTeam(req, teamId, userId);
    } catch (ex) {
      throw new Error(ex);
    }
  },
  addMember: (req) => {
    try {
      const teamId = req.params.teamId;
      const userId = req.triggered_by.id;
      const member = parsePayload(req);
      if (!member?.userId || !member?.username) {
        return Boom.badRequest("Member userId and username are required");
      }
      return teamService.addMember(req, teamId, member, userId);
    } catch (ex) {
      throw new Error(ex);
    }
  },
  removeMember: (req) => {
    try {
      const teamId = req.params.teamId;
      const memberUserId = req.params.userId;
      const userId = req.triggered_by.id;
      return teamService.removeMember(req, teamId, memberUserId, userId);
    } catch (ex) {
      throw new Error(ex);
    }
  },
};

module.exports = { teamHandler };
