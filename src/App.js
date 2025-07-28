import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import QRController from "./QRController";
import VotingApp from "./VotingApp";

const App = () => {
  return (
    <Router basename="/arena-controller">
      <Routes>
        <Route path="/" element={<QRController />} />
        <Route path="/vote/:sessionId" element={<VotingApp />} />
      </Routes>
    </Router>
  );
};

export default App;
