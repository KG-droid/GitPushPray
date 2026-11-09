import { Box, Chip, Drawer, IconButton, Stack, Typography } from '@mui/material'
import CloseRounded from '@mui/icons-material/CloseRounded'
import { useDemo } from '../demo/useDemo'
import { STAGES } from '../domain/journey'
import { GOAL_SEPARATOR } from '../data/goals'
import { repository } from '../data/repository'
import { IconTile } from './IconTile'
import { StepActions } from './StepActions'

/**
 * Bottom sheet with the full detail of one step. Looks the step up from the live journey,
 * so it updates as soon as the step is completed.
 */
export function StepSheet({ stepId, onClose }: { stepId: string | null; onClose: () => void }) {
  const { journey } = useDemo()
  const step = journey.steps.find((s) => s.id === stepId)
  const stage = STAGES.find((s) => s.id === step?.stage)
  // The welcome pack carries the goals the manager set (a chain reaction from the manager view).
  const goalsValue = journey.steps.find((s) => s.id === 'mgr-set-goals')?.value
  const goals = goalsValue ? goalsValue.split(GOAL_SEPARATOR).filter(Boolean) : []
  const managerName = repository.getPerson(journey.persona.managerId)?.name.split(' ')[0] ?? 'your manager'

  return (
    <Drawer
      anchor="bottom"
      open={!!step}
      onClose={onClose}
      slotProps={{
        paper: { sx: { maxWidth: 440, mx: 'auto', borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '88dvh' } },
      }}
    >
      {step && (
        <Box sx={{ p: 3, pb: 'calc(24px + env(safe-area-inset-bottom))' }} role="dialog" aria-label={step.title}>
          <Box sx={{ width: 40, height: 4, borderRadius: 2, bgcolor: 'divider', mx: 'auto', mb: 2 }} />
          <Stack direction="row" spacing={2} sx={{ alignItems: 'flex-start', mb: 2 }}>
            <IconTile name={step.icon} muted={step.state === 'locked'} size={52} />
            <Box sx={{ flex: 1 }}>
              {stage && <Chip size="small" label={stage.title} sx={{ mb: 0.75 }} />}
              <Typography variant="h6" component="h2" sx={{ lineHeight: 1.3 }}>
                {step.title}
              </Typography>
            </Box>
            <IconButton aria-label="Close" onClick={onClose} edge="end">
              <CloseRounded />
            </IconButton>
          </Stack>
          <Typography color="text.secondary" sx={{ mb: 3 }}>
            {step.body}
          </Typography>
          {step.id === 'welcome-pack' && goals.length > 0 && step.state !== 'locked' && (
            <Box sx={{ bgcolor: 'action.hover', borderRadius: 3, p: 2, mb: 3 }}>
              <Typography variant="overline" color="text.secondary">
                Your first 3 months, from {managerName}
              </Typography>
              <Box component="ol" sx={{ m: 0, pl: 2.5 }}>
                {goals.map((g) => (
                  <Typography key={g} component="li" variant="body2" sx={{ mb: 0.5 }}>
                    {g}
                  </Typography>
                ))}
              </Box>
            </Box>
          )}
          <StepActions step={step} onDone={step.kind === 'choice' ? onClose : undefined} />
        </Box>
      )}
    </Drawer>
  )
}
