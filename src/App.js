import React, { useState, useEffect } from "react";
import topImage from "./assets/top.png";
import bottomImage from "./assets/bottom.png";

import "./App.css";

const App = () => {
  const [clips, setClips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentLayer, setCurrentLayer] = useState(1);
  const [totalLayers, setTotalLayers] = useState(2);
  const [selectedClips, setSelectedClips] = useState({});
  const [clipRestrictions, setClipRestrictions] = useState({});

  // Function to reset the app to its initial state
  const resetApp = () => {
    setCurrentLayer(1);
    setSelectedClips({});
    setClipRestrictions({});
    setClips([]);
    setLoading(true);
  };

  // Fetch clips for the given layer
  const fetchClipsForLayer = (layerIndex) => {
    setLoading(true);
    fetch(process.env.REACT_APP_API_BASE_URL)
      .then((response) => {
        if (!response.ok) {
          throw new Error(`Error fetching composition: ${response.statusText}`);
        }
        return response.json();
      })
      .then((data) => {
        setTotalLayers(data.layers.length);

        const layer = data.layers.find(
          (layer, index) => index + 1 === layerIndex
        );
        if (layer) {
          let validClips = layer.clips || [];

          if (clipRestrictions[layerIndex]) {
            validClips = validClips.filter((clip, index) =>
              clipRestrictions[layerIndex].includes(index + 1)
            );
          }

          setClips(validClips);
        } else {
          console.warn(`Layer ${layerIndex} not found!`);
          setClips([]);
        }
        setLoading(false);
      })
      .catch((error) => {
        console.error("Failed to fetch composition:", error);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchClipsForLayer(currentLayer);
  }, [currentLayer, clipRestrictions]);

  const handleClipClick = async (clipId, clipIndex) => {
    try {
      // Step 1: Clear the previous choice by "clicking" clip 10 in the current layer
      await fetch(
        `${process.env.REACT_APP_API_BASE_URL}/layers/${currentLayer}/clips/10/connect`,
        { method: "POST" }
      );
      console.log(
        `Cleared previous selection in layer ${currentLayer} by clicking clip 10.`
      );

      // Step 2: Select the new clip in the current layer
      const response = await fetch(
        `${process.env.REACT_APP_API_BASE_URL}/layers/${currentLayer}/clips/${clipIndex}/connect`,
        { method: "POST" }
      );

      if (response.ok) {
        console.log("Clip connected to composition successfully!");

        // Update the selected clip for the current layer
        setSelectedClips((prev) => ({
          ...prev,
          [currentLayer]: clipId,
        }));

        // Handle special behavior for specific layers
        if (currentLayer === 3) {
          if (clipIndex !== 2) {
            resetApp(); // Restart app if any clip other than the second is chosen
            return;
          } else {
            setCurrentLayer(4); // Proceed to layer 4
            return;
          }
        }

        if (currentLayer === 4) {
          resetApp(); // Restart app after any choice in layer 4
          return;
        }

        // Apply restrictions for the next layer if applicable
        if (currentLayer === 2) {
          if (clipIndex === 1) {
            setClipRestrictions((prev) => ({
              ...prev,
              3: [1, 2],
            }));
          } else if (clipIndex === 2) {
            setClipRestrictions((prev) => ({
              ...prev,
              3: [2, 3],
            }));
          }
        }

        // Step 3: Move to the next layer
        const nextLayer = (currentLayer % totalLayers) + 1;
        setCurrentLayer(nextLayer);
      } else {
        console.error("Failed to connect the clip to composition");
      }
    } catch (error) {
      console.error("Error handling clip click:", error);
    }
  };

  const title =
    currentLayer === 1
      ? "Click to start"
      : `What will you choose ${currentLayer}`;

  return (
    <>
      <img src={topImage} alt="Top Banner" className="top-image" />

      <div className="wrapper">
        <h1 className="Titel">{title}</h1>

        {loading ? (
          <p>Loading clips...</p>
        ) : (
          <div className="choice_wrapper">
            {clips.length > 0 ? (
              clips
                .filter((clip) => clip.name?.value?.trim())
                .map((clip, index) => (
                  <button
                    key={clip.id}
                    className={`choice ${
                      selectedClips[currentLayer] === clip.id ? "selected" : ""
                    }`}
                    onClick={() => handleClipClick(clip.id, index + 1)}
                  >
                    {clip.name?.value}
                  </button>
                ))
            ) : (
              <p>No clips available for this layer.</p>
            )}
          </div>
        )}
      </div>
      <img src={bottomImage} alt="Bottom Banner" className="bottom-image" />
    </>
  );
};

export default App;
