import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";

const VotingApp = () => {
  const { sessionId } = useParams(); // get session from URL
  const [voted, setVoted] = useState(false);
  const [selected, setSelected] = useState(null);
  const [votes, setVotes] = useState({});
  const choices = ["Scene A", "Scene B", "Scene C"]; // customize this

  const handleVote = (choice) => {
    const voteData = JSON.parse(localStorage.getItem(sessionId)) || {};
    const userId = `user_${Math.random().toString(36).slice(2)}`;
    voteData[userId] = choice;
    localStorage.setItem(sessionId, JSON.stringify(voteData));
    setSelected(choice);
    setVoted(true);
  };

  useEffect(() => {
    const interval = setInterval(() => {
      const voteData = JSON.parse(localStorage.getItem(sessionId)) || {};
      const tally = {};
      Object.values(voteData).forEach((vote) => {
        tally[vote] = (tally[vote] || 0) + 1;
      });
      setVotes(tally);
    }, 1000);

    return () => clearInterval(interval);
  }, [sessionId]);

  const getMajorityVote = () => {
    const sorted = Object.entries(votes).sort((a, b) => b[1] - a[1]);
    return sorted[0]?.[0] || "N/A";
  };

  return (
    <div className="vote-page">
      <h2>Vote for the Next Scene</h2>

      {!voted ? (
        choices.map((choice) => (
          <button key={choice} onClick={() => handleVote(choice)}>
            {choice}
          </button>
        ))
      ) : (
        <p>
          You voted for <strong>{selected}</strong>. Waiting for others...
        </p>
      )}

      <div className="tally">
        <h3>Live Results</h3>
        {Object.entries(votes).map(([option, count]) => (
          <p key={option}>
            {option}: {count}
          </p>
        ))}
        <p>
          <strong>Majority:</strong> {getMajorityVote()}
        </p>
      </div>
    </div>
  );
};

export default VotingApp;
