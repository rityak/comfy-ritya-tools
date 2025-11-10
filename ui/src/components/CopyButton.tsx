import { ComfyApp } from '@comfyorg/comfyui-frontend-types'
import './CopyButton.css'

declare global {
  interface Window {
    app?: ComfyApp
  }
}

interface CopyButtonProps {
  text: string
  label?: string
  onCopy?: () => void
  className?: string
  disabled?: boolean
}

export function CopyButton({ text, label = 'Copy', onCopy, className = '', disabled = false }: CopyButtonProps) {
  const handleCopy = () => {
    if (disabled) return
    
    navigator.clipboard.writeText(text)
    
    if (window.app?.extensionManager?.toast) {
      window.app.extensionManager.toast.add({
        severity: 'success',
        summary: 'Copied',
        detail: 'Content copied to clipboard',
        life: 3000
      })
    } else {
      alert('Copied to clipboard!')
    }
    
    onCopy?.()
  }

  return (
    <button onClick={handleCopy} className={`copy-btn ${className}`} disabled={disabled}>
      {label}
    </button>
  )
}

