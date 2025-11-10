import { useState, useEffect } from "react";
import "./App.css";

const blockGroups = [
  {
    name: "IN",
    label: "Input Blocks",
    subBlocks: Array.from(
      { length: 9 },
      (_, i) => `IN${i.toString().padStart(2, "0")}`,
    ),
  },
  { name: "M", label: "Middle Block", subBlocks: ["M00"] },
  {
    name: "OUT",
    label: "Output Blocks",
    subBlocks: Array.from(
      { length: 9 },
      (_, i) => `OUT${i.toString().padStart(2, "0")}`,
    ),
  },
  { name: "CLIP_L", label: "CLIP L", subBlocks: [] },
  { name: "CLIP_G", label: "CLIP G", subBlocks: [] },
  { name: "time_embed", label: "Time Embed", subBlocks: [] },
  { name: "label_emb", label: "Label Embed", subBlocks: [] },
];

function App() {
  // State for number of models
  const [numModels, setNumModels] = useState(2);
  // State for model weights
  const [modelWeights, setModelWeights] = useState([0.5, 0.5]);
  // State for configuration settings
  const [config, setConfig] = useState({
    global: "0.5,0.5",
    max_iter: 10,
    tol: 1e-5,
  });
  // State for advanced settings visibility
  const [showAdvanced, setShowAdvanced] = useState(false);
  // State for showing all blocks vs global only
  const [showAllBlocks, setShowAllBlocks] = useState(false);
  // State for block weights
  const [blockWeights, setBlockWeights] = useState({});
  // State for which blocks are enabled
  const [enabledBlocks, setEnabledBlocks] = useState({});
  // Dark theme only
  const isDarkTheme = true;

  // Initialize block weights and enabled blocks when number of models changes
  useEffect(() => {
    const newWeights = Array(numModels).fill(1 / numModels);
    setModelWeights(newWeights);
    setConfig((prev) => ({
      ...prev,
      global: newWeights.map((w) => w.toFixed(3)).join(","),
    }));

    // Initialize block weights and enable states
    const newBlockWeights = {};
    const newEnabledBlocks = {};

    blockGroups.forEach((group) => {
      if (group.subBlocks.length > 0) {
        group.subBlocks.forEach((subBlock) => {
          newBlockWeights[subBlock] = newWeights
            .map((w) => w.toFixed(3))
            .join(",");
          newEnabledBlocks[subBlock] = false; // Initially disabled
        });
      }
      newBlockWeights[group.name] = newWeights
        .map((w) => w.toFixed(3))
        .join(",");
      newEnabledBlocks[group.name] = false; // Initially disabled
    });

    setBlockWeights(newBlockWeights);
    setEnabledBlocks(newEnabledBlocks);
  }, [numModels]);

  // Update global weights when model weights change
  useEffect(() => {
    setConfig((prev) => ({
      ...prev,
      global: modelWeights.map((w) => w.toFixed(3)).join(","),
    }));
  }, [modelWeights]);

  const handleModelWeightChange = (index, value) => {
    const newWeights = [...modelWeights];
    newWeights[index] = parseFloat(value);
    setModelWeights(newWeights);
  };

  const normalizeWeights = () => {
    const sum = modelWeights.reduce((acc, val) => acc + val, 0);
    if (sum === 0) return; // Avoid division by zero

    const normalized = modelWeights.map((w) => w / sum);
    setModelWeights(normalized);
  };

  const copyToClipboard = () => {
    const jsonStr = generateJson();
    navigator.clipboard.writeText(jsonStr);
    alert("JSON copied to clipboard!");
  };

  const generateJson = () => {
    // Always include global, max_iter, and tol
    const result = {
      global: config.global,
      max_iter: config.max_iter,
      tol: config.tol,
    };

    // Add enabled blocks in priority order: specific blocks first, then group blocks
    if (showAllBlocks) {
      // First, add specific blocks (like IN05) if they are enabled and different from their parent group
      const specificBlocks = [];

      blockGroups.forEach((group) => {
        group.subBlocks.forEach((subBlock) => {
          // Check if specific block is enabled and has different weights than its group
          const groupWeight = blockWeights[group.name] || config.global;
          if (
            enabledBlocks[subBlock] &&
            blockWeights[subBlock] !== groupWeight &&
            blockWeights[subBlock] !== config.global
          ) {
            specificBlocks.push({
              name: subBlock,
              weight: blockWeights[subBlock],
            });
          }
        });
      });

      // Then, add group blocks (like IN) if enabled and different from global
      const groupBlocks = [];

      blockGroups.forEach((group) => {
        if (
          enabledBlocks[group.name] &&
          blockWeights[group.name] !== config.global
        ) {
          groupBlocks.push({
            name: group.name,
            weight: blockWeights[group.name],
          });
        }
      });

      // Sort and add to result in the right order: specific blocks first, then group blocks
      [...specificBlocks, ...groupBlocks].forEach((block) => {
        result[block.name] = block.weight;
      });
    }

    return JSON.stringify(result, null, 2);
  };

  // State for model names
  const [modelNames, setModelNames] = useState(["Model 1", "Model 2"]);

  // Update model names when number of models changes
  useEffect(() => {
    const newNames = Array.from(
      { length: numModels },
      (_, i) => `Model ${i + 1}`,
    );
    setModelNames(newNames);
  }, [numModels]);

  const updateModelName = (index, newName) => {
    const newNames = [...modelNames];
    newNames[index] = newName || `Model ${index + 1}`;
    setModelNames(newNames);
  };

  const updateBlockWeights = (blockName, weights) => {
    setBlockWeights((prev) => ({
      ...prev,
      [blockName]: weights,
    }));
  };

  const toggleBlockEnabled = (blockName) => {
    setEnabledBlocks((prev) => ({
      ...prev,
      [blockName]: !prev[blockName],
    }));
  };

  const normalizeBlockWeights = (blockName) => {
    const weightsStr = blockWeights[blockName] || config.global;
    const weights = weightsStr.split(",").map((w) => parseFloat(w) || 0);
    const sum = weights.reduce((acc, val) => acc + val, 0);
    if (sum === 0) return; // Avoid division by zero

    const normalized = weights.map((w) => w / sum);

    const normalizedStr = normalized.map((w) => w.toFixed(3)).join(",");

    updateBlockWeights(blockName, normalizedStr);
  };

  const resetToDefaults = () => {
    const newWeights = Array(numModels).fill(1 / numModels);
    setModelWeights(newWeights);
    setConfig({
      global: newWeights.map((w) => w.toFixed(3)).join(","),
      max_iter: 10,
      tol: 1e-5,
    });

    // Reset block weights and enable states
    const newBlockWeights = {};
    const newEnabledBlocks = {};

    blockGroups.forEach((group) => {
      if (group.subBlocks.length > 0) {
        group.subBlocks.forEach((subBlock) => {
          newBlockWeights[subBlock] = newWeights
            .map((w) => w.toFixed(3))
            .join(",");
          newEnabledBlocks[subBlock] = false;
        });
      }
      newBlockWeights[group.name] = newWeights
        .map((w) => w.toFixed(3))
        .join(",");
      newEnabledBlocks[group.name] = false;
    });

    setBlockWeights(newBlockWeights);
    setEnabledBlocks(newEnabledBlocks);
  };

  const renderModelSliders = () => {
    return (
      <div className="model-weights-section">
        <h3>Model Weights</h3>
        <div className="model-sliders">
          {modelWeights.map((weight, index) => (
            <div key={index} className="model-slider-container">
              <div className="slider-label-row">
                <input
                  type="text"
                  value={modelNames[index]}
                  onChange={(e) => updateModelName(index, e.target.value)}
                  className="model-name-input"
                />
                <span>{(weight * 100).toFixed(1)}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={weight}
                onChange={(e) => handleModelWeightChange(index, e.target.value)}
                className="slider"
              />
              <div className="weight-value">{weight.toFixed(3)}</div>
            </div>
          ))}
        </div>
        <div className="normalize-row">
          <button onClick={normalizeWeights} className="normalize-btn">
            Normalize Global Weights
          </button>
        </div>
      </div>
    );
  };

  const renderBlockControls = () => {
    if (!showAllBlocks) return null;

    return (
      <div className="block-controls">
        <h3>Block Weights</h3>

        <div className="blocks-grid">
          {blockGroups.map((group) => (
            <div key={group.name} className="block-group">
              <div className="group-header">
                <div className="group-label">
                  <input
                    type="checkbox"
                    checked={enabledBlocks[group.name]}
                    onChange={() => toggleBlockEnabled(group.name)}
                    id={`group-${group.name}`}
                  />
                  <label htmlFor={`group-${group.name}`}>{group.label}</label>
                </div>

                <div className="group-input-row">
                  <input
                    type="text"
                    value={blockWeights[group.name] || config.global}
                    onChange={(e) =>
                      updateBlockWeights(group.name, e.target.value)
                    }
                    disabled={!enabledBlocks[group.name]}
                    placeholder="Comma separated weights"
                    className="weights-input"
                  />

                  <button
                    onClick={() => normalizeBlockWeights(group.name)}
                    disabled={!enabledBlocks[group.name]}
                    className="normalize-btn small"
                  >
                    Normalize
                  </button>
                </div>
              </div>

              {group.subBlocks.length > 0 && (
                <div className="sub-blocks">
                  {group.subBlocks.map((subBlock) => (
                    <div key={subBlock} className="sub-block">
                      <div className="sub-block-content">
                        <input
                          type="checkbox"
                          checked={enabledBlocks[subBlock]}
                          onChange={() => toggleBlockEnabled(subBlock)}
                          id={`sub-${subBlock}`}
                        />
                        <label htmlFor={`sub-${subBlock}`}>{subBlock}</label>
                      </div>

                      <div className="sub-block-input-row">
                        <input
                          type="text"
                          value={
                            blockWeights[subBlock] ||
                            blockWeights[group.name] ||
                            config.global
                          }
                          onChange={(e) =>
                            updateBlockWeights(subBlock, e.target.value)
                          }
                          disabled={!enabledBlocks[subBlock]}
                          placeholder={`Weights for ${subBlock}`}
                          className="weights-input"
                        />
                        <button
                          onClick={() => normalizeBlockWeights(subBlock)}
                          disabled={!enabledBlocks[subBlock]}
                          className="normalize-btn small"
                        >
                          Normalize
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderHeatmap = () => {
    // Calculate block weights for visualization
    const heatmapData = [];

    // Add specific blocks first (higher priority)
    blockGroups.forEach((group) => {
      if (group.subBlocks.length > 0) {
        group.subBlocks.forEach((subBlock) => {
          if (enabledBlocks[subBlock]) {
            const subBlockWeightStr = blockWeights[subBlock] || config.global;
            const subBlockWeights = subBlockWeightStr
              ? subBlockWeightStr.split(",").map((w) => parseFloat(w) || 0)
              : Array(numModels).fill(0);
            heatmapData.push({
              name: subBlock,
              weights: subBlockWeights,
              type: "specific",
            });
          }
        });
      }

      // Add group block if enabled
      if (enabledBlocks[group.name]) {
        const groupWeightStr = blockWeights[group.name] || config.global;
        const groupWeights = groupWeightStr
          ? groupWeightStr.split(",").map((w) => parseFloat(w) || 0)
          : Array(numModels).fill(0);
        heatmapData.push({
          name: group.name,
          weights: groupWeights,
          type: "group",
        });
      }
    });

    // Always include global if no blocks are enabled
    if (heatmapData.length === 0) {
      const globalWeights = config.global
        ? config.global.split(",").map((w) => parseFloat(w) || 0)
        : Array(numModels).fill(0);
      heatmapData.push({
        name: "global",
        weights: globalWeights,
        type: "global",
      });
    }

    return (
      <div className="heatmap">
        <h3>Block Weights Visualization</h3>
        <div className="heatmap-grid">
          <div className="heatmap-headers">
            <div className="block-label">Block</div>
            {Array.from({ length: numModels }).map((_, i) => (
              <div key={i} className="model-header">
                {modelNames[i] || `Model ${i + 1}`}
              </div>
            ))}
          </div>

          {heatmapData.map((block, blockIndex) => (
            <div key={blockIndex} className="heatmap-row">
              <div className="block-label">{block.name}</div>
              {block.weights.map((weight, modelIndex) => (
                <div
                  key={modelIndex}
                  className="heatmap-cell"
                  style={{
                    backgroundColor: `hsl(${weight * 120}, 70%, 30%)`, // Green to red scale for dark theme
                  }}
                  title={`Weight: ${weight.toFixed(3)}`}
                >
                  {weight.toFixed(2)}
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    );
  };

  const jsonOutput = generateJson();

  return (
    <div className="app dark-theme">
      <header className="header">
        <h1>Karcher Mean Configuration Generator</h1>
        <p>
          Create JSON configurations for the karcher_mean_with_json function
        </p>
      </header>

      <main className="main-content">
        <div className="controls-section">
          <div className="basic-controls">
            <div className="control-group">
              <label htmlFor="num-models">Number of Models (2-10):</label>
              <div className="slider-with-value">
                <input
                  id="num-models"
                  type="range"
                  min="2"
                  max="10"
                  value={numModels}
                  onChange={(e) => setNumModels(parseInt(e.target.value))}
                />
                <span className="slider-value">{numModels}</span>
              </div>
            </div>

            <div className="control-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={showAllBlocks}
                  onChange={(e) => setShowAllBlocks(e.target.checked)}
                />
                <span>Show All Block Settings</span>
              </label>
            </div>

            <div className="control-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={showAdvanced}
                  onChange={(e) => setShowAdvanced(e.target.checked)}
                />
                <span>Show Advanced Settings</span>
              </label>
            </div>
          </div>

          {renderModelSliders()}

          {showAdvanced && (
            <div className="advanced-settings">
              <h3>Advanced Settings</h3>
              <div className="advanced-controls">
                <div>
                  <label htmlFor="max-iter">Max Iterations:</label>
                  <input
                    id="max-iter"
                    type="number"
                    value={config.max_iter}
                    onChange={(e) =>
                      setConfig({
                        ...config,
                        max_iter: parseInt(e.target.value),
                      })
                    }
                    min="1"
                  />
                </div>
                <div>
                  <label htmlFor="tol">Tolerance:</label>
                  <input
                    id="tol"
                    type="number"
                    value={config.tol}
                    onChange={(e) =>
                      setConfig({ ...config, tol: parseFloat(e.target.value) })
                    }
                    step="1e-6"
                    min="1e-10"
                  />
                </div>
              </div>
            </div>
          )}

          {renderBlockControls()}

          <div className="action-buttons">
            <button onClick={resetToDefaults} className="reset-btn">
              Reset to Defaults
            </button>
            <button onClick={copyToClipboard} className="copy-btn">
              Copy JSON to Clipboard
            </button>
          </div>
        </div>

        <div className="visualization-section">
          {renderHeatmap()}

          <div className="json-output">
            <h3>Generated JSON</h3>
            <pre className="json-display">{jsonOutput}</pre>
            <button onClick={copyToClipboard} className="copy-btn bottom">
              Copy JSON to Clipboard
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;
