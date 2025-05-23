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

  useEffect(() => {
    fetchClipsForLayer(currentLayer);
  }, [currentLayer, clipRestrictions]);

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

      if (currentLayer === 3 && resolumeClipIndex !== 2) {
        resetApp();
        return;
      }

      if (currentLayer === 4) {
        resetApp();
        return;
      }

      setCurrentLayer(currentLayer + 1);
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
