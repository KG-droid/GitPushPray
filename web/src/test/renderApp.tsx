import { render } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { CssBaseline, ThemeProvider } from '@mui/material'
import App from '../App'
import { repository } from '../data/repository'
import { DemoProvider } from '../demo/DemoProvider'
import type { DemoRole } from '../demo/useDemo'
import { theme } from '../theme/theme'

/** Renders the whole app at a route, for a persona, on a fixed demo date. */
export function renderApp(
  path: string,
  { personaId = 'priya', today = '2026-11-09', role = 'joiner' }: { personaId?: string; today?: string; role?: DemoRole } = {},
) {
  localStorage.clear()
  repository.reset()
  localStorage.setItem('lbg-joiner:demo:v1', JSON.stringify({ personaId, todayOverride: today, role }))
  return render(
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <MemoryRouter initialEntries={[path]}>
        <DemoProvider>
          <App />
        </DemoProvider>
      </MemoryRouter>
    </ThemeProvider>,
  )
}
