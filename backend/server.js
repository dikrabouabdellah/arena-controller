// backend/server.js
const express = require("express");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

const PORT = 4000;

// In-memory session store
const sessionState = {};

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

app.listen(PORT, () => {
  console.log(`✅ Backend server running at http://localhost:${PORT}`);
});
