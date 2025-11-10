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
}

export function CopyButton({ text, label = 'Copy', onCopy, className = '' }: CopyButtonProps) {
  const handleCopy = () => {
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
    <button onClick={handleCopy} className={`copy-btn ${className}`}>
      {label}
    </button>
  )
}

