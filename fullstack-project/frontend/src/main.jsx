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
import { SocietyProvider } from './contexts/SocietyContext'
import { applyAppearanceSettings, getAppearanceSettings } from './utils/appearance'
import './i18n'

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
          <SocietyProvider>
            <ThemeProvider>
              <PushBootstrap />
            </ThemeProvider>
          </SocietyProvider>
        </LanguageProvider>
      </BrowserRouter>
    </ErrorBoundary>
  </StrictMode>,
)
