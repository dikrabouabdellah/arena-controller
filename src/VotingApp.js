import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";

// Layer-based clip durations (in seconds)
const CLIP_DURATIONS = {
  1: [2],
  2: [3, 5],
  3: [1, 9, 3],
  4: [4, 1],
};

const VotingApp = () => {
  const { sessionId } = useParams(); // get session from URL
  const [voted, setVoted] = useState(false);
  const [selected, setSelected] = useState(null);
  const [votes, setVotes] = useState({});
  const [clips, setClips] = useState([]);
  const [votingStarted, setVotingStarted] = useState(false);
  const [timer, setTimer] = useState(15);
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
        let validClips = (layer?.clips || []).filter((clip) =>
          clip.name?.value?.trim()
        );

        // Layer 3 branching logic
        if (layerIndex === 3) {
          const pathChoice = Number(
            localStorage.getItem("path_choice_from_layer2")
          );

          if (pathChoice === 0) {
            // Voted Clip 1 in Layer 2 → show Clip 1 & 2 of Layer 3
            validClips = validClips.slice(0, 2);
          } else if (pathChoice === 1) {
            // Voted Clip 2 in Layer 2 → show Clip 2 & 3 of Layer 3
            validClips = validClips.slice(1, 3);
          }
        }

        setClips(validClips);

        setVotes({});
        setSelected(null);
        setVoted(false);
        setTimer(15);
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

    const clipIndex = Number(localStorage.getItem("last_clip_index") || 0);
    const layerDurations = CLIP_DURATIONS[layerIndex] || [];
    const duration = layerDurations[clipIndex] || 15; // fallback to 15s if not found

    console.log(
      `⏳ Waiting ${duration}s before next round (Layer ${layerIndex}, Clip #${
        clipIndex + 1
      })`
    );

    const timeout = setTimeout(() => {
      localStorage.removeItem(`votes_${sessionId}_${layerIndex}`);
      localStorage.removeItem(`triggered_${sessionId}_${layerIndex}`);
      localStorage.removeItem("last_clip_index");
      setVoted(false);
      setSelected(null);
      setShowWaiting(false);
      setTimer(15);
      setLayerIndex((prev) => prev + 1);
    }, duration * 1000);

    return () => clearTimeout(timeout);
  }, [showWaiting, sessionId, layerIndex]);

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

    // 🔁 Store selected clip index for logic (e.g., branching)
    localStorage.setItem("last_clip_index", clipIndex);
    if (layerIndex === 2) {
      localStorage.setItem("path_choice_from_layer2", clipIndex);
    }

    try {
      // ✅ 1. Trigger ALL clips in column 10 (across all layers)
      for (let layer = 1; layer <= 10; layer++) {
        await fetch(
          `${process.env.REACT_APP_API_BASE_URL}/layers/${layer}/clips/10/connect`,
          { method: "POST" }
        );
        console.log(`Triggered Layer ${layer}, Column 10`);
      }

      // ✅ 2. Trigger the majority clip in the current layer
      await fetch(
        `${process.env.REACT_APP_API_BASE_URL}/layers/${layerIndex}/clips/${
          clipIndex + 1
        }/connect`,
        { method: "POST" }
      );
      console.log(
        `Triggered voted clip: Layer ${layerIndex}, Clip ${clipIndex + 1}`
      );
    } catch (error) {
      console.error("Error triggering clips:", error);
    }

    console.log("✅ Clip triggered, entering waiting state...");
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
