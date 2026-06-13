const bcrypt = require("bcrypt");
const Boom = require("boom");
const uuid = require("uuid");
const { sendEmailHTML } = require("./emailService");
const { readHTMLFile, fillTemplate } = require("./fileService");
const boardService = require("./boardService");
const teamService = require("./teamService");

const deleteUser = async (req, username, password, triggedBy) => {
  try {
    const collection = req.mongo.db.collection("users");
    const user = await collection.findOne({ username });
    if (!user) {
      return Boom.unauthorized("There is no existing user.");
    }
    const ObjectID = req.mongo.ObjectID;
    const triggeringUser = await collection.findOne({
      _id: new ObjectID(triggedBy),
    });
    if (triggeringUser.username !== username) {
      // TODO: add admin permission
      return Boom.unauthorized(
        "You have no authorization to delete this user."
      );
    }

    const result = await bcrypt.compare(password, user.password);
    if (!result) {
      return Boom.badRequest("Password is incorrect.");
    }
    const clonedUser = JSON.parse(JSON.stringify(user));

    const deleteBoardsResult = await boardService.deleteBoards(
      req,
      clonedUser._id
    );
    if (Boom.isBoom(deleteBoardsResult)) {
      return deleteBoardsResult;
    }

    const deleteTeamsResult = await teamService.removeUserFromTeams(
      req,
      clonedUser._id
    );
    if (Boom.isBoom(deleteTeamsResult)) {
      return deleteTeamsResult;
    }

    if (deleteBoardsResult.success) {
      const profileCollection = req.mongo.db.collection("profiles");
      await profileCollection.findOneAndDelete({
        userId: clonedUser._id,
      });
      console.log(`Profile for ${clonedUser._id} is deleted.`);
      await collection.findOneAndDelete({
        username,
      });
      console.log(`User entry for ${clonedUser._id} is deleted.`);
      return { success: true };
    }
  } catch (ex) {
    return Boom.notImplemented("Deleting user failed", ex);
  }
};

module.exports = {
  deleteUser,
};
