import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";

const VotingApp = () => {
  const { sessionId } = useParams(); // get session from URL
  const [voted, setVoted] = useState(false);
  const [selected, setSelected] = useState(null);
  const [votes, setVotes] = useState({});
  const [clips, setClips] = useState([]);
  const [votingStarted, setVotingStarted] = useState(false);

  const layerIndex = 1;
  // Change this number to how many voters you're expecting
  const EXPECTED_VOTE_COUNT = 3;

  const handleVote = (clipId, clipName) => {
    const userId =
      localStorage.getItem("userId") ||
      `user_${Math.random().toString(36).slice(2)}`;
    localStorage.setItem("userId", userId);

    const voteKey = `votes_${sessionId}`;
    const voteData = JSON.parse(localStorage.getItem(voteKey)) || {};

    voteData[userId] = clipId;
    localStorage.setItem(voteKey, JSON.stringify(voteData));

    setSelected(clipName);
    setVoted(true);
  };

  useEffect(() => {
    fetch(process.env.REACT_APP_API_BASE_URL)
      .then((res) => res.json())
      .then((data) => {
        const layer = data.layers[layerIndex - 1]; // index is 0-based
        const validClips = (layer?.clips || []).filter((clip) =>
          clip.name?.value?.trim()
        );
        setClips(validClips);
      })
      .catch((err) => console.error("Error fetching clips:", err));
  }, []);

  useEffect(() => {
    const totalVotes = Object.keys(votes).length;

    if (totalVotes >= EXPECTED_VOTE_COUNT) {
      triggerMajorityClip();
    }
  }, [votes]);

  useEffect(() => {
    const checkStart = () => {
      const isStarted =
        localStorage.getItem(`voting_started_${sessionId}`) === "true";
      setVotingStarted(isStarted);
    };

    checkStart();
    const interval = setInterval(checkStart, 1000); // poll every second
    return () => clearInterval(interval);
  }, [sessionId]);

  useEffect(() => {
    const voteKey = `votes_${sessionId}`;

    const updateVotes = () => {
      const voteData = JSON.parse(localStorage.getItem(voteKey)) || {};
      const tally = {};

      Object.values(voteData).forEach((clipId) => {
        tally[clipId] = (tally[clipId] || 0) + 1;
      });

      setVotes(tally);
    };

    updateVotes();
    const interval = setInterval(updateVotes, 1000);
    return () => clearInterval(interval);
  }, [sessionId]);

  useEffect(() => {
    const voteIds = Object.keys(votes);
    if (voteIds.length >= EXPECTED_VOTE_COUNT) {
      // Prevent retriggering multiple times
      if (!localStorage.getItem(`triggered_${sessionId}`)) {
        triggerMajorityClip();
        localStorage.setItem(`triggered_${sessionId}`, "true");
      }
    }
  }, [votes, sessionId]);

  const getMajorityClipId = () => {
    const sorted = Object.entries(votes).sort((a, b) => b[1] - a[1]);
    return sorted[0]?.[0]; // This is the clipId
  };

  const getMajorityClipName = () => {
    const majorityId = getMajorityClipId();
    const clip = clips.find((clip) => clip.id === majorityId);
    return clip?.name?.value || "N/A";
  };

  const triggerMajorityClip = async () => {
    const majorityClipId = Object.entries(votes).sort(
      (a, b) => b[1] - a[1]
    )[0]?.[0];
    if (!majorityClipId) return;

    const clipIndex = clips.findIndex((clip) => clip.id === majorityClipId);
    if (clipIndex === -1) return;

    try {
      await fetch(
        `${process.env.REACT_APP_API_BASE_URL}/layers/${layerIndex}/clips/${
          clipIndex + 1
        }/connect`,
        {
          method: "POST",
        }
      );
      console.log("Triggered Resolume clip:", majorityClipId);
    } catch (error) {
      console.error("Error triggering Resolume clip:", error);
    }
  };

  const resetVoting = () => {
    localStorage.removeItem(`votes_${sessionId}`);
    localStorage.removeItem(`triggered_${sessionId}`);
    localStorage.removeItem(`voting_started_${sessionId}`);
    window.location.reload();
  };

  return (
    <div className="vote-page">
      <h2>Vote for the Next Scene</h2>

      {!votingStarted ? (
        <p>⏳ Waiting for the session to start...</p>
      ) : !voted ? (
        clips.map((clip, idx) => (
          <button
            key={clip.id}
            onClick={() => handleVote(clip.id, clip.name.value)}
          >
            {clip.name.value}
          </button>
        ))
      ) : (
        <p>
          You voted for <strong>{selected}</strong>. Waiting for others...
        </p>
      )}

      <div className="tally">
        <h3>Live Results</h3>
        {Object.entries(votes).map(([clipId, count]) => {
          const clip = clips.find((c) => c.id === clipId);
          const label = clip?.name?.value || "Unknown";
          return (
            <p key={clipId}>
              {label}: {count}
            </p>
          );
        })}
        <p>
          <strong>Majority:</strong> {getMajorityClipName()}
        </p>
      </div>
      <button onClick={resetVoting}>Reset Voting Session</button>
    </div>
  );
};

export default VotingApp;
