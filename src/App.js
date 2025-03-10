import React, { useState, useEffect } from "react";

import "./App.css";

const App = () => {
  const [clips, setClips] = useState([]); // State to store clips for the current layer
  const [loading, setLoading] = useState(true); // Loading state
  const [currentLayer, setCurrentLayer] = useState(1); // State to track the current layer
  const [totalLayers, setTotalLayers] = useState(2); // Number of layers in the composition
  const [selectedClips, setSelectedClips] = useState({}); // Store selected clips by layer

  // Custom names for clips, keyed by their index or ID
  const customNames = {
    0: "Keuze 1",
    1: "Keuze 2",
    2: "Keuze 3",
    // Add more mappings as needed
  };

  // Fetch clips for the given layer
  const fetchClipsForLayer = (layerIndex) => {
    setLoading(true); // Show loading while fetching clips
    fetch("http://localhost:8080/api/v1/composition")
      .then((response) => {
        if (!response.ok) {
          throw new Error(`Error fetching composition: ${response.statusText}`);
        }
        return response.json();
      })
      .then((data) => {
        // Assuming total layers are available in the API, but we can dynamically set this
        setTotalLayers(data.layers.length);

        const layer = data.layers.find(
          (layer, index) => index + 1 === layerIndex
        );
        if (layer) {
          setClips(layer.clips || []); // Save clips from the specified layer
        } else {
          console.warn(`Layer ${layerIndex} not found!`);
          setClips([]); // Clear clips if layer not found
        }
        setLoading(false);
      })
      .catch((error) => {
        console.error("Failed to fetch composition:", error);
        setLoading(false);
      });
  };

  // Load clips for the current layer on mount or when the layer changes
  useEffect(() => {
    fetchClipsForLayer(currentLayer);
  }, [currentLayer]);

  // Function to handle the click of a clip button
  const handleClipClick = async (clipId, clipIndex) => {
    try {
      // Step 1: Select every clip in column 10 (last column) for all layers
      for (let layer = 1; layer <= totalLayers; layer++) {
        await fetch(
          `http://localhost:8080/api/v1/composition/layers/${layer}/clips/10/connect`,
          { method: "POST" }
        );
        console.log(`Connected clip in column 10 for layer ${layer}.`);
      }

      // Step 2: Now, connect the new clip to the current layer
      const response = await fetch(
        `http://localhost:8080/api/v1/composition/layers/${currentLayer}/clips/${clipIndex}/connect`,
        { method: "POST" }
      );

      if (response.ok) {
        console.log("Clip connected to composition successfully!");

        // Store the selected clip for the current layer
        setSelectedClips((prev) => ({
          ...prev,
          [currentLayer]: clipId, // Update to the newly selected clip
        }));

        // Step 3: Switch to the next layer
        const nextLayer = (currentLayer % totalLayers) + 1;
        setCurrentLayer(nextLayer);
      } else {
        console.error("Failed to connect the clip to composition");
      }
    } catch (error) {
      console.error("Error handling clip click:", error);
    }
  };

  return (
    <div className="wrapper">
      <h1 className="Titel">What will you choose {currentLayer}</h1>

      {loading ? (
        <p>Loading clips...</p>
      ) : (
        <div className="choice_wrapper">
          {clips.length > 0 ? (
            clips
              .filter((clip) => customNames[clip.id] || clip.name?.value) // Filter out empty or unnamed clips
              .map((clip, index) => (
                <button
                  key={clip.id}
                  className={`choice ${
                    selectedClips[currentLayer] === clip.id
                  }`}
                  onClick={() => handleClipClick(clip.id, index + 1)} // Trigger the clip on click
                >
                  {customNames[index] || clip.name?.value}{" "}
                  {/* Use custom names */}
                </button>
              ))
          ) : (
            <p>No clips available for this layer.</p>
          )}
        </div>
      )}
    </div>
  );
};

export default App;
