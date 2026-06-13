const ISSUE_TYPES = ["story", "task", "bug", "epic"];
const PRIORITIES = ["highest", "high", "medium", "low", "lowest"];

const normalizeIssueFields = (card, board) => {
  const projectKey = board.projectKey || "KAN";
  const issueNumber = (board.issueCounter || 0) + 1;

  return {
    ...card,
    issueKey: `${projectKey}-${issueNumber}`,
    issueNumber,
    issueType: ISSUE_TYPES.includes(card.issueType) ? card.issueType : "task",
    priority: PRIORITIES.includes(card.priority) ? card.priority : "medium",
    assigneeId: card.assigneeId || null,
    assigneeUsername: card.assigneeUsername || null,
    status: card.status || null,
  };
};

const incrementIssueCounter = async (req, boardId) => {
  const collection = req.mongo.db.collection("boards");
  const result = await collection.findOneAndUpdate(
    { id: boardId },
    { $inc: { issueCounter: 1 }, $currentDate: { lastModified: true } },
    { returnDocument: "after" }
  );
  return result.value;
};

const prepareNewIssue = async (req, boardId, card) => {
  const collection = req.mongo.db.collection("boards");
  const board = await collection.findOne({ id: boardId });
  if (!board) {
    return { error: "Board not found" };
  }

  const issueNumber = (board.issueCounter || 0) + 1;
  const projectKey = board.projectKey || "KAN";

  await collection.updateOne(
    { id: boardId },
    { $set: { issueCounter: issueNumber }, $currentDate: { lastModified: true } }
  );

  return {
    card: {
      ...card,
      issueKey: `${projectKey}-${issueNumber}`,
      issueNumber,
      issueType: ISSUE_TYPES.includes(card.issueType) ? card.issueType : "task",
      priority: PRIORITIES.includes(card.priority) ? card.priority : "medium",
      assigneeId: card.assigneeId || null,
      assigneeUsername: card.assigneeUsername || null,
      sprintId: card.sprintId || null,
      epicId: card.epicId || null,
      parentEpicKey: card.parentEpicKey || null,
      comments: card.comments || [],
      backlogRank: card.backlogRank ?? null,
    },
    board: { ...board, issueCounter: issueNumber },
  };
};

const getJiraDefaultLists = () => [
  { id: "backlog", name: "Backlog", children: [] },
  { id: "todo", name: "To Do", children: [] },
  { id: "in-progress", name: "In Progress", children: [] },
  { id: "in-review", name: "In Review", children: [] },
  { id: "done", name: "Done", children: [] },
];

module.exports = {
  ISSUE_TYPES,
  PRIORITIES,
  normalizeIssueFields,
  incrementIssueCounter,
  prepareNewIssue,
  getJiraDefaultLists,
};
