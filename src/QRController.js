import React, { useState, useEffect } from "react";
import { QRCode } from "react-qrcode-logo";

const QRController = () => {
  const [sessionId, setSessionId] = useState(() => {
    // Clean up old sessions
    Object.keys(localStorage).forEach((key) => {
      if (
        key.startsWith("votes_") ||
        key.startsWith("voting_started_") ||
        key.startsWith("triggered_") ||
        key === "sessionId"
      ) {
        localStorage.removeItem(key);
      }
    });

    return Date.now().toString();
  });

  const voteUrl = `${window.location.origin}/arena-controller/vote/${sessionId}`;
  const [started, setStarted] = useState(false);
  const [waitTime, setWaitTime] = useState(15); // default 15 seconds

  const startVoting = () => {
    localStorage.setItem(`voting_started_${sessionId}`, "true");
    setStarted(true);
  };

  useEffect(() => {
    localStorage.setItem("wait_time", waitTime);
  }, [waitTime]);

  useEffect(() => {
    localStorage.setItem("sessionId", sessionId);
  }, [sessionId]);

  return (
    <div className="qr-page">
      <h1>Scan to Vote</h1>
      <QRCode value={voteUrl} size={256} />
      <p>
        Session ID: <strong>{sessionId}</strong>
      </p>

      {!started ? (
        <button onClick={startVoting}>Start Voting</button>
      ) : (
        <p>✅ Voting started! Waiting for votes...</p>
      )}
    </div>
  );
};

export default QRController;
