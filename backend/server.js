// backend/server.js
const express = require("express");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

const PORT = 4000;

// In-memory session store
const sessionState = {};

const votes = {};

// Start a session
app.post("/start-session/:sessionId", (req, res) => {
  const { sessionId } = req.params;
  sessionState[sessionId] = { started: true };
  res.sendStatus(200);
});

// Get session status
app.get("/session-status/:sessionId", (req, res) => {
  const { sessionId } = req.params;
  const started = sessionState[sessionId]?.started || false;
  res.json({ started });
});

// POST /vote
// Body: { sessionId, layerIndex, userId, clipId }

app.post("/vote", (req, res) => {
  const { sessionId, layerIndex, userId, clipId } = req.body;
  const key = `${sessionId}_${layerIndex}`;

  if (!votes[key]) votes[key] = {};
  votes[key][userId] = clipId;

  res.json({ success: true });
});

// GET /votes/:sessionId/:layerIndex
app.get("/votes/:sessionId/:layerIndex", (req, res) => {
  const key = `${req.params.sessionId}_${req.params.layerIndex}`;
  res.json(votes[key] || {});
});

app.listen(PORT, () => {
  console.log(`✅ Backend server running at http://localhost:${PORT}`);
});
