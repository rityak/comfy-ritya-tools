import { useEffect, useState, useMemo } from 'react'

import { CopyButton, JSONPreview } from '../components'
import './DELLAConfig.css'

type MergeType = 'della_linear' | 'della_ties'

export function DELLAConfig() {
  // State for merge type selection
  const [mergeType, setMergeType] = useState<MergeType>('della_linear')
  // State for number of models
  const [numModels, setNumModels] = useState(2)
  // State for model weights (not normalized by default - use 1.0 for each model)
  const [modelWeights, setModelWeights] = useState([1.0, 1.0])
  // State for densities (one per model)
  const [densities, setDensities] = useState([0.2, 0.2])
  // State for gammas (one per model, always needed for DELLA)
  const [gammas, setGammas] = useState([0.01, 0.01])
  // State for global parameters
  const [lambda, setLambda] = useState(1.0)
  const [voteSgn, setVoteSgn] = useState(false)
  // State for model names
  const [modelNames, setModelNames] = useState(['Model 1', 'Model 2'])
  // State for validation errors
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({})

  // Initialize model weights, densities, and gammas when number of models changes
  useEffect(() => {
    const newWeights = Array(numModels).fill(1.0)
    setModelWeights(newWeights)
    const newDensities = Array(numModels).fill(0.2)
    setDensities(newDensities)
    const newGammas = Array(numModels).fill(0.01)
    setGammas(newGammas)
  }, [numModels])

  // Update model names when number of models changes
  useEffect(() => {
    const newNames = Array.from(
      { length: numModels },
      (_, i) => `Model ${i + 1}`
    )
    setModelNames(newNames)
  }, [numModels])

  const handleModelWeightChange = (index: number, value: string) => {
    const newWeights = [...modelWeights]
    newWeights[index] = parseFloat(value)
    setModelWeights(newWeights)
  }

  const handleDensityChange = (index: number, value: string) => {
    const newDensities = [...densities]
    const densityValue = parseFloat(value)
    newDensities[index] = densityValue
    setDensities(newDensities)

    // Validate density
    const error = validateDensity(densityValue)
    if (error) {
      setValidationErrors((prev) => ({ ...prev, [`density_${index}`]: error }))
    } else {
      setValidationErrors((prev) => {
        const newErrors = { ...prev }
        delete newErrors[`density_${index}`]
        return newErrors
      })
    }

    // Validate density + gamma <= 1.0 (always for DELLA)
    const gammaValue = gammas[index]
    const sumError = validateDensityGammaSum(densityValue, gammaValue)
    if (sumError) {
      setValidationErrors((prev) => ({ ...prev, [`sum_${index}`]: sumError }))
    } else {
      setValidationErrors((prev) => {
        const newErrors = { ...prev }
        delete newErrors[`sum_${index}`]
        return newErrors
      })
    }
  }

  const handleGammaChange = (index: number, value: string) => {
    const newGammas = [...gammas]
    const gammaValue = parseFloat(value)
    newGammas[index] = gammaValue
    setGammas(newGammas)

    // Validate gamma
    const error = validateGamma(gammaValue)
    if (error) {
      setValidationErrors((prev) => ({ ...prev, [`gamma_${index}`]: error }))
    } else {
      setValidationErrors((prev) => {
        const newErrors = { ...prev }
        delete newErrors[`gamma_${index}`]
        return newErrors
      })
    }

    // Validate density + gamma <= 1.0
    const densityValue = densities[index]
    const sumError = validateDensityGammaSum(densityValue, gammaValue)
    if (sumError) {
      setValidationErrors((prev) => ({ ...prev, [`sum_${index}`]: sumError }))
    } else {
      setValidationErrors((prev) => {
        const newErrors = { ...prev }
        delete newErrors[`sum_${index}`]
        return newErrors
      })
    }
  }

  const normalizeWeights = () => {
    const sum = modelWeights.reduce((acc: number, val: number) => acc + val, 0)
    if (sum === 0) return // Avoid division by zero

    const normalized = modelWeights.map((w: number) => w / sum)
    setModelWeights(normalized)
  }

  const updateModelName = (index: number, newName: string) => {
    const newNames = [...modelNames]
    newNames[index] = newName || `Model ${index + 1}`
    setModelNames(newNames)
  }

  const validateDensity = (value: number): string | null => {
    if (isNaN(value)) {
      return 'Density must be a number'
    }
    if (value < 0.0 || value > 1.0) {
      return `Density must be between 0.0 and 1.0, got ${value}`
    }
    return null
  }

  const validateGamma = (value: number): string | null => {
    if (isNaN(value)) {
      return 'Gamma must be a number'
    }
    if (value < 0.0 || value > 1.0) {
      return `Gamma must be between 0.0 and 1.0, got ${value}`
    }
    return null
  }

  const validateDensityGammaSum = (density: number, gamma: number): string | null => {
    if (density + gamma > 1.0 + 1e-6) {
      return `Density (${density.toFixed(3)}) + Gamma (${gamma.toFixed(3)}) must be <= 1.0`
    }
    return null
  }

  const generateJson = useMemo(() => {
    const globalConfig: Record<string, any> = {
      weights: modelWeights.map((w) => w.toFixed(3)).join(','),
      densities: densities.map((d) => d.toFixed(3)).join(','),
      gammas: gammas.map((g) => g.toFixed(3)).join(',')
    }

    // Add vote_sgn for TIES type
    if (mergeType === 'della_ties') {
      globalConfig.vote_sgn = voteSgn
    }

    const result: Record<string, any> = {
      lambda: lambda,
      global: globalConfig
    }

    return JSON.stringify(result, null, 2)
  }, [
    mergeType,
    lambda,
    modelWeights,
    densities,
    gammas,
    voteSgn
  ])

  const resetToDefaults = () => {
    const newWeights = Array(numModels).fill(1.0)
    setModelWeights(newWeights)
    const newDensities = Array(numModels).fill(0.2)
    setDensities(newDensities)
    const newGammas = Array(numModels).fill(0.01)
    setGammas(newGammas)
    setLambda(1.0)
    setVoteSgn(false)
    setValidationErrors({})
  }

  const renderMergeTypeSelector = () => {
    return (
      <div className="control-group">
        <label htmlFor="merge-type">Merge Type:</label>
        <select
          id="merge-type"
          value={mergeType}
          onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
            setMergeType(e.target.value as MergeType)
          }
          className="merge-type-select"
        >
          <option value="della_linear">DELLA Linear</option>
          <option value="della_ties">DELLA TIES</option>
        </select>
      </div>
    )
  }

  const renderModelWeights = () => {
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
            Normalize Weights
          </button>
        </div>
      </div>
    )
  }

  const renderDensities = () => {
    return (
      <div className="densities-section">
        <h3>Densities (0.0-1.0)</h3>
        <div className="model-sliders">
          {densities.map((density, index) => (
            <div key={index} className="model-slider-container">
              <div className="slider-label-row">
                <label htmlFor={`density-${index}`}>{modelNames[index]}:</label>
                <span>{(density * 100).toFixed(0)}%</span>
              </div>
              <input
                id={`density-${index}`}
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={density}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  handleDensityChange(index, e.target.value)
                }
                className="slider"
              />
              <div className="weight-value">{density.toFixed(3)}</div>
              {validationErrors[`density_${index}`] && (
                <small style={{ color: 'var(--error-color, #e74c3c)', fontSize: '0.75rem' }}>
                  {validationErrors[`density_${index}`]}
                </small>
              )}
              {validationErrors[`sum_${index}`] && (
                <small style={{ color: 'var(--error-color, #e74c3c)', fontSize: '0.75rem' }}>
                  {validationErrors[`sum_${index}`]}
                </small>
              )}
            </div>
          ))}
        </div>
      </div>
    )
  }

  const renderGammas = () => {
    return (
      <div className="gammas-section">
        <h3>Gammas (0.0-1.0)</h3>
        <div className="model-sliders">
          {gammas.map((gamma, index) => (
            <div key={index} className="model-slider-container">
              <div className="slider-label-row">
                <label htmlFor={`gamma-${index}`}>{modelNames[index]}:</label>
                <span>{(gamma * 100).toFixed(0)}%</span>
              </div>
              <input
                id={`gamma-${index}`}
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={gamma}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  handleGammaChange(index, e.target.value)
                }
                className="slider"
              />
              <div className="weight-value">{gamma.toFixed(3)}</div>
              {validationErrors[`gamma_${index}`] && (
                <small style={{ color: 'var(--error-color, #e74c3c)', fontSize: '0.75rem' }}>
                  {validationErrors[`gamma_${index}`]}
                </small>
              )}
            </div>
          ))}
        </div>
        <small style={{ color: 'var(--text-secondary, #bdc3c7)', fontSize: '0.75rem', display: 'block', marginTop: '0.5rem' }}>
          Note: Density + Gamma must be &lt;= 1.0 for each model
        </small>
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

          {mergeType === 'della_ties' && (
            <div className="flags-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={voteSgn}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setVoteSgn(e.target.checked)
                  }
                />
                <span>vote_sgn</span>
              </label>
            </div>
          )}
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

  // Check if there are any validation errors
  const hasValidationErrors = Object.keys(validationErrors).length > 0

  return (
    <div className="della-config">
      <div className="config-header">
        <h2>DELLA Merging Configuration</h2>
        <p>Create JSON configuration for DELLA merge functions</p>
      </div>

      <div className="config-content">
        <div className="controls-section">
          <div className="basic-controls">
            {renderMergeTypeSelector()}

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
          </div>

          {renderGlobalSettings()}

          {renderModelWeights()}

          {renderDensities()}

          {renderGammas()}

          <div className="action-buttons">
            <button onClick={resetToDefaults} className="reset-btn">
              Reset to Defaults
            </button>
            <CopyButton
              text={jsonOutput}
              label="Copy JSON"
              disabled={jsonError !== null || hasValidationErrors}
            />
          </div>
          {jsonError && (
            <div style={{ color: 'var(--error-color, #e74c3c)', fontSize: '0.85rem', marginTop: '0.5rem' }}>
              JSON Error: {jsonError}
            </div>
          )}
          {hasValidationErrors && (
            <div style={{ color: 'var(--error-color, #e74c3c)', fontSize: '0.85rem', marginTop: '0.5rem' }}>
              Please fix validation errors before copying JSON
            </div>
          )}
        </div>

        <div className="output-section">
          <JSONPreview json={jsonOutput} />
        </div>
      </div>
    </div>
  )
}

