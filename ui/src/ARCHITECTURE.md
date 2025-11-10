# Ritya Tools - Architecture

## Project Structure

```
ui/src/
├── components/          # Reusable UI components
│   ├── CopyButton.tsx  # Copy to clipboard button with toast notification
│   ├── JSONPreview.tsx # JSON preview with copy functionality
│   ├── TabButton.tsx   # Tab button component
│   └── index.ts        # Component exports
│
├── tabs/               # Tab components (different utilities)
│   ├── KarcherMeanConfig.tsx  # Karcher Mean configuration generator
│   ├── ExampleTab.tsx         # Example tab template
│   └── index.ts               # Tab exports
│
├── RityaTools.tsx      # Main component with tab management
├── main.tsx            # Entry point, registers extension with ComfyUI
└── index.css           # Global styles and CSS variables
```

## Component Architecture

### Reusable Components (`components/`)

These components can be used across different tabs:

- **CopyButton**: Handles copying text to clipboard with ComfyUI toast notifications
- **JSONPreview**: Displays formatted JSON with copy button
- **TabButton**: Reusable tab button with active state

### Tab Components (`tabs/`)

Each tab is a self-contained component:

- **KarcherMeanConfig**: Full configuration generator for Karcher Mean
- **ExampleTab**: Template for new tabs

### Main Component

**RityaTools**: Manages tab state and renders active tab

## Adding New Tabs

1. Create new component in `tabs/`:
   ```tsx
   // tabs/MyNewTab.tsx
   export function MyNewTab() {
     return <div>My New Tab Content</div>
   }
   ```

2. Export from `tabs/index.ts`:
   ```tsx
   export { MyNewTab } from './MyNewTab'
   ```

3. Add to `RityaTools.tsx`:
   ```tsx
   type TabType = 'karcher_mean' | 'example' | 'my_new_tab'
   
   // In render:
   <TabButton
     label="My New Tab"
     active={activeTab === 'my_new_tab'}
     onClick={() => setActiveTab('my_new_tab')}
   />
   
   // In content:
   {activeTab === 'my_new_tab' && <MyNewTab />}
   ```

## Using Reusable Components

### CopyButton
```tsx
import { CopyButton } from '../components'

<CopyButton 
  text="Text to copy" 
  label="Copy" 
  className="optional-class"
  onCopy={() => console.log('Copied!')}
/>
```

### JSONPreview
```tsx
import { JSONPreview } from '../components'

<JSONPreview 
  json={jsonString}
  title="My JSON"
  maxHeight="300px"
  showCopyButton={true}
/>
```

## CSS Architecture

- Global styles: `index.css` (CSS variables, base styles)
- Component styles: Each component has its own CSS file
- Tab styles: Each tab has its own CSS file
- Styles use CSS variables for theming

