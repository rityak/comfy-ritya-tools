import { CopyButton } from './CopyButton'
import './JSONPreview.css'

interface JSONPreviewProps {
  json: string
  title?: string
  showCopyButton?: boolean
  maxHeight?: string
}

export function JSONPreview({ 
  json, 
  title = 'Generated JSON', 
  showCopyButton = true,
  maxHeight = '200px'
}: JSONPreviewProps) {
  return (
    <div className="json-preview">
      {title && <h3>{title}</h3>}
      <pre className="json-display" style={{ maxHeight }}>
        {json}
      </pre>
      {showCopyButton && (
        <CopyButton text={json} label="Copy JSON" className="full-width" />
      )}
    </div>
  )
}

