import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";

const VotingApp = () => {
  const { sessionId } = useParams(); // get session from URL
  const [voted, setVoted] = useState(false);
  const [selected, setSelected] = useState(null);
  const [votes, setVotes] = useState({});
  const [clips, setClips] = useState([]);
  const [votingStarted, setVotingStarted] = useState(false);
  const [timer, setTimer] = useState(30);
  const [showWaiting, setShowWaiting] = useState(false);
  const [layerIndex, setLayerIndex] = useState(1);

  const handleVote = (clipId, clipName) => {
    const userId =
      localStorage.getItem("userId") ||
      `user_${Math.random().toString(36).slice(2)}`;
    localStorage.setItem("userId", userId);

    const voteKey = `votes_${sessionId}_${layerIndex}`;
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
        const layer = data.layers[layerIndex - 1];
        const validClips = (layer?.clips || []).filter((clip) =>
          clip.name?.value?.trim()
        );
        setClips(validClips);
        setVotes({});
        setSelected(null);
        setVoted(false);
        setTimer(30);
        localStorage.removeItem(`triggered_${sessionId}`);
      })
      .catch((err) => console.error("Error fetching clips:", err));
  }, [layerIndex]);

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
    const voteKey = `votes_${sessionId}_${layerIndex}`;

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
    if (!votingStarted || clips.length === 0) return;

    const countdown = setInterval(() => {
      setTimer((prev) => {
        if (prev <= 1) {
          clearInterval(countdown);
          if (!localStorage.getItem(`triggered_${sessionId}_${layerIndex}`)) {
            triggerMajorityClip(); // ✅ This now also handles waiting
            localStorage.setItem(
              `triggered_${sessionId}_${layerIndex}`,
              "true"
            );
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(countdown);
  }, [votingStarted, clips, sessionId, layerIndex]);

  useEffect(() => {
    if (!showWaiting) return;

    const wait = Number(localStorage.getItem("wait_time") || 15); // fallback 15s

    const timeout = setTimeout(() => {
      // Move to next layer (simulate new round)
      localStorage.removeItem(`votes_${sessionId}`);
      localStorage.removeItem(`triggered_${sessionId}`);
      setVoted(false);
      setSelected(null);
      setShowWaiting(false);
      setTimer(30);
      setLayerIndex((prev) => prev + 1);
    }, wait * 1000);

    return () => clearTimeout(timeout);
  }, [showWaiting, sessionId]);

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
    console.log("Triggering clip now");

    const voteKey = `votes_${sessionId}_${layerIndex}`;
    const voteData = JSON.parse(localStorage.getItem(voteKey)) || {};
    const tally = {};

    Object.values(voteData).forEach((clipId) => {
      tally[clipId] = (tally[clipId] || 0) + 1;
    });

    const sorted = Object.entries(tally).sort((a, b) => b[1] - a[1]);
    const majorityClipId = sorted[0]?.[0];

    if (!majorityClipId) {
      console.log("No majority clip ID found.");
      return;
    }

    const clipIndex = clips.findIndex(
      (clip) => String(clip.id) === String(majorityClipId)
    );

    if (clipIndex === -1) {
      console.log("Majority clip not found in clips list.");
      return;
    }

    try {
      const res = await fetch(
        `${process.env.REACT_APP_API_BASE_URL}/layers/${layerIndex}/clips/${
          clipIndex + 1
        }/connect`,
        {
          method: "POST",
        }
      );
      console.log(
        "Triggered Resolume clip:",
        majorityClipId,
        "Status:",
        res.status
      );
    } catch (error) {
      console.error("Error triggering Resolume clip:", error);
    }

    setShowWaiting(true);
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
      <p>⏱️ Time left: {timer} seconds</p>

      {!votingStarted ? (
        <p>⏳ Waiting for the session to start...</p>
      ) : showWaiting ? (
        <p>🕓 Waiting for next round to begin...</p>
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
