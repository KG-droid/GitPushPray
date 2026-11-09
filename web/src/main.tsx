import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { CssBaseline, ThemeProvider } from '@mui/material'
import '@fontsource-variable/inter'
import { theme } from './theme/theme'
import App from './App.tsx'
import { DemoProvider } from './demo/DemoProvider'
import { captureAccessCode } from './assistant/access'

// A link like /?k=… (the judges' QR code) switches on the live assistant; keep the code and tidy the address bar.
captureAccessCode()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider theme={theme} defaultMode="system">
      <CssBaseline enableColorScheme />
      <BrowserRouter>
        <DemoProvider>
          <App />
        </DemoProvider>
      </BrowserRouter>
    </ThemeProvider>
  </StrictMode>,
)
