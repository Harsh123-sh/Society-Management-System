import { StrictMode } from 'react'
import { useEffect } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App.jsx'
import ErrorBoundary from './components/ErrorBoundary.jsx'
import { initializeWebPushNotifications } from './services/pushNotificationService'
import { ThemeProvider } from './contexts/ThemeContext'
import { LanguageProvider } from './contexts/LanguageContext'
import { applyAppearanceSettings, getAppearanceSettings } from './utils/appearance'

function PushBootstrap() {
  useEffect(() => {
    applyAppearanceSettings(getAppearanceSettings())
    initializeWebPushNotifications().catch(() => {})
  }, [])

  return <App />
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary>
      <BrowserRouter>
        <LanguageProvider>
          <ThemeProvider>
            <PushBootstrap />
          </ThemeProvider>
        </LanguageProvider>
      </BrowserRouter>
    </ErrorBoundary>
  </StrictMode>,
)