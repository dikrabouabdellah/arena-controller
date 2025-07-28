import React from "react";
import { QRCode } from "react-qrcode-logo";

const QRController = () => {
  const sessionId = Date.now(); // This creates a unique session ID
  const voteUrl = `${window.location.origin}/vote/${sessionId}`;

  return (
    <div className="qr-page">
      <h1>Scan to Vote</h1>
      <QRCode value={voteUrl} size={256} />
      <p>
        Session ID: <strong>{sessionId}</strong>
      </p>
    </div>
  );
};

export default QRController;
