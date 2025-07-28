import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";

const VotingApp = () => {
  const { sessionId } = useParams(); // get session from URL
  const [voted, setVoted] = useState(false);
  const [selected, setSelected] = useState(null);
  const [votes, setVotes] = useState({});
  const [clips, setClips] = useState([]);

  const layerIndex = 1;

  const handleVote = (clipId, clipName) => {
    const voteData = JSON.parse(localStorage.getItem(sessionId)) || {};
    const userId = `user_${Math.random().toString(36).slice(2)}`;
    voteData[userId] = clipId;
    localStorage.setItem(sessionId, JSON.stringify(voteData));
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

    // Change this number to how many voters you're expecting
    const EXPECTED_VOTE_COUNT = 3;

    if (totalVotes >= EXPECTED_VOTE_COUNT) {
      triggerMajorityClip();
    }
  }, [votes]);

  // Get the most voted clipId
  const getMajorityClipId = () => {
    const sorted = Object.entries(votes).sort((a, b) => b[1] - a[1]);
    return sorted[0]?.[0]; // This is the clipId
  };

  const getMajorityClipName = () => {
    const majorityId = getMajorityClipId();
    const clip = clips.find((clip) => clip.id === majorityId);
    return clip?.name?.value || "N/A";
  };

  // Trigger the majority clip via Resolume API
  const triggerMajorityClip = async () => {
    const clipId = getMajorityClipId();
    if (!clipId) return;

    // Find index of this clip in the current clips array
    const index = clips.findIndex((clip) => clip.id === clipId);
    if (index === -1) return;

    try {
      await fetch(
        `${process.env.REACT_APP_API_BASE_URL}/layers/${layerIndex}/clips/${
          index + 1
        }/connect`,
        { method: "POST" }
      );
      console.log("🎬 Triggered Resolume clip:", clipId);
    } catch (error) {
      console.error("❌ Error triggering Resolume clip:", error);
    }
  };

  return (
    <div className="vote-page">
      <h2>Vote for the Next Scene</h2>

      {!voted ? (
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
        {Object.entries(votes).map(([option, count]) => (
          <p key={option}>
            {option}: {count}
          </p>
        ))}
        <p>
          <strong>Majority:</strong> {getMajorityClipName()}
        </p>
      </div>
    </div>
  );
};

export default VotingApp;
