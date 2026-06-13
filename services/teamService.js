const Boom = require("boom");
const { syncTeamBoardAccess, normalizeUserId } = require("./boardAccessService");

const isTeamMember = (team, userId) =>
  team.members.some((member) => normalizeUserId(member.userId) === normalizeUserId(userId));

const isTeamOwner = (team, userId) =>
  team.members.some(
    (member) =>
      normalizeUserId(member.userId) === normalizeUserId(userId) && member.role === "owner"
  );

const getTeams = async (req, userId) => {
  try {
    const collection = req.mongo.db.collection("teams");
    const teams = await collection
      .find({ "members.userId": normalizeUserId(userId) })
      .toArray();
    return { success: true, teams };
  } catch (ex) {
    return Boom.notImplemented("Getting teams failed", ex);
  }
};

const getTeam = async (req, teamId, userId) => {
  try {
    const collection = req.mongo.db.collection("teams");
    const team = await collection.findOne({ id: teamId });
    if (!team) {
      return Boom.notFound("Team not found");
    }
    if (!isTeamMember(team, userId)) {
      return Boom.unauthorized("You are not a member of this team");
    }
    return { success: true, team };
  } catch (ex) {
    return Boom.notImplemented("Getting team failed", ex);
  }
};

const addTeam = async (req, id, name, description, members, createdBy, organizationId) => {
  try {
    const collection = req.mongo.db.collection("teams");
    const ownerId = normalizeUserId(createdBy);

    if (organizationId) {
      const { requireOrgMembership } = require("./organizationService");
      const membership = await requireOrgMembership(req, organizationId, createdBy);
      if (membership.error) {
        return membership.error;
      }
    }

    const teamMembers = [
      {
        userId: ownerId,
        username: req.triggered_by.username,
        role: "owner",
        joinedAt: new Date(),
      },
    ];

    (members || []).forEach((member) => {
      const memberId = normalizeUserId(member.userId);
      if (memberId === ownerId) {
        return;
      }
      if (teamMembers.some((existing) => existing.userId === memberId)) {
        return;
      }
      teamMembers.push({
        userId: memberId,
        username: member.username,
        role: "member",
        joinedAt: new Date(),
      });
    });

    const team = {
      id,
      name,
      description: description || "",
      organizationId: organizationId || null,
      createdBy: ownerId,
      members: teamMembers,
      createdAt: new Date(),
    };

    await collection.insertOne(team);
    return { success: true, team };
  } catch (ex) {
    return Boom.notImplemented("Adding team failed", ex);
  }
};

const updateTeam = async (req, teamId, updates, userId) => {
  try {
    const collection = req.mongo.db.collection("teams");
    const team = await collection.findOne({ id: teamId });
    if (!team) {
      return Boom.notFound("Team not found");
    }
    if (!isTeamOwner(team, userId)) {
      return Boom.unauthorized("Only team owners can update team details");
    }

    await collection.findOneAndUpdate(
      { id: teamId },
      {
        $set: {
          name: updates.name,
          description: updates.description || "",
        },
        $currentDate: { lastModified: true },
      }
    );

    return {
      success: true,
      team: {
        ...team,
        name: updates.name,
        description: updates.description || "",
      },
    };
  } catch (ex) {
    return Boom.notImplemented("Updating team failed", ex);
  }
};

const deleteTeam = async (req, teamId, userId) => {
  try {
    const collection = req.mongo.db.collection("teams");
    const team = await collection.findOne({ id: teamId });
    if (!team) {
      return Boom.notFound("Team not found");
    }
    if (!isTeamOwner(team, userId)) {
      return Boom.unauthorized("Only team owners can delete this team");
    }

    await collection.deleteOne({ id: teamId });
    return { success: true, team: {} };
  } catch (ex) {
    return Boom.notImplemented("Deleting team failed", ex);
  }
};

const addMember = async (req, teamId, member, userId) => {
  try {
    const collection = req.mongo.db.collection("teams");
    const team = await collection.findOne({ id: teamId });
    if (!team) {
      return Boom.notFound("Team not found");
    }
    if (!isTeamOwner(team, userId)) {
      return Boom.unauthorized("Only team owners can add members");
    }

    const memberId = normalizeUserId(member.userId);
    if (isTeamMember(team, memberId)) {
      return Boom.badRequest("User is already a member of this team");
    }

    await collection.findOneAndUpdate(
      { id: teamId },
      {
        $push: {
          members: {
            userId: memberId,
            username: member.username,
            role: "member",
            joinedAt: new Date(),
          },
        },
        $currentDate: { lastModified: true },
      }
    );

    await syncTeamBoardAccess(req, teamId);

    return { success: true };
  } catch (ex) {
    return Boom.notImplemented("Adding team member failed", ex);
  }
};

const removeMember = async (req, teamId, memberUserId, userId) => {
  try {
    const collection = req.mongo.db.collection("teams");
    const team = await collection.findOne({ id: teamId });
    if (!team) {
      return Boom.notFound("Team not found");
    }

    const normalizedMemberId = normalizeUserId(memberUserId);
    const normalizedUserId = normalizeUserId(userId);
    const isOwner = isTeamOwner(team, normalizedUserId);
    const isSelf = normalizedMemberId === normalizedUserId;

    if (!isOwner && !isSelf) {
      return Boom.unauthorized("You cannot remove this member");
    }
    if (normalizedMemberId === normalizeUserId(team.createdBy) && !isSelf) {
      return Boom.badRequest("Cannot remove the team owner");
    }

    await collection.findOneAndUpdate(
      { id: teamId },
      {
        $pull: { members: { userId: normalizedMemberId } },
        $currentDate: { lastModified: true },
      }
    );

    await syncTeamBoardAccess(req, teamId);

    return { success: true };
  } catch (ex) {
    return Boom.notImplemented("Removing team member failed", ex);
  }
};

const removeUserFromTeams = async (req, userId) => {
  try {
    const collection = req.mongo.db.collection("teams");
    const normalizedUserId = normalizeUserId(userId);

    await collection.deleteMany({ createdBy: normalizedUserId });
    await collection.updateMany(
      { "members.userId": normalizedUserId },
      { $pull: { members: { userId: normalizedUserId } } }
    );

    return { success: true };
  } catch (ex) {
    return Boom.notImplemented("Removing user from teams failed", ex);
  }
};

module.exports = {
  getTeams,
  getTeam,
  addTeam,
  updateTeam,
  deleteTeam,
  addMember,
  removeMember,
  removeUserFromTeams,
};
