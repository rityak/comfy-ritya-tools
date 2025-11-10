import './TabButton.css'

interface TabButtonProps {
  label: string
  active: boolean
  onClick: () => void
}

export function TabButton({ label, active, onClick }: TabButtonProps) {
  return (
    <button
      className={`tab-button ${active ? 'active' : ''}`}
      onClick={onClick}
    >
      {label}
    </button>
  )
}
