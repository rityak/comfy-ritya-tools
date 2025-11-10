import { useState } from 'react'
import { TabButton } from './components'
import { ExampleTab, KarcherMeanConfig } from './tabs'
import './RityaTools.css'

type TabType = 'karcher_mean' | 'example'

function RityaTools() {
  const [activeTab, setActiveTab] = useState<TabType>('karcher_mean')

  return (
    <div className="ritya-tools-container">
      <div className="tabs-header">
        <TabButton
          label="Karcher Mean"
          active={activeTab === 'karcher_mean'}
          onClick={() => setActiveTab('karcher_mean')}
        />
        <TabButton
          label="Example"
          active={activeTab === 'example'}
          onClick={() => setActiveTab('example')}
        />
      </div>

      <div className="tab-content">
        {activeTab === 'karcher_mean' && <KarcherMeanConfig />}
        {activeTab === 'example' && <ExampleTab />}
      </div>
    </div>
  )
}

export default RityaTools

