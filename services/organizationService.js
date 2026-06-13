const Boom = require("boom");
const { normalizeUserId } = require("./boardAccessService");

const isOrgMember = (org, userId) =>
  org.members.some((m) => normalizeUserId(m.userId) === normalizeUserId(userId));

const isOrgOwner = (org, userId) =>
  org.members.some(
    (m) => normalizeUserId(m.userId) === normalizeUserId(userId) && m.role === "owner"
  );

const getOrganizations = async (req, userId) => {
  try {
    const collection = req.mongo.db.collection("organizations");
    const organizations = await collection
      .find({ "members.userId": normalizeUserId(userId) })
      .toArray();
    return { success: true, organizations };
  } catch (ex) {
    return Boom.notImplemented("Getting organizations failed", ex);
  }
};

const getOrganization = async (req, organizationId, userId) => {
  try {
    const collection = req.mongo.db.collection("organizations");
    const organization = await collection.findOne({ id: organizationId });
    if (!organization) {
      return Boom.notFound("Organization not found");
    }
    if (!isOrgMember(organization, userId)) {
      return Boom.unauthorized("You are not a member of this organization");
    }
    return { success: true, organization };
  } catch (ex) {
    return Boom.notImplemented("Getting organization failed", ex);
  }
};

const addOrganization = async (req, id, name, slug, description, members, createdBy) => {
  try {
    const collection = req.mongo.db.collection("organizations");
    const ownerId = normalizeUserId(createdBy);
    const orgMembers = [
      {
        userId: ownerId,
        username: req.triggered_by.username,
        role: "owner",
        joinedAt: new Date(),
      },
    ];

    (members || []).forEach((member) => {
      const memberId = normalizeUserId(member.userId);
      if (memberId === ownerId || orgMembers.some((m) => m.userId === memberId)) {
        return;
      }
      orgMembers.push({
        userId: memberId,
        username: member.username,
        role: "member",
        joinedAt: new Date(),
      });
    });

    const organization = {
      id,
      name,
      slug: (slug || name).toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 6) || "ORG",
      description: description || "",
      createdBy: ownerId,
      members: orgMembers,
      createdAt: new Date(),
    };

    await collection.insertOne(organization);
    return { success: true, organization };
  } catch (ex) {
    return Boom.notImplemented("Adding organization failed", ex);
  }
};

const updateOrganization = async (req, organizationId, updates, userId) => {
  try {
    const collection = req.mongo.db.collection("organizations");
    const organization = await collection.findOne({ id: organizationId });
    if (!organization) {
      return Boom.notFound("Organization not found");
    }
    if (!isOrgOwner(organization, userId)) {
      return Boom.unauthorized("Only organization owners can update details");
    }

    await collection.findOneAndUpdate(
      { id: organizationId },
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
      organization: { ...organization, name: updates.name, description: updates.description },
    };
  } catch (ex) {
    return Boom.notImplemented("Updating organization failed", ex);
  }
};

const deleteOrganization = async (req, organizationId, userId) => {
  try {
    const collection = req.mongo.db.collection("organizations");
    const organization = await collection.findOne({ id: organizationId });
    if (!organization) {
      return Boom.notFound("Organization not found");
    }
    if (!isOrgOwner(organization, userId)) {
      return Boom.unauthorized("Only organization owners can delete");
    }

    await collection.deleteOne({ id: organizationId });
    const teams = req.mongo.db.collection("teams");
    await teams.updateMany({ organizationId }, { $unset: { organizationId: "" } });

    return { success: true, organization: {} };
  } catch (ex) {
    return Boom.notImplemented("Deleting organization failed", ex);
  }
};

const requireOrgMembership = async (req, organizationId, userId) => {
  const collection = req.mongo.db.collection("organizations");
  const organization = await collection.findOne({ id: organizationId });
  if (!organization) {
    return { error: Boom.notFound("Organization not found") };
  }
  if (!isOrgMember(organization, userId)) {
    return { error: Boom.unauthorized("You are not a member of this organization") };
  }
  return { organization };
};

const getOrgTeams = async (req, organizationId, userId) => {
  try {
    const membership = await requireOrgMembership(req, organizationId, userId);
    if (membership.error) {
      return membership.error;
    }

    const teams = await req.mongo.db.collection("teams").find({ organizationId }).toArray();
    return { success: true, teams };
  } catch (ex) {
    return Boom.notImplemented("Getting organization teams failed", ex);
  }
};

const removeUserFromOrganizations = async (req, userId) => {
  try {
    const collection = req.mongo.db.collection("organizations");
    const normalizedUserId = normalizeUserId(userId);

    await collection.deleteMany({ createdBy: normalizedUserId });
    await collection.updateMany(
      { "members.userId": normalizedUserId },
      { $pull: { members: { userId: normalizedUserId } } }
    );

    return { success: true };
  } catch (ex) {
    return Boom.notImplemented("Removing user from organizations failed", ex);
  }
};

module.exports = {
  getOrganizations,
  getOrganization,
  addOrganization,
  updateOrganization,
  deleteOrganization,
  requireOrgMembership,
  getOrgTeams,
  removeUserFromOrganizations,
  isOrgMember,
};
