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
  const [preparingSelection, setPreparingSelection] = useState(false);

  const resetApp = () => {
    setCurrentLayer(1);
    setSelectedClips({});
    setClipRestrictions({});
    setClips([]);
    setLoading(true);
    setPreparingSelection(false);
  };

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

  const selectClip10InAllLayers = async () => {
    setPreparingSelection(true);
    try {
      // Select clip 10 in ALL layers (1 through totalLayers)
      for (let layer = 1; layer <= totalLayers; layer++) {
        const response = await fetch(
          `${process.env.REACT_APP_API_BASE_URL}/layers/${layer}/clips/10/connect`,
          { method: "POST" }
        );
        if (!response.ok) {
          console.warn(`Failed to select clip 10 in layer ${layer}`);
        } else {
          console.log(`Selected clip 10 in layer ${layer}`);
        }
      }
      return true;
    } catch (error) {
      console.error("Error selecting clip 10 in layers:", error);
      return false;
    } finally {
      setPreparingSelection(false);
    }
  };

  const handleClipClick = async (clipId, clipIndex) => {
    try {
      // First select clip 10 in ALL layers
      const success = await selectClip10InAllLayers();
      if (!success) return;

      // Then select the clicked clip
      setSelectedClips((prev) => ({
        ...prev,
        [currentLayer]: clipId,
      }));

      const response = await fetch(
        `${process.env.REACT_APP_API_BASE_URL}/layers/${currentLayer}/clips/${clipIndex}/connect`,
        { method: "POST" }
      );

      if (!response.ok) {
        throw new Error("Failed to connect the clip to composition");
      }

      console.log("Clip connected to composition successfully!");

      // Special layer handling
      if (currentLayer === 3 && clipIndex !== 2) {
        resetApp();
        return;
      }

      if (currentLayer === 4) {
        resetApp();
        return;
      }

      // FIXED: Proper clip restrictions mapping for layer 3
      if (currentLayer === 2) {
        // When clip 1 is selected in layer 2, show clips [1,2] in layer 3
        // When clip 2 is selected in layer 2, show clips [2,3] in layer 3
        // But map them to correct Resolume indices
        const layer3Mapping = {
          1: [1, 2], // UI choice 1 -> Resolume clip 1, choice 2 -> clip 2
          2: [2, 3], // UI choice 1 -> Resolume clip 2, choice 2 -> clip 3
        };
        setClipRestrictions((prev) => ({
          ...prev,
          3: layer3Mapping[clipIndex],
        }));
      }

      // Move to next layer
      const nextLayer = (currentLayer % totalLayers) + 1;
      setCurrentLayer(nextLayer);
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
        {loading || preparingSelection ? (
          <p>
            {preparingSelection ? "Preparing selection..." : "Loading clips..."}
          </p>
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
