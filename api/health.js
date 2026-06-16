module.exports = (_req, res) => {
  res.setHeader("Content-Type", "application/json");
  res.status(200).json({
    success: true,
    status: "healthy",
    service: "kanbaneon-api",
    note: "Use /healthz on the Hapi server for full DB checks when running locally.",
  });
};
