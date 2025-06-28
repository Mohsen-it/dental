import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './App.css'
import './styles/globals.css'
import { initMockAPI } from './utils/initMockAPI'

// Initialize mock API for demo version
initMockAPI()

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
