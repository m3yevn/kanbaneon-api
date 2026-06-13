const Boom = require("boom");
const organizationService = require("../services/organizationService");

const parsePayload = (req) =>
  typeof req?.payload === "string" ? JSON.parse(req.payload) : req.payload;

const organizationHandler = {
  get: (req) => organizationService.getOrganizations(req, req.triggered_by.id),
  getById: (req) =>
    organizationService.getOrganization(req, req.params.organizationId, req.triggered_by.id),
  getTeams: (req) =>
    organizationService.getOrgTeams(req, req.params.organizationId, req.triggered_by.id),
  post: (req) => {
    const { id, name, slug, description, members } = parsePayload(req);
    if (!id || !name) {
      return Boom.badRequest("ID or name is empty");
    }
    return organizationService.addOrganization(
      req,
      id,
      name,
      slug,
      description,
      members,
      req.triggered_by.id
    );
  },
  postTeam: (req) => {
    const { id, name, description, members } = parsePayload(req);
    const teamService = require("../services/teamService");
    if (!id || !name) {
      return Boom.badRequest("ID or name is empty");
    }
    return teamService.addTeam(
      req,
      id,
      name,
      description,
      members,
      req.triggered_by.id,
      req.params.organizationId
    );
  },
  putById: (req) => {
    const updates = parsePayload(req);
    return organizationService.updateOrganization(
      req,
      req.params.organizationId,
      updates,
      req.triggered_by.id
    );
  },
  deleteById: (req) =>
    organizationService.deleteOrganization(
      req,
      req.params.organizationId,
      req.triggered_by.id
    ),
};

module.exports = { organizationHandler };
