import { useState } from 'react'

import './RityaTools.css'
import { TabButton } from './components'
import { KarcherMeanConfig, WeightSumConfig, TIESConfig, TIESLoraConfig } from './tabs'

type TabType = 'karcher_mean' | 'weight_sum' | 'ties' | 'ties_lora'

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
          label="Weight Sum"
          active={activeTab === 'weight_sum'}
          onClick={() => setActiveTab('weight_sum')}
        />
        <TabButton
          label="TIES Merging"
          active={activeTab === 'ties'}
          onClick={() => setActiveTab('ties')}
        />
        <TabButton
          label="TIES LoRA"
          active={activeTab === 'ties_lora'}
          onClick={() => setActiveTab('ties_lora')}
        />
      </div>

      <div className="tab-content">
        {activeTab === 'karcher_mean' && <KarcherMeanConfig />}
        {activeTab === 'weight_sum' && <WeightSumConfig />}
        {activeTab === 'ties' && <TIESConfig />}
        {activeTab === 'ties_lora' && <TIESLoraConfig />}
      </div>
    </div>
  )
}

export default RityaTools
