import React, { useState, useEffect } from "react";
import topImage from "./assets/top.png";
import bottomImage from "./assets/bottom.png";
import "./App.css";

const App = () => {
  // Clip duration in milliseconds
  const clipDurations = {
    1: { 1: 105000 },
    2: {
      1: 37000,
      2: 29000,
    },
    3: {
      1: 66000,
      2: 38000,
      3: 96000,
    },
    4: {
      1: 90000,
      2: 58000,
    },
  };

  const [clips, setClips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentLayer, setCurrentLayer] = useState(1);
  const [totalLayers, setTotalLayers] = useState(4);
  const [selectedClips, setSelectedClips] = useState({});
  const [clipRestrictions, setClipRestrictions] = useState({});
  const [preparingSelection, setPreparingSelection] = useState(false);
  const [waitingForNextChoice, setWaitingForNextChoice] = useState(false);
  const [isFinalWaitingScreen, setIsFinalWaitingScreen] = useState(false);

  const resetApp = () => {
    setCurrentLayer(1);
    setSelectedClips({});
    setClipRestrictions({});
    setClips([]);
    setLoading(true);
    setPreparingSelection(false);
    setWaitingForNextChoice(false);
    setIsFinalWaitingScreen(false);
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
        const layer = data.layers.find(
          (layer, index) => index + 1 === layerIndex
        );

        if (layer) {
          let validClips = layer.clips || [];
          if (clipRestrictions[layerIndex]) {
            validClips = validClips.filter((_, index) =>
              clipRestrictions[layerIndex].includes(index + 1)
            );
          }
          setClips(validClips);
        } else {
          setClips([]);
        }
        setLoading(false);
      })
      .catch((error) => {
        console.error("Failed to fetch composition:", error);
        setLoading(false);
      });
  };

  const startWaitingPeriod = (layer, clipIndex, isFinal = false) => {
    const duration = clipDurations[layer]?.[clipIndex] || 30000;
    setWaitingForNextChoice(true);
    setIsFinalWaitingScreen(isFinal);

    setTimeout(() => {
      setWaitingForNextChoice(false);
      setIsFinalWaitingScreen(false);
      if (isFinal || layer === 4) {
        resetApp();
      } else {
        setCurrentLayer(layer + 1);
      }
    }, duration);
  };

  useEffect(() => {
    if (currentLayer <= totalLayers && !waitingForNextChoice) {
      fetchClipsForLayer(currentLayer);
    }
  }, [currentLayer, clipRestrictions, waitingForNextChoice]);

  const selectClip10InAllLayers = async () => {
    setPreparingSelection(true);
    try {
      for (let layer = 1; layer <= totalLayers; layer++) {
        await fetch(
          `${process.env.REACT_APP_API_BASE_URL}/layers/${layer}/clips/10/connect`,
          { method: "POST" }
        );
      }
      return true;
    } catch (error) {
      console.error("Error selecting clip 10 in layers:", error);
      return false;
    } finally {
      setPreparingSelection(false);
    }
  };

  const handleClipClick = async (clipId, resolumeClipIndex) => {
    try {
      await selectClip10InAllLayers();

      setSelectedClips((prev) => ({
        ...prev,
        [currentLayer]: clipId,
      }));

      await fetch(
        `${process.env.REACT_APP_API_BASE_URL}/layers/${currentLayer}/clips/${resolumeClipIndex}/connect`,
        { method: "POST" }
      );

      if (currentLayer === 2) {
        setClipRestrictions({
          ...clipRestrictions,
          3: resolumeClipIndex === 1 ? [1, 2] : [2, 3],
        });
      }

      // Special handling for layer 3
      if (currentLayer === 3) {
        if (resolumeClipIndex === 2) {
          // Proceed to layer 4 normally
          startWaitingPeriod(currentLayer, resolumeClipIndex);
        } else {
          // For other clips in layer 3, show final waiting screen then reset
          startWaitingPeriod(currentLayer, resolumeClipIndex, true);
        }
      }
      // Special handling for layer 4
      else if (currentLayer === 4) {
        // For all clips in layer 4, show final waiting screen then reset
        startWaitingPeriod(currentLayer, resolumeClipIndex, true);
      } else {
        // Normal behavior for other layers
        startWaitingPeriod(currentLayer, resolumeClipIndex);
      }
    } catch (error) {
      console.error("Error handling clip click:", error);
    }
  };

  const getTitle = () => {
    if (waitingForNextChoice) {
      return isFinalWaitingScreen ? "" : "Wait for the next choice";
    }
    return currentLayer === 1 ? "Click to start" : "What will you choose";
  };

  const getTitleClassName = () => {
    if (waitingForNextChoice) {
      return isFinalWaitingScreen ? "final-waiting-title" : "waiting-title";
    }
    return currentLayer === 1 ? "first-title" : "regular-title";
  };

  return (
    <>
      <img src={topImage} alt="Top Banner" className="top-image" />
      <div className="wrapper">
        <h1 className={`Titel ${getTitleClassName()}`}>{getTitle()}</h1>
        {waitingForNextChoice ? null : loading || preparingSelection ? (
          <p>
            {preparingSelection ? "Preparing selection..." : "Loading clips..."}
          </p>
        ) : (
          <div className="choice_wrapper">
            {clips.length > 0 ? (
              clips
                .filter((clip) => clip.name?.value?.trim())
                .map((clip, index) => {
                  const resolumeClipNumber = clipRestrictions[currentLayer]
                    ? clipRestrictions[currentLayer][index]
                    : index + 1;

                  return (
                    <button
                      key={clip.id}
                      className={`choice ${
                        selectedClips[currentLayer] === clip.id
                          ? "selected"
                          : ""
                      } ${
                        index === 0 && currentLayer === 1 ? "first-choice" : ""
                      }`}
                      onClick={() =>
                        handleClipClick(clip.id, resolumeClipNumber)
                      }
                    >
                      {clip.name?.value}
                    </button>
                  );
                })
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
