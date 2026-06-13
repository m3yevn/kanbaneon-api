const { requireBoardAccess } = require("./boardAccessService");

const flattenIssues = (board) => {
  const issues = [];
  (board.kanbanList || []).forEach((list) => {
    (list.children || []).forEach((card) => {
      issues.push({
        ...card,
        listId: list.id,
        listName: list.name,
      });
    });
  });
  return issues;
};

const matchesQuery = (issue, q) => {
  if (!q) return true;
  const needle = q.toLowerCase();
  return (
    (issue.title || "").toLowerCase().includes(needle) ||
    (issue.text || "").toLowerCase().includes(needle) ||
    (issue.issueKey || "").toLowerCase().includes(needle) ||
    (issue.assigneeUsername || "").toLowerCase().includes(needle)
  );
};

const searchIssues = async (req, boardId, filters, userId) => {
  try {
    const access = await requireBoardAccess(req, boardId, userId);
    if (access.error) {
      return access.error;
    }

    const {
      q,
      issueType,
      priority,
      assigneeId,
      sprintId,
      epicId,
      listName,
    } = filters;

    let issues = flattenIssues(access.board);

    if (q) issues = issues.filter((i) => matchesQuery(i, q));
    if (issueType) issues = issues.filter((i) => i.issueType === issueType);
    if (priority) issues = issues.filter((i) => i.priority === priority);
    if (assigneeId) {
      issues = issues.filter((i) => String(i.assigneeId) === String(assigneeId));
    }
    if (sprintId) issues = issues.filter((i) => i.sprintId === sprintId);
    if (epicId) issues = issues.filter((i) => i.epicId === epicId);
    if (listName) {
      issues = issues.filter(
        (i) => i.listName?.toLowerCase() === listName.toLowerCase()
      );
    }

    return {
      success: true,
      count: issues.length,
      issues,
      filters,
    };
  } catch (ex) {
    const Boom = require("boom");
    return Boom.notImplemented("Searching issues failed", ex);
  }
};

module.exports = { searchIssues, flattenIssues };
