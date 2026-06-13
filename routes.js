const {
  loginHandler,
  signUpHandler,
  reauthHandler,
  recoveryHandler,
  profileHandler,
} = require("./handlers/authHandler");
const { boardHandler } = require("./handlers/boardHandler");
const { listHandler } = require("./handlers/listHandler");
const { cardHandler } = require("./handlers/cardHandler");
const { userHandler } = require("./handlers/userHandler");
const { notificationHandler } = require("./handlers/notificationHandler");
const { teamHandler } = require("./handlers/teamHandler");
const { guardJwt } = require("./services/guardService");

const routes = [
  {
    method: "get",
    path: "/healthz",
    handler: (request, h) => {
      return "Kanbaneon API server is healthy";
    },
  },
  {
    method: "post",
    path: "/api/v1/login",
    handler: loginHandler,
  },
  {
    method: "post",
    path: "/api/v1/signup",
    handler: signUpHandler,
  },
  {
    method: "post",
    path: "/api/v1/reauth",
    handler: reauthHandler,
  },
  {
    method: "post",
    path: "/api/v1/recovery",
    handler: recoveryHandler.sendEmail,
  },
  {
    method: "post",
    path: "/api/v1/recovery/{token}",
    handler: recoveryHandler.validateToken,
  },
  {
    method: "post",
    path: "/api/v1/recovery/password",
    handler: recoveryHandler.changePassword,
  },
  {
    method: "post",
    path: "/api/v1/recovery/in-app/password",
    handler: (req, h) => guardJwt(req, h, recoveryHandler.changePassword),
  },
  {
    method: "post",
    path: "/api/v1/users/{username}/delete",
    handler: (req, h) => guardJwt(req, h, userHandler.delete),
  },
  {
    method: "get",
    path: "/api/v1/profile",
    handler: (req, h) => guardJwt(req, h, profileHandler.get),
  },
  {
    method: "get",
    path: "/api/v1/profiles",
    handler: (req, h) => guardJwt(req, h, profileHandler.getMany),
  },
  {
    method: "get",
    path: "/api/v1/profiles/{searchText}",
    handler: (req, h) => guardJwt(req, h, profileHandler.searchMany),
  },
  {
    method: "post",
    path: "/api/v1/profile/picture",
    config: {
      payload: {
        maxBytes: 1000 * 1000 * 10, // 10 Mb
        parse: true,
        output: "stream",
        allow: ["multipart/form-data"],
        multipart: true,
      },
    },
    handler: (req, h) => guardJwt(req, h, profileHandler.uploadPicture),
  },
  {
    method: "delete",
    path: "/api/v1/profile/picture",
    handler: (req, h) => guardJwt(req, h, profileHandler.deletePicture),
  },
  {
    method: "put",
    path: "/api/v1/profile/username",
    handler: (req, h) => guardJwt(req, h, profileHandler.changeUsername),
  },
  {
    method: "put",
    path: "/api/v1/profile",
    handler: (req, h) => guardJwt(req, h, profileHandler.put),
  },
  {
    method: "get",
    path: "/api/v1/notification",
    handler: (req, h) => guardJwt(req, h, notificationHandler.get),
  },
  {
    method: "put",
    path: "/api/v1/notification",
    handler: (req, h) => guardJwt(req, h, notificationHandler.put),
  },
  {
    method: "get",
    path: "/api/v1/boards",
    handler: (req, h) => guardJwt(req, h, boardHandler.get),
  },
  {
    method: "get",
    path: "/api/v1/teams/{teamId}/boards",
    handler: (req, h) => guardJwt(req, h, boardHandler.getTeamBoards),
  },
  {
    method: "post",
    path: "/api/v1/teams/{teamId}/boards",
    handler: (req, h) => guardJwt(req, h, boardHandler.postTeamBoard),
  },
  {
    method: "post",
    path: "/api/v1/boards",
    handler: (req, h) => guardJwt(req, h, boardHandler.post),
  },
  {
    method: "post",
    path: "/api/v1/boards/{boardId}/lists",
    handler: (req, h) => guardJwt(req, h, listHandler.post),
  },
  {
    method: "post",
    path: "/api/v1/boards/{boardId}/swap-lists",
    handler: (req, h) => guardJwt(req, h, listHandler.swap),
  },
  {
    method: "post",
    path: "/api/v1/boards/{boardId}/swap-cards-external",
    handler: (req, h) => guardJwt(req, h, cardHandler.swapExternal),
  },
  {
    method: "post",
    path: "/api/v1/boards/{boardId}/swap-cards-internal/{listId}",
    handler: (req, h) => guardJwt(req, h, cardHandler.swapInternal),
  },
  {
    method: "post",
    path: "/api/v1/boards/{boardId}/lists/{listId}/cards",
    handler: (req, h) => guardJwt(req, h, cardHandler.post),
  },
  {
    method: "get",
    path: "/api/v1/boards/{boardId}",
    handler: (req, h) => guardJwt(req, h, boardHandler.getById),
  },
  {
    method: "put",
    path: "/api/v1/boards/{boardId}",
    handler: (req, h) => guardJwt(req, h, boardHandler.putById),
  },
  {
    method: "put",
    path: "/api/v1/boards/{boardId}/lists/{listId}",
    handler: (req, h) => guardJwt(req, h, listHandler.putById),
  },
  {
    method: "put",
    path: "/api/v1/boards/{boardId}/lists/{listId}/cards/{cardId}",
    handler: (req, h) => guardJwt(req, h, cardHandler.putById),
  },
  {
    method: "delete",
    path: "/api/v1/boards/{boardId}",
    handler: (req, h) => guardJwt(req, h, boardHandler.deleteById),
  },
  {
    method: "delete",
    path: "/api/v1/boards/{boardId}/lists/{listId}",
    handler: (req, h) => guardJwt(req, h, listHandler.deleteById),
  },
  {
    method: "delete",
    path: "/api/v1/boards/{boardId}/lists/{listId}/cards/{cardId}",
    handler: (req, h) => guardJwt(req, h, cardHandler.deleteById),
  },
  {
    method: "get",
    path: "/api/v1/teams",
    handler: (req, h) => guardJwt(req, h, teamHandler.get),
  },
  {
    method: "post",
    path: "/api/v1/teams",
    handler: (req, h) => guardJwt(req, h, teamHandler.post),
  },
  {
    method: "get",
    path: "/api/v1/teams/{teamId}",
    handler: (req, h) => guardJwt(req, h, teamHandler.getById),
  },
  {
    method: "put",
    path: "/api/v1/teams/{teamId}",
    handler: (req, h) => guardJwt(req, h, teamHandler.putById),
  },
  {
    method: "delete",
    path: "/api/v1/teams/{teamId}",
    handler: (req, h) => guardJwt(req, h, teamHandler.deleteById),
  },
  {
    method: "post",
    path: "/api/v1/teams/{teamId}/members",
    handler: (req, h) => guardJwt(req, h, teamHandler.addMember),
  },
  {
    method: "delete",
    path: "/api/v1/teams/{teamId}/members/{userId}",
    handler: (req, h) => guardJwt(req, h, teamHandler.removeMember),
  },
];

module.exports = routes;
