# Kanbaneon API

**REST API server for Kanbaneon** — Hapi.js + MongoDB.

Version 1.0.0 · by m3yevn

## Tech stack

| Layer | Stack |
|-------|-------|
| Framework | Hapi.js |
| Database | MongoDB |
| Auth | JWT (jsonwebtoken, bcrypt) |

## API areas

- **Auth** — login, signup, reauth, password recovery
- **Profile** — user details, avatar, username search
- **Boards** — CRUD, lists, cards, drag-and-drop swaps
- **Teams** — CRUD, members, team-scoped boards with `hasAccess` sync
- **Notifications** — watch lists for cards/boards

## Key endpoints

```
GET/POST        /api/v1/boards
GET/PUT/DELETE  /api/v1/boards/{boardId}
GET/POST        /api/v1/teams
GET/PUT/DELETE  /api/v1/teams/{teamId}
GET/POST        /api/v1/teams/{teamId}/boards
POST/DELETE     /api/v1/teams/{teamId}/members[/{userId}]
GET             /healthz
```

## Scripts

```sh
npm start        # Start server (see server.js)
```

## Environment

```env
MONGODB_URI=...
JWT_SECRET=...
```

## Issues

https://github.com/Kanbaneon/kanbaneon-api/issues

## License

ISC
