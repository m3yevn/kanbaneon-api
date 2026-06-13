const isBacklogList = (list) =>
  list?.name === "Backlog" || list?.id === "backlog";

const isTodoList = (list) =>
  list?.name === "To Do" || list?.id === "todo";

const findBacklogList = (kanbanList) =>
  (kanbanList || []).find(isBacklogList);

const findTodoList = (kanbanList) =>
  (kanbanList || []).find(isTodoList);

const findCardInBoard = (board, cardId) => {
  for (const list of board.kanbanList || []) {
    const card = (list.children || []).find((c) => c.id === cardId);
    if (card) {
      return { list, card };
    }
  }
  return null;
};

const ensureBoardSprints = (board) => ({
  ...board,
  sprints: board.sprints || [],
  activeSprintId: board.activeSprintId || null,
});

module.exports = {
  isBacklogList,
  isTodoList,
  findBacklogList,
  findTodoList,
  findCardInBoard,
  ensureBoardSprints,
};
