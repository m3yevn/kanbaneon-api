const Boom = require("boom");

const normalizeUserId = (userId) => String(userId);

const getTeamIdsForUser = async (req, userId) => {
  const collection = req.mongo.db.collection("teams");
  const teams = await collection
    .find({ "members.userId": normalizeUserId(userId) })
    .toArray();
  return teams.map((team) => team.id);
};

const getMemberIdsForTeam = async (req, teamId) => {
  const collection = req.mongo.db.collection("teams");
  const team = await collection.findOne({ id: teamId });
  if (!team) {
    return null;
  }
  return team.members.map((member) => normalizeUserId(member.userId));
};

const getOrganizationIdsForUser = async (req, userId) => {
  const collection = req.mongo.db.collection("organizations");
  const orgs = await collection
    .find({ "members.userId": normalizeUserId(userId) })
    .toArray();
  return orgs.map((org) => org.id);
};

const userHasBoardAccess = (board, userId, userTeamIds = [], userOrgIds = []) => {
  const uid = normalizeUserId(userId);
  if (normalizeUserId(board.ownedBy) === uid) {
    return true;
  }
  if (board.hasAccess?.some((id) => normalizeUserId(id) === uid)) {
    return true;
  }
  if (board.teamId && userTeamIds.includes(board.teamId)) {
    return true;
  }
  if (board.organizationId && userOrgIds.includes(board.organizationId)) {
    return true;
  }
  return false;
};

const userOwnsBoard = (board, userId) =>
  normalizeUserId(board.ownedBy) === normalizeUserId(userId);

const requireBoardAccess = async (req, boardId, userId) => {
  const collection = req.mongo.db.collection("boards");
  const board = await collection.findOne({ id: boardId });
  if (!board) {
    return { error: Boom.notFound("Board not found") };
  }
  const userTeamIds = await getTeamIdsForUser(req, userId);
  const userOrgIds = await getOrganizationIdsForUser(req, userId);
  if (!userHasBoardAccess(board, userId, userTeamIds, userOrgIds)) {
    return { error: Boom.unauthorized("You do not have access to this board") };
  }
  return { board, userTeamIds };
};

const requireTeamMembership = async (req, teamId, userId) => {
  const collection = req.mongo.db.collection("teams");
  const team = await collection.findOne({ id: teamId });
  if (!team) {
    return { error: Boom.notFound("Team not found") };
  }
  const isMember = team.members.some(
    (member) => normalizeUserId(member.userId) === normalizeUserId(userId)
  );
  if (!isMember) {
    return { error: Boom.unauthorized("You are not a member of this team") };
  }
  return { team };
};

const syncTeamBoardAccess = async (req, teamId) => {
  const memberIds = await getMemberIdsForTeam(req, teamId);
  if (!memberIds) {
    return;
  }
  const boards = req.mongo.db.collection("boards");
  await boards.updateMany({ teamId }, { $set: { hasAccess: memberIds } });
};

module.exports = {
  normalizeUserId,
  getTeamIdsForUser,
  getOrganizationIdsForUser,
  getMemberIdsForTeam,
  userHasBoardAccess,
  userOwnsBoard,
  requireBoardAccess,
  requireTeamMembership,
  syncTeamBoardAccess,
};
