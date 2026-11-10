import {
  Box,
  Button,
  Chip,
  Divider,
  Drawer,
  List,
  ListItemButton,
  ListItemText,
  Stack,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from '@mui/material'
import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { repository } from '../data/repository'
import { addDays, formatShortDate } from '../domain/dates'
import { planCatchUp } from './catchUp'
import { SharePanel } from './SharePanel'
import { useDemo, type DemoRole } from './useDemo'

/** Presenter-only controls. Opened by long-pressing the logo. */
export function DemoPanel() {
  const demo = useDemo()
  const { journey } = demo
  const { persona } = journey
  const navigate = useNavigate()
  const managerName = repository.getPerson(persona.managerId)?.name.split(' ')[0] ?? 'Manager'
  const buddyName = persona.buddyId ? repository.getPerson(persona.buddyId)?.name.split(' ')[0] : undefined

  // How many steps "Catch up" would complete. Only worked out while the panel is open.
  const pending = useMemo(
    () =>
      demo.panelOpen
        ? planCatchUp({ persona, events: repository.listEvents(persona.id), today: demo.today, steps: repository.listSteps(), checks: repository.listChecks() }).length
        : 0,
    // journey changes whenever events or the date do
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [demo.panelOpen, journey],
  )

  const timePoints = [
    { label: 'Real today', date: null },
    { label: 'Offer accepted', date: persona.offerAcceptedOn },
    { label: '2 weeks to go', date: addDays(journey.startDate, -14) },
    { label: 'Day 1', date: journey.startDate },
    { label: 'End of week 1', date: addDays(journey.startDate, 4) },
    { label: 'Day 30', date: addDays(journey.startDate, 29) },
  ]

  return (
    <Drawer
      anchor="bottom"
      open={demo.panelOpen}
      onClose={() => demo.setPanelOpen(false)}
      slotProps={{ paper: { sx: { maxWidth: 440, mx: 'auto', borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '85dvh' } } }}
    >
      <Box sx={{ p: 2.5 }}>
        <Typography variant="overline" color="text.secondary">
          Demo controls
        </Typography>

        <Typography variant="subtitle2" sx={{ mt: 1, mb: 1 }}>
          View as
        </Typography>
        <ToggleButtonGroup
          exclusive
          fullWidth
          size="small"
          color="primary"
          value={demo.role === 'admin' ? null : demo.role}
          onChange={(_, role: DemoRole | null) => {
            if (!role) return
            demo.setRole(role)
            navigate(role === 'manager' ? '/manager' : role === 'buddy' ? '/buddy' : '/today')
            demo.setPanelOpen(false)
          }}
        >
          <ToggleButton value="joiner">{persona.firstName} (joiner)</ToggleButton>
          <ToggleButton value="manager">{managerName} (manager)</ToggleButton>
          <ToggleButton value="buddy" disabled={!buddyName}>
            {buddyName ?? 'No buddy'} (buddy)
          </ToggleButton>
        </ToggleButtonGroup>
        <Button
          fullWidth
          size="small"
          sx={{ mt: 1 }}
          variant={demo.role === 'admin' ? 'contained' : 'outlined'}
          onClick={() => {
            demo.setRole('admin')
            navigate('/admin')
            demo.setPanelOpen(false)
          }}
        >
          Admin (people experience team)
        </Button>

        <Typography variant="subtitle2" sx={{ mt: 2 }}>
          Joiner
        </Typography>
        <List dense disablePadding>
          {repository
            .listPersonas()
            .map((p) => (
            <ListItemButton
              key={p.id}
              selected={p.id === persona.id}
              onClick={() => {
                demo.setPersona(p.id)
                if (demo.role === 'manager') navigate('/manager')
                if (demo.role === 'buddy') navigate('/buddy')
                if (demo.role === 'admin') navigate('/admin')
              }}
              sx={{ borderRadius: 2 }}
            >
              <ListItemText primary={`${p.firstName} · ${p.role}`} secondary={p.tagline} />
            </ListItemButton>
          ))}
        </List>

        <Divider sx={{ my: 2 }} />

        <Typography variant="subtitle2">
          Time travel{' '}
          <Typography component="span" variant="body2" color="text.secondary">
            (it’s {formatShortDate(demo.today)}
            {demo.todayOverride ? ', simulated' : ''})
          </Typography>
        </Typography>
        <Stack direction="row" sx={{ flexWrap: 'wrap', gap: 1, mt: 1 }}>
          {timePoints.map((t) => (
            <Chip
              key={t.label}
              label={t.label}
              color={(t.date ?? null) === demo.todayOverride ? 'primary' : 'default'}
              onClick={() => demo.setToday(t.date)}
            />
          ))}
        </Stack>
        <Button fullWidth variant="outlined" sx={{ mt: 1.5 }} disabled={pending === 0} onClick={() => demo.catchUp()}>
          {pending ? `Catch up to this date (${pending} step${pending === 1 ? '' : 's'})` : 'Nothing to catch up'}
        </Button>
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
          Marks everything due by this date as done, so the app looks lived-in. Leaves the check-ins for you to do live.
        </Typography>

        <Divider sx={{ my: 2 }} />

        <Typography variant="subtitle2">When plans change</Typography>
        <Stack spacing={1} sx={{ mt: 1 }}>
          <Button variant="outlined" onClick={() => demo.slipStartDate(14)}>
            Slip start date by 2 weeks
          </Button>
          <Button
            variant="outlined"
            disabled={journey.vettingCleared}
            onClick={() => {
              const open = journey.checks.filter((c) => c.status !== 'cleared').at(-1)
              if (open) demo.delayCheck(open.id, 10)
            }}
          >
            Stall the slowest check
          </Button>
          <Button color="error" onClick={demo.resetPersona}>
            Reset {persona.firstName}’s journey
          </Button>
        </Stack>

        <Divider sx={{ my: 2 }} />

        <SharePanel />
      </Box>
    </Drawer>
  )
}
