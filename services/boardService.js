const Boom = require("boom");
const { deleteWatchList } = require("./notificationService");
const {
  getTeamIdsForUser,
  getMemberIdsForTeam,
  userHasBoardAccess,
  userOwnsBoard,
  requireBoardAccess,
  requireTeamMembership,
  normalizeUserId,
} = require("./boardAccessService");

const addBoard = async (
  req,
  id,
  kanbanList,
  name,
  ownedBy,
  teamId,
  organizationId,
  projectKey
) => {
  try {
    const collection = req.mongo.db.collection("boards");
    let hasAccess = [normalizeUserId(ownedBy)];

    if (organizationId) {
      const { requireOrgMembership } = require("./organizationService");
      const membership = await requireOrgMembership(req, organizationId, ownedBy);
      if (membership.error) {
        return membership.error;
      }
      const orgMemberIds = membership.organization.members.map((m) =>
        normalizeUserId(m.userId)
      );
      hasAccess = orgMemberIds;
    } else if (teamId) {
      const membership = await requireTeamMembership(req, teamId, ownedBy);
      if (membership.error) {
        return membership.error;
      }
      const memberIds = await getMemberIdsForTeam(req, teamId);
      hasAccess = memberIds;
    }

    const key =
      (projectKey || name || "KAN")
        .toUpperCase()
        .replace(/[^A-Z0-9]/g, "")
        .slice(0, 6) || "KAN";

    const board = {
      id,
      kanbanList,
      name,
      ownedBy: normalizeUserId(ownedBy),
      teamId: teamId || null,
      organizationId: organizationId || null,
      projectKey: key,
      issueCounter: 0,
      hasAccess,
      createdAt: new Date(),
    };

    await collection.insertOne(board);
    return { success: true, board };
  } catch (ex) {
    return Boom.notImplemented("Adding Board failed", ex);
  }
};

const updateBoard = async (req, id, board, userId) => {
  try {
    const access = await requireBoardAccess(req, id, userId);
    if (access.error) {
      return access.error;
    }

    const collection = req.mongo.db.collection("boards");
    await collection.findOneAndUpdate(
      { id },
      {
        $set: { name: board.name },
        $currentDate: { lastModified: true },
      }
    );
    return { success: true, board: { ...access.board, name: board.name } };
  } catch (ex) {
    return Boom.notImplemented("Updating Board failed", ex);
  }
};

const deleteBoard = async (req, id, userId) => {
  try {
    const access = await requireBoardAccess(req, id, userId);
    if (access.error) {
      return access.error;
    }
    if (!userOwnsBoard(access.board, userId)) {
      return Boom.unauthorized("Only the board owner can delete this board");
    }

    const collection = req.mongo.db.collection("boards");
    await collection.deleteOne({ id });
    await deleteWatchList(req, userId, id, "boardId");
    return { success: true, board: {} };
  } catch (ex) {
    return Boom.notImplemented("Deleting Board failed", ex);
  }
};

const deleteBoards = async (req, ownedBy) => {
  try {
    const collection = req.mongo.db.collection("boards");
    await collection.deleteMany({ ownedBy: normalizeUserId(ownedBy) });
    return { success: true };
  } catch (ex) {
    return Boom.notImplemented("Deleting Boards failed", ex);
  }
};

const getBoards = async (req, userId) => {
  try {
    const collection = req.mongo.db.collection("boards");
    const userTeamIds = await getTeamIdsForUser(req, userId);
    const userOrgIds = await getOrganizationIdsForUser(req, userId);
    const uid = normalizeUserId(userId);

    const boards = await collection
      .find({
        $or: [
          { ownedBy: uid },
          { hasAccess: uid },
          ...(userTeamIds.length ? [{ teamId: { $in: userTeamIds } }] : []),
          ...(userOrgIds.length ? [{ organizationId: { $in: userOrgIds } }] : []),
        ],
      })
      .toArray();

    return { success: true, boards };
  } catch (ex) {
    return Boom.notFound("Getting Boards failed", ex);
  }
};

const getTeamBoards = async (req, teamId, userId) => {
  try {
    const membership = await requireTeamMembership(req, teamId, userId);
    if (membership.error) {
      return membership.error;
    }

    const collection = req.mongo.db.collection("boards");
    const boards = await collection.find({ teamId }).toArray();
    return { success: true, boards };
  } catch (ex) {
    return Boom.notFound("Getting team boards failed", ex);
  }
};

const getOrganizationBoards = async (req, organizationId, userId) => {
  try {
    const { requireOrgMembership } = require("./organizationService");
    const membership = await requireOrgMembership(req, organizationId, userId);
    if (membership.error) {
      return membership.error;
    }

    const collection = req.mongo.db.collection("boards");
    const boards = await collection.find({ organizationId }).toArray();
    return { success: true, boards };
  } catch (ex) {
    return Boom.notFound("Getting organization boards failed", ex);
  }
};

const getBoard = async (req, id, userId) => {
  try {
    const access = await requireBoardAccess(req, id, userId);
    if (access.error) {
      return access.error;
    }
    return { success: true, board: access.board };
  } catch (ex) {
    return Boom.notFound("Getting Board by ID failed", ex);
  }
};

module.exports = {
  addBoard,
  updateBoard,
  deleteBoard,
  deleteBoards,
  getBoards,
  getTeamBoards,
  getOrganizationBoards,
  getBoard,
};
