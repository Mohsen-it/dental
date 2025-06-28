import { mockElectronAPI } from '../services/mockElectronAPI'

/**
 * Initialize mock ElectronAPI for demo version
 * This replaces the real Electron IPC with mock data
 */
export function initMockAPI() {
  // Only initialize if we're in a browser environment (not Electron)
  if (typeof window !== 'undefined' && !window.electronAPI) {
    console.log('🎭 Initializing Mock ElectronAPI for demo version')
    
    // Set up the mock API
    window.electronAPI = mockElectronAPI as any
    
    // Add demo banner to indicate this is a demo version
    const demoBanner = document.createElement('div')
    demoBanner.innerHTML = `
      <div style="
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        background: linear-gradient(90deg, #3b82f6, #8b5cf6);
        color: white;
        text-align: center;
        padding: 8px;
        font-size: 14px;
        font-weight: 500;
        z-index: 9999;
        box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      ">
        🎭 نسخة تجريبية - Demo Version | جميع البيانات وهمية للعرض فقط
      </div>
    `
    document.body.appendChild(demoBanner)
    
    // Adjust body padding to account for demo banner
    document.body.style.paddingTop = '40px'
    
    console.log('✅ Mock ElectronAPI initialized successfully')
  }
}

/**
 * Check if we're running in demo mode
 */
export function isDemoMode(): boolean {
  return typeof window !== 'undefined' && 
         window.electronAPI && 
         typeof (window.electronAPI as any).system?.getVersion === 'function' &&
         (window.electronAPI as any).system.getVersion().then((v: string) => v.includes('demo'))
}
