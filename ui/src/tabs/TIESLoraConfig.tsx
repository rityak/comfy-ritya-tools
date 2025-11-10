import { useEffect, useState, useMemo } from 'react'

import { CopyButton, JSONPreview } from '../components'
import './TIESLoraConfig.css'

export function TIESLoraConfig() {
  // State for number of LoRA
  const [numLoras, setNumLoras] = useState(2)
  // State for model weights (not normalized by default - use 1.0 for each LoRA)
  const [modelWeights, setModelWeights] = useState([1.0, 1.0])
  // State for global parameters
  const [lambda, setLambda] = useState(1.0)
  const [density, setDensity] = useState(0.25)
  const [voteSgn, setVoteSgn] = useState(false)
  const [applyStock, setApplyStock] = useState(false)
  const [applyMedian, setApplyMedian] = useState(false)
  // State for advanced settings
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [cosEps, setCosEps] = useState(1e-6)
  const [eps, setEps] = useState(1e-6)
  const [maxiter, setMaxiter] = useState(100)
  const [ftol, setFtol] = useState(1e-20)
  // State for model names
  const [modelNames, setModelNames] = useState(['LoRA 1', 'LoRA 2'])
  // State for validation errors
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({})

  // Initialize model weights when number of LoRA changes
  useEffect(() => {
    // Use 1.0 for each LoRA (not normalized) as default
    const newWeights = Array(numLoras).fill(1.0)
    setModelWeights(newWeights)
  }, [numLoras])

  // Update model names when number of LoRA changes
  useEffect(() => {
    const newNames = Array.from(
      { length: numLoras },
      (_, i) => `LoRA ${i + 1}`
    )
    setModelNames(newNames)
  }, [numLoras])

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

  const updateModelName = (index: number, newName: string) => {
    const newNames = [...modelNames]
    newNames[index] = newName || `LoRA ${index + 1}`
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

  const generateJson = useMemo(() => {
    const result: Record<string, any> = {
      lambda: lambda,
      weights: modelWeights.map((w) => w.toFixed(3)).join(','),
      density: density,
      vote_sgn: voteSgn,
      apply_stock: applyStock,
      apply_median: applyMedian
    }

    // Only include advanced params if they differ from defaults
    if (cosEps !== 1e-6) result.cos_eps = cosEps
    if (eps !== 1e-6) result.eps = eps
    if (maxiter !== 100) result.maxiter = maxiter
    if (ftol !== 1e-20) result.ftol = ftol

    return JSON.stringify(result, null, 2)
  }, [
    lambda,
    modelWeights,
    density,
    voteSgn,
    applyStock,
    applyMedian,
    cosEps,
    eps,
    maxiter,
    ftol
  ])

  const resetToDefaults = () => {
    // Use 1.0 for each LoRA (not normalized) as default
    const newWeights = Array(numLoras).fill(1.0)
    setModelWeights(newWeights)
    setDensity(0.25)
    setLambda(1.0)
    setVoteSgn(false)
    setApplyStock(false)
    setApplyMedian(false)
    setCosEps(1e-6)
    setEps(1e-6)
    setMaxiter(100)
    setFtol(1e-20)
    setValidationErrors({})
  }

  const renderModelSliders = () => {
    return (
      <div className="model-weights-section">
        <h3>LoRA Weights</h3>
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
            <label htmlFor="density">Global Density (0.0-1.0):</label>
            <div className="slider-with-value">
              <input
                id="density"
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={density}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                  const value = parseFloat(e.target.value)
                  setDensity(value)
                  const error = validateDensity(value)
                  if (error) {
                    setValidationErrors((prev) => ({ ...prev, density: error }))
                  } else {
                    setValidationErrors((prev) => {
                      const newErrors = { ...prev }
                      delete newErrors.density
                      return newErrors
                    })
                  }
                }}
                className="slider"
              />
              <span className="slider-value">{(density * 100).toFixed(0)}%</span>
            </div>
            <div className="density-value">{density.toFixed(3)}</div>
            {validationErrors.density && (
              <small style={{ color: 'var(--error-color, #e74c3c)', fontSize: '0.75rem' }}>
                {validationErrors.density}
              </small>
            )}
            {!validationErrors.density && (
              <small style={{ color: 'var(--text-secondary, #bdc3c7)', fontSize: '0.75rem' }}>
                Density controls TRIM step: top-{Math.round(density * 100)}% of parameters by magnitude
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
              <span>vote_sgn</span>
            </label>
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={applyStock}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                  if (e.target.checked && applyMedian) {
                    setApplyStock(true)
                    setApplyMedian(false)
                  } else {
                    setApplyStock(e.target.checked)
                  }
                }}
                disabled={applyMedian === true}
              />
              <span>apply_stock</span>
              {applyMedian && (
                <small style={{ color: 'var(--text-secondary, #bdc3c7)', fontSize: '0.7rem', marginLeft: '0.25rem' }}>
                  (disabled when apply_median is enabled)
                </small>
              )}
            </label>
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={applyMedian}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                  if (e.target.checked && applyStock) {
                    setApplyMedian(true)
                    setApplyStock(false)
                  } else {
                    setApplyMedian(e.target.checked)
                  }
                }}
              />
              <span>apply_median</span>
              {applyMedian && applyStock && (
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

  const jsonOutput = generateJson

  // Validate JSON before showing
  let jsonError: string | null = null
  try {
    JSON.parse(jsonOutput)
  } catch (e) {
    jsonError = e instanceof Error ? e.message : 'Invalid JSON'
  }

  // Check for conflicts
  const hasConflict = applyStock && applyMedian

  return (
    <div className="ties-lora-config">
      <div className="config-header">
        <h2>TIES LoRA Merging Configuration</h2>
        <p>Create JSON configuration for ties_lora_with_json function</p>
      </div>

      <div className="config-content">
        <div className="controls-section">
          <div className="basic-controls">
            <div className="control-group">
              <label htmlFor="num-loras">Number of LoRA (2-10):</label>
              <div className="slider-with-value">
                <input
                  id="num-loras"
                  type="range"
                  min="2"
                  max="10"
                  value={numLoras}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setNumLoras(parseInt(e.target.value))
                  }
                />
                <span className="slider-value">{numLoras}</span>
              </div>
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

          <div className="action-buttons">
            <button onClick={resetToDefaults} className="reset-btn">
              Reset to Defaults
            </button>
            <CopyButton
              text={jsonOutput}
              label="Copy JSON"
              disabled={jsonError !== null || Object.keys(validationErrors).length > 0 || hasConflict}
            />
          </div>
          {jsonError && (
            <div style={{ color: 'var(--error-color, #e74c3c)', fontSize: '0.85rem', marginTop: '0.5rem' }}>
              JSON Error: {jsonError}
            </div>
          )}
          {hasConflict && (
            <div style={{ color: 'var(--error-color, #e74c3c)', fontSize: '0.85rem', marginTop: '0.5rem' }}>
              Error: apply_stock and apply_median cannot both be enabled
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

