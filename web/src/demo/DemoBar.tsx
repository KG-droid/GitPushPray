import { Box, Button, MenuItem, Select, Stack, ToggleButton, ToggleButtonGroup, Typography } from '@mui/material'
import RestartAltRounded from '@mui/icons-material/RestartAltRounded'
import { useNavigate } from 'react-router-dom'
import { repository } from '../data/repository'
import { useDemo, type DemoRole } from './useDemo'

export const DEMO_BAR_HEIGHT = 44

const routeFor = (role: DemoRole) =>
  role === 'manager' ? '/manager' : role === 'buddy' ? '/buddy' : role === 'admin' ? '/admin' : '/today'

/** Always-visible red strip for presenters: switch who we're viewing as, and reset their data to redo steps. */
export function DemoBar() {
  const demo = useDemo()
  const navigate = useNavigate()
  const { persona } = demo.journey
  const hasBuddy = !!persona.buddyId
  const personas = repository.listPersonas().filter((p) => !p.hiddenFromSwitcher || p.id === persona.id)

  return (
    <Box
      role="region"
      aria-label="Demo controls"
      sx={{
        position: 'sticky',
        top: 0,
        zIndex: (t) => t.zIndex.appBar + 1,
        height: DEMO_BAR_HEIGHT,
        bgcolor: '#C62828',
        color: '#fff',
        display: 'flex',
        alignItems: 'center',
        px: 1.5,
        pt: 'env(safe-area-inset-top)',
        boxSizing: 'content-box',
        overflowX: 'auto',
      }}
    >
      <Stack direction="row" spacing={1} sx={{ alignItems: 'center', mx: 'auto', flexShrink: 0 }}>
        <Typography variant="overline" sx={{ fontWeight: 700, lineHeight: 1, display: { xs: 'none', md: 'block' } }}>
          Demo
        </Typography>
        <ToggleButtonGroup
          exclusive
          size="small"
          value={demo.role}
          aria-label="View as"
          onChange={(_, role: DemoRole | null) => {
            if (!role) return
            demo.setRole(role)
            navigate(routeFor(role))
          }}
          sx={{
            '& .MuiToggleButton-root': {
              color: '#fff',
              borderColor: 'rgba(255,255,255,0.5)',
              py: 0.25,
              textTransform: 'none',
              '&.Mui-selected': { bgcolor: '#fff', color: '#C62828', fontWeight: 700 },
              '&.Mui-selected:hover': { bgcolor: '#fff' },
              '&.Mui-disabled': { color: 'rgba(255,255,255,0.4)' },
            },
          }}
        >
          <ToggleButton value="joiner">Joiner</ToggleButton>
          <ToggleButton value="manager">Manager</ToggleButton>
          <ToggleButton value="buddy" disabled={!hasBuddy}>
            Buddy
          </ToggleButton>
          <ToggleButton value="admin">Admin</ToggleButton>
        </ToggleButtonGroup>
        <Select
          size="small"
          value={persona.id}
          aria-label="Demo user"
          onChange={(e) => demo.setPersona(e.target.value)}
          sx={{
            color: '#fff',
            height: 32,
            '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.5)' },
            '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#fff' },
            '& .MuiSvgIcon-root': { color: '#fff' },
          }}
        >
          {personas.map((p) => (
            <MenuItem key={p.id} value={p.id}>
              {p.firstName} · {p.role}
            </MenuItem>
          ))}
        </Select>
        <Button
          size="small"
          variant="outlined"
          startIcon={<RestartAltRounded />}
          onClick={demo.resetPersona}
          sx={{ color: '#fff', borderColor: '#fff', textTransform: 'none', whiteSpace: 'nowrap', height: 32 }}
        >
          Reset {persona.firstName}
        </Button>
      </Stack>
    </Box>
  )
}
