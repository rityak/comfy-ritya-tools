import { ComfyApp } from '@comfyorg/comfyui-frontend-types'
import React, { Suspense } from 'react'
import ReactDOM from 'react-dom/client'

import './index.css'

// Declare global ComfyUI objects
declare global {
  interface Window {
    app?: ComfyApp
  }
}

// Lazy load the RityaTools component
const RityaTools = React.lazy(() => import('./RityaTools'))

// Function to wait for document and app to be ready
function waitForInit(): Promise<void> {
  return new Promise((resolve) => {
    // Check if document is ready
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', checkApp)
    } else {
      checkApp()
    }

    // Check if app is available
    function checkApp() {
      if (window.app) {
        resolve()
      } else {
        // Poll for app availability
        const interval = setInterval(() => {
          if (window.app) {
            console.log('App initialized')
            clearInterval(interval)
            resolve()
          }
        }, 50)

        // Set timeout to avoid infinite polling
        setTimeout(() => {
          clearInterval(interval)
          console.error('Timeout waiting for app to initialize')
          resolve() // Continue anyway to avoid blocking
        }, 5000)
      }
    }
  })
}

// Check if comfy-mecha is installed
async function checkComfyMechaInstalled(): Promise<boolean> {
  try {
    console.log('[Ritya Tools] Checking if comfy-mecha is installed...')
    const response = await fetch('/comfy-ritya-tools/check_mecha')
    if (!response.ok) {
      console.warn('[Ritya Tools] Failed to check comfy-mecha status:', response.status, response.statusText)
      return false
    }
    const data = await response.json()
    console.log('[Ritya Tools] API response:', data)
    const isInstalled = data.installed === true
    console.log('[Ritya Tools] comfy-mecha installed:', isInstalled)
    return isInstalled
  } catch (error) {
    console.warn('[Ritya Tools] Error checking comfy-mecha:', error)
    return false
  }
}

// Initialize the extension once everything is ready
async function initializeExtension(): Promise<void> {
  try {
    // Wait for document and ComfyUI app
    await waitForInit()
    console.log('App:', window.app)

    if (!window.app) {
      console.error('ComfyUI app not available')
      return
    }

    // Check if comfy-mecha is installed before registering the tab
    console.log('[Ritya Tools] Starting comfy-mecha check...')
    const isComfyMechaInstalled = await checkComfyMechaInstalled()
    console.log('[Ritya Tools] Check result:', isComfyMechaInstalled)
    
    if (!isComfyMechaInstalled) {
      console.log('[Ritya Tools] comfy-mecha not found. Ritya Tools tab will NOT be displayed.')
      return
    }
    
    console.log('[Ritya Tools] comfy-mecha found. Registering Ritya Tools tab...')

    // Register Ritya Tools sidebar tab
    const rityaToolsTab = {
      id: 'ritya-tools',
      icon: 'pi pi-cog',
      title: 'Ritya Tools',
      tooltip: 'Ritya Tools - Configuration utilities',
      type: 'custom' as const,
      render: (element: HTMLElement) => {
        console.log('Rendering Ritya Tools Extension')
        // Create a container for our React app
        const container = document.createElement('div')
        container.id = 'ritya-tools-root'
        container.style.height = '100%'
        container.style.overflow = 'auto'
        element.appendChild(container)

        // Mount the React app to the container
        ReactDOM.createRoot(container).render(
          <React.StrictMode>
            <Suspense fallback={<div>Loading...</div>}>
              <RityaTools />
            </Suspense>
          </React.StrictMode>
        )
      }
    }

    window.app.extensionManager.registerSidebarTab(rityaToolsTab)

    console.log('Ritya Tools Extension initialized successfully')
  } catch (error) {
    console.error('Failed to initialize Ritya Tools Extension:', error)
  }
}

// Start initialization
void initializeExtension()
