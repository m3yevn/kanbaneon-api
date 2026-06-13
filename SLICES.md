# Kanbaneon API — Vertical Slices

Jira-inspired project management API (Hapi + MongoDB).

## Done

| Slice | Endpoints / behavior |
|-------|----------------------|
| **Auth & users** | JWT sign-up/in, profiles, user delete cascades |
| **Boards & cards** | CRUD, drag-drop swap internal/external, watchers |
| **Teams** | CRUD, members, `GET/POST /teams/{id}/boards` |
| **Board access** | Owner, `hasAccess[]`, team membership |
| **Organizations** | CRUD, members, `GET/POST /organizations/{id}/boards` |
| **Jira issues** | `projectKey`, `issueKey` (`KAN-1`), type, priority, assignee on cards |

## Next slices

| # | Slice | Scope |
|---|-------|-------|
| 4 | **Sprints** | Sprint entity, backlog vs active sprint columns |
| 5 | **Issue search** | `GET /issues?q=` filter by key, type, assignee |
| 6 | **Epic linking** | Parent epic on cards, epic board rollup |
| 7 | **Comments & activity** | Issue comments, audit log |
| 8 | **Notifications** | Webhooks / email on assignee change |
| 9 | **Permissions** | Org roles (admin/member/viewer), project-level ACL |

## Data model (Jira)

```
Organization
  └── Teams (organizationId)
  └── Projects / Boards (organizationId, projectKey, issueCounter)
        └── Lists (Backlog, To Do, In Progress, In Review, Done)
              └── Cards / Issues (issueKey, issueType, priority, assignee)
```
