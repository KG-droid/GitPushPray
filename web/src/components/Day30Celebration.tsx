import { Box, Card, CardContent, Stack, Typography } from '@mui/material'
import CelebrationRounded from '@mui/icons-material/CelebrationRounded'
import { repository } from '../data/repository'
import { useDemo } from '../demo/useDemo'
import { monthSummary } from '../domain/pulse'

/** The Day 30 moment: what the joiner got done, who they met, and how their confidence has moved. */
export function Day30Celebration() {
  const { journey } = useDemo()
  const m = monthSummary(journey, repository.listEvents(journey.persona.id))
  const grew = m.first && m.last && m.pulses > 1 && m.last.confident > m.first.confident

  const stats = [
    { value: m.stepsDone, label: m.stepsDone === 1 ? 'step done' : 'steps done' },
    { value: m.meetups, label: m.meetups === 1 ? 'buddy meetup' : 'buddy meetups' },
    { value: m.pulses, label: m.pulses === 1 ? 'check-in' : 'check-ins' },
  ]

  return (
    <Card sx={{ bgcolor: 'primary.main', color: 'primary.contrastText', border: 0 }}>
      <CardContent sx={{ p: 3 }}>
        <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center', mb: 1 }}>
          <CelebrationRounded sx={{ fontSize: 36 }} />
          <Typography variant="h5" component="h2">
            You made it to Day 30
          </Typography>
        </Stack>
        <Typography variant="body2" sx={{ opacity: 0.9, mb: 2 }}>
          {grew
            ? `Your confidence has gone from ${m.first!.confident} to ${m.last!.confident} out of 5 since you started. Well done, ${journey.persona.firstName}.`
            : `A month in, ${journey.persona.firstName}. Thank you for helping us make joining better for the next person.`}
        </Typography>
        <Stack direction="row" spacing={1.5}>
          {stats.map((s) => (
            <Box key={s.label} sx={{ flex: 1, bgcolor: 'rgba(255,255,255,0.15)', borderRadius: 3, p: 1.5, textAlign: 'center' }}>
              <Typography variant="h5" component="p">
                {s.value}
              </Typography>
              <Typography variant="caption" sx={{ opacity: 0.9 }}>
                {s.label}
              </Typography>
            </Box>
          ))}
        </Stack>
      </CardContent>
    </Card>
  )
}
