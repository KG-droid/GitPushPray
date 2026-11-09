import { IconButton, Tooltip } from '@mui/material'
import { useColorScheme } from '@mui/material/styles'
import DarkModeRounded from '@mui/icons-material/DarkModeRounded'
import LightModeRounded from '@mui/icons-material/LightModeRounded'
import BrightnessAutoRounded from '@mui/icons-material/BrightnessAutoRounded'

const order = ['system', 'light', 'dark'] as const
const labels = { system: 'Theme: follow phone', light: 'Theme: light', dark: 'Theme: dark' }

/** Cycles system → light → dark. Defaults to following the phone's setting. */
export function ThemeModeButton() {
  const { mode, setMode } = useColorScheme()
  if (!mode) return null

  const next = order[(order.indexOf(mode) + 1) % order.length]
  const Icon = mode === 'light' ? LightModeRounded : mode === 'dark' ? DarkModeRounded : BrightnessAutoRounded

  return (
    <Tooltip title={labels[mode]}>
      <IconButton aria-label={labels[mode]} onClick={() => setMode(next)}>
        <Icon />
      </IconButton>
    </Tooltip>
  )
}
