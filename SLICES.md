# Kanbaneon API — Vertical Slices

Jira-inspired project management API (Hapi + MongoDB).

## Done

| Slice | Endpoints / behavior |
|-------|----------------------|
| **Auth & users** | JWT sign-up/in, profiles, user delete cascades |
| **Boards & cards** | CRUD, drag-drop swap internal/external, watchers |
| **Teams** | CRUD, members, `GET/POST /teams/{id}/boards` |
| **Board access** | Owner, `hasAccess[]`, team membership |
| **Organizations** | CRUD, members, `GET/POST /organizations/{id}/boards`, `POST /organizations/{id}/teams` |
| **Jira issues** | `projectKey`, `issueKey`, type, priority, assignee on cards |
| **Backlog** | `GET /boards/{id}/backlog`, `POST .../backlog/reorder`, `backlogRank` on cards |
| **Sprints** | `GET/POST /boards/{id}/sprints`, assign, start, sprint issues |
| **Comments** | `GET/POST .../cards/{id}/comments` embedded on issues |

## Next slices

| # | Slice | Scope |
|---|-------|-------|
| 9 | **Issue search** | `GET /issues?q=` filter by key, type, assignee |
| 10 | **Epic linking** | Parent epic on cards, epic board rollup |
| 11 | **Activity log** | Audit trail beyond comments |
| 12 | **Notifications** | Webhooks / email on assignee change |
| 13 | **Permissions** | Org roles (admin/member/viewer), project-level ACL |

## Data model (Jira)

```
Organization
  └── Teams (organizationId)
  └── Projects / Boards (organizationId, projectKey, issueCounter)
        └── Lists (Backlog, To Do, In Progress, In Review, Done)
              └── Cards / Issues (issueKey, issueType, priority, assignee)
```
