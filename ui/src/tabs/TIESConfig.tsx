import { useEffect, useState, useMemo } from 'react'

import { CopyButton, JSONPreview } from '../components'
import './TIESConfig.css'

const blockGroups = [
  {
    name: 'IN',
    label: 'Input Blocks',
    subBlocks: Array.from(
      { length: 9 },
      (_, i) => `IN${i.toString().padStart(2, '0')}`
    )
  },
  { name: 'M', label: 'Middle Block', subBlocks: ['M00'] },
  {
    name: 'OUT',
    label: 'Output Blocks',
    subBlocks: Array.from(
      { length: 9 },
      (_, i) => `OUT${i.toString().padStart(2, '0')}`
    )
  },
  { name: 'CLIP_L', label: 'CLIP L', subBlocks: [] },
  { name: 'CLIP_G', label: 'CLIP G', subBlocks: [] },
  { name: 'time_embed', label: 'Time Embed', subBlocks: [] },
  { name: 'label_emb', label: 'Label Embed', subBlocks: [] }
]

type BlockConfig = {
  weights: string
  densities: string
  vote_sgn?: boolean
  apply_stock?: boolean
  apply_median?: boolean
}

export function TIESConfig() {
  // State for number of models
  const [numModels, setNumModels] = useState(2)
  // State for model weights (not normalized by default - use 1.0 for each model)
  const [modelWeights, setModelWeights] = useState([1.0, 1.0])
  // State for global parameters
  const [lambda, setLambda] = useState(1.0)
  const [cosEps, setCosEps] = useState(1e-6)
  const [eps, setEps] = useState(1e-6)
  const [maxiter, setMaxiter] = useState(100)
  const [ftol, setFtol] = useState(1e-20)
  // State for global flags (root level)
  const [voteSgn, setVoteSgn] = useState(false)
  const [applyStock, setApplyStock] = useState(false)
  const [applyMedian, setApplyMedian] = useState(false)
  // State for global weights and densities
  const [globalWeights, setGlobalWeights] = useState('1.0,1.0')
  const [globalDensities, setGlobalDensities] = useState('0.2,0.2')
  // State for validation errors
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({})
  // State for global block flags
  const [globalVoteSgn, setGlobalVoteSgn] = useState(false)
  const [globalApplyStock, setGlobalApplyStock] = useState(false)
  const [globalApplyMedian, setGlobalApplyMedian] = useState(false)
  // State for advanced settings visibility
  const [showAdvanced, setShowAdvanced] = useState(false)
  // State for showing all blocks vs global only
  const [showAllBlocks, setShowAllBlocks] = useState(false)
  // State for block configurations
  const [blockConfigs, setBlockConfigs] = useState<Record<string, BlockConfig>>(
    {}
  )
  // State for which blocks are enabled
  const [enabledBlocks, setEnabledBlocks] = useState<Record<string, boolean>>(
    {}
  )
  // State for model names
  const [modelNames, setModelNames] = useState(['Model 1', 'Model 2'])

  // Initialize block configs and enabled blocks when number of models changes
  useEffect(() => {
    // Use 1.0 for each model (not normalized) as default, matching Python behavior
    const newWeights = Array(numModels).fill(1.0)
    setModelWeights(newWeights)
    const weightsStr = newWeights.map((w: number) => w.toFixed(1)).join(',')
    const densitiesStr = Array(numModels).fill(0.2).join(',')
    setGlobalWeights(weightsStr)
    setGlobalDensities(densitiesStr)

    // Initialize block configs and enable states
    const newBlockConfigs: Record<string, BlockConfig> = {}
    const newEnabledBlocks: Record<string, boolean> = {}

    blockGroups.forEach((group) => {
      if (group.subBlocks.length > 0) {
        group.subBlocks.forEach((subBlock) => {
          newBlockConfigs[subBlock] = {
            weights: weightsStr,
            densities: densitiesStr
          }
          newEnabledBlocks[subBlock] = false // Initially disabled
        })
      }
      newBlockConfigs[group.name] = {
        weights: weightsStr,
        densities: densitiesStr
      }
      newEnabledBlocks[group.name] = false // Initially disabled
    })

    setBlockConfigs(newBlockConfigs)
    setEnabledBlocks(newEnabledBlocks)
  }, [numModels])

  // Update model names when number of models changes
  useEffect(() => {
    const newNames = Array.from(
      { length: numModels },
      (_, i) => `Model ${i + 1}`
    )
    setModelNames(newNames)
  }, [numModels])

  // Update global weights when model weights change
  useEffect(() => {
    const weightsStr = modelWeights.map((w: number) => w.toFixed(3)).join(',')
    setGlobalWeights(weightsStr)
    // Clear validation error for global weights when updated via sliders
    setValidationErrors((prev) => {
      const newErrors = { ...prev }
      delete newErrors['global-weights']
      return newErrors
    })
  }, [modelWeights])

  // Helper function to get inherited flag value for a block
  // In Python: block_config.get("vote_sgn", global_vote_sgn)
  // where global_vote_sgn = global_config.get("vote_sgn", params.get("vote_sgn", False))
  // So: block -> global -> root
  const getInheritedFlag = (
    blockFlag: boolean | undefined,
    inheritedGlobalFlag: boolean
  ): boolean => {
    // If block flag is explicitly set, use it
    if (blockFlag !== undefined) return blockFlag
    // Otherwise, use inherited global flag (which may inherit from root)
    return inheritedGlobalFlag
  }

  // Helper function to validate densities
  const validateDensities = (densitiesStr: string): string | null => {
    if (!densitiesStr.trim()) {
      return 'Densities cannot be empty'
    }
    const densities = densitiesStr.split(',').map((d) => d.trim())
    if (densities.length !== numModels) {
      return `Must have exactly ${numModels} density values (one per model)`
    }
    for (let i = 0; i < densities.length; i++) {
      const d = parseFloat(densities[i])
      if (isNaN(d)) {
        return `Invalid density value at position ${i + 1}: "${densities[i]}"`
      }
      if (d < 0.0 || d > 1.0) {
        return `Density at position ${i + 1} must be between 0.0 and 1.0, got ${d}`
      }
    }
    return null
  }

  // Helper function to validate weights count
  const validateWeightsCount = (weightsStr: string): string | null => {
    if (!weightsStr.trim()) {
      return 'Weights cannot be empty'
    }
    const weights = weightsStr.split(',').map((w) => w.trim())
    if (weights.length !== numModels) {
      return `Must have exactly ${numModels} weight values (one per model)`
    }
    for (let i = 0; i < weights.length; i++) {
      const w = parseFloat(weights[i])
      if (isNaN(w)) {
        return `Invalid weight value at position ${i + 1}: "${weights[i]}"`
      }
    }
    return null
  }

  const handleModelWeightChange = (index: number, value: string) => {
    const newWeights = [...modelWeights]
    newWeights[index] = parseFloat(value)
    setModelWeights(newWeights)
  }

  const normalizeWeights = () => {
    const sum = modelWeights.reduce((acc: number, val: number) => acc + val, 0)
    if (sum === 0) return // Avoid division by zero

    const normalized = modelWeights.map((w: number) => w / sum)
    setModelWeights(normalized)
  }

  const updateBlockConfig = (
    blockName: string,
    updates: Partial<BlockConfig>
  ) => {
    setBlockConfigs((prev: Record<string, BlockConfig>) => ({
      ...prev,
      [blockName]: {
        ...prev[blockName],
        ...updates
      }
    }))
  }

  const toggleBlockEnabled = (blockName: string) => {
    setEnabledBlocks((prev: Record<string, boolean>) => ({
      ...prev,
      [blockName]: !prev[blockName]
    }))
  }

  const normalizeBlockWeights = (blockName: string) => {
    const config = blockConfigs[blockName] || {
      weights: globalWeights,
      densities: globalDensities
    }
    const weightsStr = config.weights
    const weights = weightsStr.split(',').map((w: string) => parseFloat(w) || 0)
    const sum = weights.reduce((acc: number, val: number) => acc + val, 0)
    if (sum === 0) return // Avoid division by zero

    const normalized = weights.map((w: number) => w / sum)
    const normalizedStr = normalized.map((w: number) => w.toFixed(3)).join(',')

    updateBlockConfig(blockName, { weights: normalizedStr })
  }

  const updateModelName = (index: number, newName: string) => {
    const newNames = [...modelNames]
    newNames[index] = newName || `Model ${index + 1}`
    setModelNames(newNames)
  }

  const generateJson = useMemo(() => {
    // Always include global parameters
    const result: Record<string, any> = {
      lambda: lambda,
      cos_eps: cosEps,
      eps: eps,
      maxiter: maxiter,
      ftol: ftol,
      vote_sgn: voteSgn,
      apply_stock: applyStock,
      apply_median: applyMedian,
      global: {
        weights: globalWeights,
        densities: globalDensities
      }
    }

    // Add global flags only if they differ from root level
    // In Python: global_vote_sgn = global_config.get("vote_sgn", params.get("vote_sgn", False))
    if (globalVoteSgn !== voteSgn) {
      result.global.vote_sgn = globalVoteSgn
    }
    if (globalApplyStock !== applyStock) {
      result.global.apply_stock = globalApplyStock
    }
    if (globalApplyMedian !== applyMedian) {
      result.global.apply_median = globalApplyMedian
    }

    // Compute inherited values for blocks
    // For global: if not set, inherits from root
    const inheritedGlobalVoteSgn = globalVoteSgn !== voteSgn ? globalVoteSgn : voteSgn
    const inheritedGlobalApplyStock = globalApplyStock !== applyStock ? globalApplyStock : applyStock
    const inheritedGlobalApplyMedian = globalApplyMedian !== applyMedian ? globalApplyMedian : applyMedian

    // Add enabled blocks in priority order: specific blocks first, then group blocks
    if (showAllBlocks) {
      // First, add specific blocks (like IN05) if they are enabled and different from their parent group
      const specificBlocks: Array<{ name: string; config: BlockConfig }> = []

      blockGroups.forEach((group) => {
        const groupConfig = blockConfigs[group.name] || {
          weights: globalWeights,
          densities: globalDensities
        }

        // Compute inherited values for group block
        const inheritedGroupVoteSgn = getInheritedFlag(
          groupConfig.vote_sgn,
          inheritedGlobalVoteSgn
        )
        const inheritedGroupApplyStock = getInheritedFlag(
          groupConfig.apply_stock,
          inheritedGlobalApplyStock
        )
        const inheritedGroupApplyMedian = getInheritedFlag(
          groupConfig.apply_median,
          inheritedGlobalApplyMedian
        )

        group.subBlocks.forEach((subBlock) => {
          const blockConfig = blockConfigs[subBlock] || {
            weights: groupConfig.weights,
            densities: groupConfig.densities
          }

          // Compute inherited values for specific block (block -> group -> global -> root)
          const inheritedBlockVoteSgn = getInheritedFlag(
            blockConfig.vote_sgn,
            inheritedGroupVoteSgn
          )
          const inheritedBlockApplyStock = getInheritedFlag(
            blockConfig.apply_stock,
            inheritedGroupApplyStock
          )
          const inheritedBlockApplyMedian = getInheritedFlag(
            blockConfig.apply_median,
            inheritedGroupApplyMedian
          )

          // Check if specific block is enabled and has different config than its group or global
          const hasDifferentWeights = blockConfig.weights !== groupConfig.weights && blockConfig.weights !== globalWeights
          const hasDifferentDensities = blockConfig.densities !== groupConfig.densities && blockConfig.densities !== globalDensities
          const hasDifferentFlags =
            (blockConfig.vote_sgn !== undefined && blockConfig.vote_sgn !== inheritedBlockVoteSgn) ||
            (blockConfig.apply_stock !== undefined && blockConfig.apply_stock !== inheritedBlockApplyStock) ||
            (blockConfig.apply_median !== undefined && blockConfig.apply_median !== inheritedBlockApplyMedian)

          if (
            enabledBlocks[subBlock] &&
            (hasDifferentWeights || hasDifferentDensities || hasDifferentFlags)
          ) {
            const blockResult: any = {
              weights: blockConfig.weights,
              densities: blockConfig.densities
            }

            // Add flags only if they are explicitly set AND differ from inherited value
            if (blockConfig.vote_sgn !== undefined && blockConfig.vote_sgn !== inheritedBlockVoteSgn) {
              blockResult.vote_sgn = blockConfig.vote_sgn
            }
            if (blockConfig.apply_stock !== undefined && blockConfig.apply_stock !== inheritedBlockApplyStock) {
              blockResult.apply_stock = blockConfig.apply_stock
            }
            if (blockConfig.apply_median !== undefined && blockConfig.apply_median !== inheritedBlockApplyMedian) {
              blockResult.apply_median = blockConfig.apply_median
            }

            specificBlocks.push({
              name: subBlock,
              config: blockResult
            })
          }
        })
      })

      // Then, add group blocks (like IN) if enabled and different from global
      const groupBlocks: Array<{ name: string; config: BlockConfig }> = []

      blockGroups.forEach((group) => {
        const groupConfig = blockConfigs[group.name] || {
          weights: globalWeights,
          densities: globalDensities
        }

        // Compute inherited values for group block
        const inheritedGroupVoteSgn = getInheritedFlag(
          groupConfig.vote_sgn,
          inheritedGlobalVoteSgn
        )
        const inheritedGroupApplyStock = getInheritedFlag(
          groupConfig.apply_stock,
          inheritedGlobalApplyStock
        )
        const inheritedGroupApplyMedian = getInheritedFlag(
          groupConfig.apply_median,
          inheritedGlobalApplyMedian
        )

        const hasDifferentWeights = groupConfig.weights !== globalWeights
        const hasDifferentDensities = groupConfig.densities !== globalDensities
        const hasDifferentFlags =
          (groupConfig.vote_sgn !== undefined && groupConfig.vote_sgn !== inheritedGroupVoteSgn) ||
          (groupConfig.apply_stock !== undefined && groupConfig.apply_stock !== inheritedGroupApplyStock) ||
          (groupConfig.apply_median !== undefined && groupConfig.apply_median !== inheritedGroupApplyMedian)

        if (
          enabledBlocks[group.name] &&
          (hasDifferentWeights || hasDifferentDensities || hasDifferentFlags)
        ) {
          const blockResult: any = {
            weights: groupConfig.weights,
            densities: groupConfig.densities
          }

          // Add flags only if they are explicitly set AND differ from inherited value
          if (groupConfig.vote_sgn !== undefined && groupConfig.vote_sgn !== inheritedGroupVoteSgn) {
            blockResult.vote_sgn = groupConfig.vote_sgn
          }
          if (groupConfig.apply_stock !== undefined && groupConfig.apply_stock !== inheritedGroupApplyStock) {
            blockResult.apply_stock = groupConfig.apply_stock
          }
          if (groupConfig.apply_median !== undefined && groupConfig.apply_median !== inheritedGroupApplyMedian) {
            blockResult.apply_median = groupConfig.apply_median
          }

          groupBlocks.push({
            name: group.name,
            config: blockResult
          })
        }
      })

      // Sort and add to result in the right order: specific blocks first, then group blocks
      ;[...specificBlocks, ...groupBlocks].forEach((block) => {
        result[block.name] = block.config
      })
    }

    return JSON.stringify(result, null, 2)
  }, [
    lambda,
    cosEps,
    eps,
    maxiter,
    ftol,
    voteSgn,
    applyStock,
    applyMedian,
    globalWeights,
    globalDensities,
    globalVoteSgn,
    globalApplyStock,
    globalApplyMedian,
    showAllBlocks,
    enabledBlocks,
    blockConfigs,
    numModels
  ])

  const resetToDefaults = () => {
    // Use 1.0 for each model (not normalized) as default
    const newWeights = Array(numModels).fill(1.0)
    setModelWeights(newWeights)
    const weightsStr = newWeights.map((w) => w.toFixed(1)).join(',')
    const densitiesStr = Array(numModels).fill(0.2).join(',')
    setGlobalWeights(weightsStr)
    setGlobalDensities(densitiesStr)
    setValidationErrors({})
    setLambda(1.0)
    setCosEps(1e-6)
    setEps(1e-6)
    setMaxiter(100)
    setFtol(1e-20)
    setVoteSgn(false)
    setApplyStock(false)
    setApplyMedian(false)
    setGlobalVoteSgn(false)
    setGlobalApplyStock(false)
    setGlobalApplyMedian(false)

    // Reset block configs and enable states
    const newBlockConfigs: Record<string, BlockConfig> = {}
    const newEnabledBlocks: Record<string, boolean> = {}

    blockGroups.forEach((group) => {
      if (group.subBlocks.length > 0) {
        group.subBlocks.forEach((subBlock) => {
          newBlockConfigs[subBlock] = {
            weights: weightsStr,
            densities: densitiesStr
          }
          newEnabledBlocks[subBlock] = false
        })
      }
      newBlockConfigs[group.name] = {
        weights: weightsStr,
        densities: densitiesStr
      }
      newEnabledBlocks[group.name] = false
    })

    setBlockConfigs(newBlockConfigs)
    setEnabledBlocks(newEnabledBlocks)
  }

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
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    updateModelName(index, e.target.value)
                  }
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
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  handleModelWeightChange(index, e.target.value)
                }
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
    )
  }

  const renderGlobalSettings = () => {
    return (
      <div className="global-settings-section">
        <h3>Global Settings</h3>
        <div className="global-controls">
          <div className="control-group">
            <label htmlFor="lambda">Lambda (scaling parameter):</label>
            <input
              id="lambda"
              type="number"
              value={lambda}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setLambda(parseFloat(e.target.value))
              }
              step="0.1"
              className="lambda-input"
            />
          </div>

          <div className="control-group">
            <label htmlFor="global-densities">Global Densities (0.0-1.0):</label>
            <input
              id="global-densities"
              type="text"
              value={globalDensities}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                const value = e.target.value
                setGlobalDensities(value)
                const error = validateDensities(value)
                if (error) {
                  setValidationErrors((prev) => ({ ...prev, 'global-densities': error }))
                } else {
                  setValidationErrors((prev) => {
                    const newErrors = { ...prev }
                    delete newErrors['global-densities']
                    return newErrors
                  })
                }
              }}
              placeholder="Comma separated densities"
              className={`densities-input ${validationErrors['global-densities'] ? 'error' : ''}`}
            />
            {validationErrors['global-densities'] && (
              <small style={{ color: 'var(--error-color, #e74c3c)', fontSize: '0.75rem' }}>
                {validationErrors['global-densities']}
              </small>
            )}
            {!validationErrors['global-densities'] && (
              <small style={{ color: 'var(--text-secondary, #bdc3c7)', fontSize: '0.75rem' }}>
                Density values should be between 0.0 and 1.0 for each model
              </small>
            )}
          </div>

          <div className="flags-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={voteSgn}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setVoteSgn(e.target.checked)
                }
              />
              <span>vote_sgn (root level)</span>
            </label>
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={applyStock}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setApplyStock(e.target.checked)
                }
              />
              <span>apply_stock (root level)</span>
            </label>
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={applyMedian}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setApplyMedian(e.target.checked)
                }
              />
              <span>apply_median (root level)</span>
            </label>
          </div>

          <div className="flags-group">
            <h4 style={{ margin: '0.5rem 0', fontSize: '0.85rem', color: 'var(--text-primary, #ecf0f1)' }}>
              Global Block Flags:
            </h4>
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={globalVoteSgn}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setGlobalVoteSgn(e.target.checked)
                }
              />
              <span>vote_sgn (global)</span>
            </label>
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={globalApplyStock}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                  if (e.target.checked && globalApplyMedian) {
                    setGlobalApplyStock(true)
                    setGlobalApplyMedian(false)
                  } else {
                    setGlobalApplyStock(e.target.checked)
                  }
                }}
                disabled={globalApplyMedian === true}
              />
              <span>apply_stock (global)</span>
              {globalApplyMedian && (
                <small style={{ color: 'var(--text-secondary, #bdc3c7)', fontSize: '0.7rem', marginLeft: '0.25rem' }}>
                  (disabled when apply_median is enabled)
                </small>
              )}
            </label>
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={globalApplyMedian}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                  if (e.target.checked && globalApplyStock) {
                    setGlobalApplyMedian(true)
                    setGlobalApplyStock(false)
                  } else {
                    setGlobalApplyMedian(e.target.checked)
                  }
                }}
              />
              <span>apply_median (global)</span>
              {globalApplyMedian && globalApplyStock && (
                <small style={{ color: 'var(--warning-color, #f39c12)', fontSize: '0.7rem', marginLeft: '0.25rem' }}>
                  (has priority over apply_stock)
                </small>
              )}
            </label>
          </div>
        </div>
      </div>
    )
  }

  const renderBlockControls = () => {
    if (!showAllBlocks) return null

    return (
      <div className="block-controls">
        <h3>Block Settings</h3>

        <div className="blocks-grid">
          {blockGroups.map((group) => {
            const groupConfig = blockConfigs[group.name] || {
              weights: globalWeights,
              densities: globalDensities
            }

            return (
              <div key={group.name} className="block-group">
                <div className="group-header">
                  <div className="group-label">
                    <input
                      type="checkbox"
                      checked={enabledBlocks[group.name] || false}
                      onChange={() => toggleBlockEnabled(group.name)}
                      id={`group-${group.name}`}
                    />
                    <label htmlFor={`group-${group.name}`}>{group.label}</label>
                  </div>
                </div>

                <div className="group-controls">
                  <div className="control-group">
                    <label htmlFor={`weights-${group.name}`}>Weights:</label>
                    <div className="input-with-button">
                      <input
                        id={`weights-${group.name}`}
                        type="text"
                        value={groupConfig.weights}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                          const value = e.target.value
                          updateBlockConfig(group.name, {
                            weights: value
                          })
                          const error = validateWeightsCount(value)
                          if (error) {
                            setValidationErrors((prev) => ({ ...prev, [`weights-${group.name}`]: error }))
                          } else {
                            setValidationErrors((prev) => {
                              const newErrors = { ...prev }
                              delete newErrors[`weights-${group.name}`]
                              return newErrors
                            })
                          }
                        }}
                        disabled={!enabledBlocks[group.name]}
                        placeholder="Comma separated weights"
                        className={`weights-input ${validationErrors[`weights-${group.name}`] ? 'error' : ''}`}
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

                  <div className="control-group">
                    <label htmlFor={`densities-${group.name}`}>
                      Densities (0.0-1.0):
                    </label>
                    <input
                      id={`densities-${group.name}`}
                      type="text"
                      value={groupConfig.densities}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                        const value = e.target.value
                        updateBlockConfig(group.name, {
                          densities: value
                        })
                          const error = validateDensities(value)
                        if (error) {
                          setValidationErrors((prev) => ({ ...prev, [`densities-${group.name}`]: error }))
                        } else {
                          setValidationErrors((prev) => {
                            const newErrors = { ...prev }
                            delete newErrors[`densities-${group.name}`]
                            return newErrors
                          })
                        }
                      }}
                      disabled={!enabledBlocks[group.name]}
                      placeholder="Comma separated densities"
                      className={`densities-input ${validationErrors[`densities-${group.name}`] ? 'error' : ''}`}
                    />
                      {validationErrors[`densities-${group.name}`] && (
                        <small style={{ color: 'var(--error-color, #e74c3c)', fontSize: '0.75rem' }}>
                          {validationErrors[`densities-${group.name}`]}
                        </small>
                      )}
                      {validationErrors[`weights-${group.name}`] && (
                        <small style={{ color: 'var(--error-color, #e74c3c)', fontSize: '0.75rem' }}>
                          {validationErrors[`weights-${group.name}`]}
                        </small>
                      )}
                  </div>

                  <div className="flags-group">
                    <label className="checkbox-label">
                      <input
                        type="checkbox"
                        checked={groupConfig.vote_sgn || false}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                          updateBlockConfig(group.name, {
                            vote_sgn: e.target.checked
                          })
                        }
                        disabled={!enabledBlocks[group.name]}
                      />
                      <span>vote_sgn</span>
                    </label>
                    <label className="checkbox-label">
                      <input
                        type="checkbox"
                        checked={groupConfig.apply_stock || false}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                          if (e.target.checked && groupConfig.apply_median) {
                            // If apply_median is enabled, disable it when enabling apply_stock
                            updateBlockConfig(group.name, {
                              apply_stock: true,
                              apply_median: false
                            })
                          } else {
                            updateBlockConfig(group.name, {
                              apply_stock: e.target.checked
                            })
                          }
                        }}
                        disabled={!enabledBlocks[group.name] || (groupConfig.apply_median === true)}
                      />
                      <span>apply_stock</span>
                      {groupConfig.apply_median && (
                        <small style={{ color: 'var(--text-secondary, #bdc3c7)', fontSize: '0.7rem', marginLeft: '0.25rem' }}>
                          (disabled when apply_median is enabled)
                        </small>
                      )}
                    </label>
                    <label className="checkbox-label">
                      <input
                        type="checkbox"
                        checked={groupConfig.apply_median || false}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                          if (e.target.checked && groupConfig.apply_stock) {
                            // If apply_stock is enabled, disable it when enabling apply_median
                            updateBlockConfig(group.name, {
                              apply_median: true,
                              apply_stock: false
                            })
                          } else {
                            updateBlockConfig(group.name, {
                              apply_median: e.target.checked
                            })
                          }
                        }}
                        disabled={!enabledBlocks[group.name]}
                      />
                      <span>apply_median</span>
                      {groupConfig.apply_median && groupConfig.apply_stock && (
                        <small style={{ color: 'var(--warning-color, #f39c12)', fontSize: '0.7rem', marginLeft: '0.25rem' }}>
                          (has priority over apply_stock)
                        </small>
                      )}
                    </label>
                  </div>
                </div>

                {group.subBlocks.length > 0 && (
                  <div className="sub-blocks">
                    {group.subBlocks.map((subBlock) => {
                      const subBlockConfig = blockConfigs[subBlock] || {
                        weights: groupConfig.weights,
                        densities: groupConfig.densities
                      }

                      return (
                        <div key={subBlock} className="sub-block">
                          <div className="sub-block-content">
                            <input
                              type="checkbox"
                              checked={enabledBlocks[subBlock] || false}
                              onChange={() => toggleBlockEnabled(subBlock)}
                              id={`sub-${subBlock}`}
                            />
                            <label htmlFor={`sub-${subBlock}`}>{subBlock}</label>
                          </div>

                          <div className="sub-block-controls">
                            <div className="control-group">
                              <label htmlFor={`weights-${subBlock}`}>
                                Weights:
                              </label>
                              <div className="input-with-button">
                                <input
                                  id={`weights-${subBlock}`}
                                  type="text"
                                  value={subBlockConfig.weights}
                                  onChange={(
                                    e: React.ChangeEvent<HTMLInputElement>
                                  ) => {
                                    const value = e.target.value
                                    updateBlockConfig(subBlock, {
                                      weights: value
                                    })
                                    const error = validateWeightsCount(value)
                                    if (error) {
                                      setValidationErrors((prev) => ({ ...prev, [`weights-${subBlock}`]: error }))
                                    } else {
                                      setValidationErrors((prev) => {
                                        const newErrors = { ...prev }
                                        delete newErrors[`weights-${subBlock}`]
                                        return newErrors
                                      })
                                    }
                                  }}
                                  disabled={!enabledBlocks[subBlock]}
                                  placeholder={`Weights for ${subBlock}`}
                                  className={`weights-input ${validationErrors[`weights-${subBlock}`] ? 'error' : ''}`}
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

                            <div className="control-group">
                              <label htmlFor={`densities-${subBlock}`}>
                                Densities (0.0-1.0):
                              </label>
                              <input
                                id={`densities-${subBlock}`}
                                type="text"
                                value={subBlockConfig.densities}
                                onChange={(
                                  e: React.ChangeEvent<HTMLInputElement>
                                ) => {
                                  const value = e.target.value
                                  updateBlockConfig(subBlock, {
                                    densities: value
                                  })
                                    const error = validateDensities(value)
                                  if (error) {
                                    setValidationErrors((prev) => ({ ...prev, [`densities-${subBlock}`]: error }))
                                  } else {
                                    setValidationErrors((prev) => {
                                      const newErrors = { ...prev }
                                      delete newErrors[`densities-${subBlock}`]
                                      return newErrors
                                    })
                                  }
                                }}
                                disabled={!enabledBlocks[subBlock]}
                                placeholder={`Densities for ${subBlock}`}
                                className={`densities-input ${validationErrors[`densities-${subBlock}`] ? 'error' : ''}`}
                              />
                              {validationErrors[`densities-${subBlock}`] && (
                                <small style={{ color: 'var(--error-color, #e74c3c)', fontSize: '0.75rem' }}>
                                  {validationErrors[`densities-${subBlock}`]}
                                </small>
                              )}
                              {validationErrors[`weights-${subBlock}`] && (
                                <small style={{ color: 'var(--error-color, #e74c3c)', fontSize: '0.75rem' }}>
                                  {validationErrors[`weights-${subBlock}`]}
                                </small>
                              )}
                            </div>

                            <div className="flags-group">
                              <label className="checkbox-label">
                                <input
                                  type="checkbox"
                                  checked={subBlockConfig.vote_sgn || false}
                                  onChange={(
                                    e: React.ChangeEvent<HTMLInputElement>
                                  ) =>
                                    updateBlockConfig(subBlock, {
                                      vote_sgn: e.target.checked
                                    })
                                  }
                                  disabled={!enabledBlocks[subBlock]}
                                />
                                <span>vote_sgn</span>
                              </label>
                              <label className="checkbox-label">
                                <input
                                  type="checkbox"
                                  checked={subBlockConfig.apply_stock || false}
                                  onChange={(
                                    e: React.ChangeEvent<HTMLInputElement>
                                  ) => {
                                    if (e.target.checked && subBlockConfig.apply_median) {
                                      updateBlockConfig(subBlock, {
                                        apply_stock: true,
                                        apply_median: false
                                      })
                                    } else {
                                      updateBlockConfig(subBlock, {
                                        apply_stock: e.target.checked
                                      })
                                    }
                                  }}
                                  disabled={!enabledBlocks[subBlock] || (subBlockConfig.apply_median === true)}
                                />
                                <span>apply_stock</span>
                                {subBlockConfig.apply_median && (
                                  <small style={{ color: 'var(--text-secondary, #bdc3c7)', fontSize: '0.7rem', marginLeft: '0.25rem' }}>
                                    (disabled when apply_median is enabled)
                                  </small>
                                )}
                              </label>
                              <label className="checkbox-label">
                                <input
                                  type="checkbox"
                                  checked={subBlockConfig.apply_median || false}
                                  onChange={(
                                    e: React.ChangeEvent<HTMLInputElement>
                                  ) => {
                                    if (e.target.checked && subBlockConfig.apply_stock) {
                                      updateBlockConfig(subBlock, {
                                        apply_median: true,
                                        apply_stock: false
                                      })
                                    } else {
                                      updateBlockConfig(subBlock, {
                                        apply_median: e.target.checked
                                      })
                                    }
                                  }}
                                  disabled={!enabledBlocks[subBlock]}
                                />
                                <span>apply_median</span>
                                {subBlockConfig.apply_median && subBlockConfig.apply_stock && (
                                  <small style={{ color: 'var(--warning-color, #f39c12)', fontSize: '0.7rem', marginLeft: '0.25rem' }}>
                                    (has priority over apply_stock)
                                  </small>
                                )}
                              </label>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  const renderHeatmap = () => {
    // Calculate block weights for visualization
    const heatmapData: Array<{
      name: string
      weights: number[]
      densities: number[]
      type: string
    }> = []

    // Add specific blocks first (higher priority)
    blockGroups.forEach((group) => {
      if (group.subBlocks.length > 0) {
        group.subBlocks.forEach((subBlock) => {
          if (enabledBlocks[subBlock]) {
            const subBlockConfig = blockConfigs[subBlock] || {
              weights: globalWeights,
              densities: globalDensities
            }
            const subBlockWeights = subBlockConfig.weights
              ? subBlockConfig.weights
                  .split(',')
                  .map((w: string) => parseFloat(w) || 0)
              : Array(numModels).fill(0)
            const subBlockDensities = subBlockConfig.densities
              ? subBlockConfig.densities
                  .split(',')
                  .map((d: string) => parseFloat(d) || 0)
              : Array(numModels).fill(0)
            heatmapData.push({
              name: subBlock,
              weights: subBlockWeights,
              densities: subBlockDensities,
              type: 'specific'
            })
          }
        })
      }

      // Add group block if enabled
      if (enabledBlocks[group.name]) {
        const groupConfig = blockConfigs[group.name] || {
          weights: globalWeights,
          densities: globalDensities
        }
        const groupWeights = groupConfig.weights
          ? groupConfig.weights.split(',').map((w: string) => parseFloat(w) || 0)
          : Array(numModels).fill(0)
        const groupDensities = groupConfig.densities
          ? groupConfig.densities.split(',').map((d: string) => parseFloat(d) || 0)
          : Array(numModels).fill(0)
        heatmapData.push({
          name: group.name,
          weights: groupWeights,
          densities: groupDensities,
          type: 'group'
        })
      }
    })

    // Always include global if no blocks are enabled
    if (heatmapData.length === 0) {
      const globalWeightsArray = globalWeights
        ? globalWeights.split(',').map((w: string) => parseFloat(w) || 0)
        : Array(numModels).fill(0)
      const globalDensitiesArray = globalDensities
        ? globalDensities.split(',').map((d: string) => parseFloat(d) || 0)
        : Array(numModels).fill(0)
      heatmapData.push({
        name: 'global',
        weights: globalWeightsArray,
        densities: globalDensitiesArray,
        type: 'global'
      })
    }

    return (
      <div className="heatmap">
        <h3>Block Weights & Densities Visualization</h3>
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
                    backgroundColor: `hsl(${weight * 120}, 70%, 30%)`
                  }}
                  title={`Weight: ${weight.toFixed(3)}, Density: ${block.densities[modelIndex].toFixed(3)}`}
                >
                  <div>{weight.toFixed(2)}</div>
                  <div style={{ fontSize: '0.65rem', opacity: 0.8 }}>
                    D:{block.densities[modelIndex].toFixed(2)}
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    )
  }

  const jsonOutput = generateJson

  // Validate JSON before showing
  let jsonError: string | null = null
  try {
    JSON.parse(jsonOutput)
  } catch (e) {
    jsonError = e instanceof Error ? e.message : 'Invalid JSON'
  }


  return (
    <div className="ties-config">
      <div className="config-header">
        <h2>TIES Merging Configuration</h2>
        <p>Create JSON configuration for ties_merging_with_json function</p>
      </div>

      <div className="config-content">
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
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setNumModels(parseInt(e.target.value))
                  }
                />
                <span className="slider-value">{numModels}</span>
              </div>
            </div>

            <div className="control-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={showAllBlocks}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setShowAllBlocks(e.target.checked)
                  }
                />
                <span>Show All Block Settings</span>
              </label>
            </div>

            <div className="control-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={showAdvanced}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setShowAdvanced(e.target.checked)
                  }
                />
                <span>Show Advanced Settings</span>
              </label>
            </div>
          </div>

          {renderGlobalSettings()}

          {renderModelSliders()}

          {showAdvanced && (
            <div className="advanced-settings">
              <h3>Advanced Settings</h3>
              <div className="advanced-controls">
                <div>
                  <label htmlFor="cos-eps">cos_eps (Model Stock):</label>
                  <input
                    id="cos-eps"
                    type="number"
                    value={cosEps}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setCosEps(parseFloat(e.target.value))
                    }
                    step="1e-7"
                    min="1e-10"
                  />
                </div>
                <div>
                  <label htmlFor="eps">eps (Geometric Median):</label>
                  <input
                    id="eps"
                    type="number"
                    value={eps}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setEps(parseFloat(e.target.value))
                    }
                    step="1e-7"
                    min="1e-10"
                  />
                </div>
                <div>
                  <label htmlFor="maxiter">maxiter (Geometric Median):</label>
                  <input
                    id="maxiter"
                    type="number"
                    value={maxiter}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setMaxiter(parseInt(e.target.value))
                    }
                    min="1"
                  />
                </div>
                <div>
                  <label htmlFor="ftol">ftol (Geometric Median):</label>
                  <input
                    id="ftol"
                    type="number"
                    value={ftol}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setFtol(parseFloat(e.target.value))
                    }
                    step="1e-21"
                    min="1e-30"
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
            <CopyButton
              text={jsonOutput}
              label="Copy JSON"
              disabled={jsonError !== null || Object.keys(validationErrors).length > 0}
            />
          </div>
          {jsonError && (
            <div style={{ color: 'var(--error-color, #e74c3c)', fontSize: '0.85rem', marginTop: '0.5rem' }}>
              JSON Error: {jsonError}
            </div>
          )}
        </div>

        <div className="output-section">
          {renderHeatmap()}

          <JSONPreview json={jsonOutput} />
        </div>
      </div>
    </div>
  )
}

