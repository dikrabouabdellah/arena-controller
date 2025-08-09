import React, { useState, useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import "./VotingApp.css";
import "./QRController.css";

// Layer-based clip durations (in seconds)
const CLIP_DURATIONS = {
  1: [106],
  2: [3, 5],
  3: [1, 9, 3],
  4: [4, 1],
};

const VotingApp = () => {
  const { sessionId } = useParams();
  const [voted, setVoted] = useState(false);
  const [selected, setSelected] = useState(null);
  const [votes, setVotes] = useState({});
  const votesRef = useRef({}); // Ref to keep latest votes
  const [clips, setClips] = useState([]);
  const [votingStarted, setVotingStarted] = useState(false);
  const [timer, setTimer] = useState(15);
  const [showWaiting, setShowWaiting] = useState(false);
  const [layerIndex, setLayerIndex] = useState(1);

  const userId =
    localStorage.getItem("userId") ||
    `user_${Math.random().toString(36).slice(2)}`;
  localStorage.setItem("userId", userId);

  const handleVote = (clipId, clipName) => {
    const userId =
      localStorage.getItem("userId") ||
      `user_${Math.random().toString(36).slice(2)}`;
    localStorage.setItem("userId", userId);

    console.log(`🔼 Voting: ${clipName} (ID: ${clipId})`);

    fetch(`${process.env.REACT_APP_BACKEND_URL}/vote`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sessionId,
        layerIndex,
        userId,
        clipId,
      }),
    });

    setSelected(clipName);
    setVoted(true);
  };

  useEffect(() => {
    fetch(process.env.REACT_APP_API_BASE_URL)
      .then((res) => res.json())
      .then((data) => {
        const layer = data.layers[layerIndex - 1];

        let validClips = (layer?.clips || [])
          .map((clip, index) => ({ ...clip, columnIndex: index + 1 }))
          .filter((clip) => clip.name?.value?.trim());

        // Branching logic for layer 3
        if (layerIndex === 3) {
          const pathChoice = Number(
            localStorage.getItem("path_choice_from_layer2")
          );
          const allowedClipIndices =
            pathChoice === 0 ? [0, 1] : pathChoice === 1 ? [1, 2] : [];

          validClips = validClips.filter((clip) =>
            allowedClipIndices.includes(clip.columnIndex - 1)
          );
        }

        setClips(validClips);
        setVotes({});
        setSelected(null);
        setVoted(false);
        setTimer(15);
        localStorage.removeItem(`triggered_${sessionId}_${layerIndex}`);
      })
      .catch((err) => console.error("Error fetching clips:", err));
  }, [layerIndex]);

  useEffect(() => {
    const checkStart = () => {
      fetch(`${process.env.REACT_APP_BACKEND_URL}/session-status/${sessionId}`)
        .then((res) => res.json())
        .then((data) => setVotingStarted(data.started))
        .catch((err) => console.error("Error checking session:", err));
    };

    checkStart();
    const interval = setInterval(checkStart, 1000);
    return () => clearInterval(interval);
  }, [sessionId]);

  useEffect(() => {
    const updateVotes = () => {
      fetch(
        `${process.env.REACT_APP_BACKEND_URL}/votes/${sessionId}/${layerIndex}`
      )
        .then((res) => res.json())
        .then((voteData) => {
          const tally = {};
          Object.values(voteData).forEach((clipId) => {
            tally[clipId] = (tally[clipId] || 0) + 1;
          });
          setVotes(tally);
        });
    };

    updateVotes();
    const interval = setInterval(updateVotes, 1000);
    return () => clearInterval(interval);
  }, [sessionId, layerIndex]);

  // Keep votesRef updated with latest votes
  useEffect(() => {
    votesRef.current = votes;
  }, [votes]);

  useEffect(() => {
    if (!votingStarted || clips.length === 0) return;

    const countdown = setInterval(() => {
      setTimer((prev) => {
        if (prev <= 1) {
          clearInterval(countdown);
          if (!localStorage.getItem(`triggered_${sessionId}_${layerIndex}`)) {
            console.log("Votes at trigger:", votesRef.current);
            triggerMajorityClip();
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

    const clipIndex = Number(localStorage.getItem("last_clip_index") || 0);
    const layerDurations = CLIP_DURATIONS[layerIndex] || [];
    const duration = layerDurations[clipIndex] || 15;

    const timeout = setTimeout(() => {
      const nextLayerIndex =
        layerIndex === 3 ? (clipIndex === 1 ? 4 : 5) : layerIndex + 1;

      localStorage.removeItem(`votes_${sessionId}_${layerIndex}`);
      localStorage.removeItem(`triggered_${sessionId}_${layerIndex}`);
      localStorage.removeItem("last_clip_index");

      setVoted(false);
      setSelected(null);
      setShowWaiting(false);
      setTimer(15);
      setLayerIndex(nextLayerIndex);
    }, duration * 1000);

    return () => clearTimeout(timeout);
  }, [showWaiting, sessionId, layerIndex]);

  const getMajorityClipId = () => {
    const votesData = votesRef.current; // use latest votes from ref
    const sorted = Object.entries(votesData).sort((a, b) => b[1] - a[1]);
    return sorted[0]?.[0];
  };

  const getMajorityClipName = () => {
    const majorityId = getMajorityClipId();
    const clip = clips.find((clip) => clip.id === majorityId);
    return clip?.name?.value || "-";
  };

  const triggerMajorityClip = async () => {
    console.log("Triggering clip now");

    const majorityClipId = getMajorityClipId();
    if (!majorityClipId) {
      console.log("No majority clip ID found.");
      return;
    }

    const votedClip = clips.find(
      (clip) => String(clip.id) === String(majorityClipId)
    );

    if (!votedClip) {
      console.log("Majority clip not found in clips list.");
      return;
    }

    if (typeof votedClip.columnIndex === "number") {
      const index = votedClip.columnIndex - 1;
      localStorage.setItem("last_clip_index", index);
      console.log("✅ Stored last_clip_index:", index);
    }

    if (layerIndex === 2) {
      localStorage.setItem(
        "path_choice_from_layer2",
        votedClip.columnIndex - 1
      );
    }

    try {
      // Trigger column 10 across all layers
      for (let layer = 1; layer <= 5; layer++) {
        await fetch(
          `${process.env.REACT_APP_API_BASE_URL}/layers/${layer}/clips/10/connect`,
          { method: "POST" }
        );
      }

      // Trigger the voted clip
      await fetch(
        `${process.env.REACT_APP_API_BASE_URL}/layers/${layerIndex}/clips/${votedClip.columnIndex}/connect`,
        { method: "POST" }
      );
    } catch (error) {
      console.error("Error triggering clips:", error);
    }

    setShowWaiting(true);
  };

  return (
    <div className="wrapper">
      <img src={require("./assets/top.png")} alt="Top" className="top-image" />
      <div className="vote-page">
        <h2>Vote for the Next Scene</h2>
        <p>Time left: {timer} seconds</p>

        {!votingStarted ? (
          <p>Waiting for the session to start...</p>
        ) : showWaiting ? (
          <p>Waiting for next round to begin...</p>
        ) : !voted ? (
          clips.map((clip) => (
            <button
              key={clip.id}
              onClick={() => handleVote(clip.id, clip.name.value)}
            >
              {clip.name.value}
            </button>
          ))
        ) : (
          <p className="voted-message">
            You voted for <strong>{selected}</strong>. <br /> <br />
            Waiting for others...
          </p>
        )}

        <div className="tally">
          <h3>Live Results:</h3>
          {Object.entries(votes).map(([clipId, count]) => {
            const clip = clips.find((c) => String(c.id) === String(clipId));
            const label = clip?.name?.value || "Unknown";
            return (
              <p key={clipId}>
                {label}: {count}
              </p>
            );
          })}
        </div>
      </div>
      <img
        src={require("./assets/bottom.png")}
        alt="Bottom"
        className="bottom-image"
      />
    </div>
  );
};

export default VotingApp;
