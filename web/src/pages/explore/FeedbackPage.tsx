import { useState } from 'react'
import { Box, Button, Card, CardContent, Chip, Stack, TextField, ToggleButton, ToggleButtonGroup, Typography } from '@mui/material'
import CheckCircleRounded from '@mui/icons-material/CheckCircleRounded'
import { useSearchParams } from 'react-router-dom'
import { useDemo } from '../../demo/useDemo'
import { MILESTONES, TEXT_LIMIT, dueCheckIns, nextCheckIn, type CheckInMilestone } from '../../domain/feedback'
import { SubPageHeader } from './SubPageHeader'

const MOODS = [
  { value: 1, label: 'Rough', emoji: '😟' },
  { value: 2, label: 'Meh', emoji: '😕' },
  { value: 3, label: 'OK', emoji: '😐' },
  { value: 4, label: 'Good', emoji: '🙂' },
  { value: 5, label: 'Great', emoji: '😄' },
]

/** Check-ins at Day 1, Week 1 and Day 30. Day 30 adds the eNPS question and two open questions. */
export function FeedbackPage() {
  const { journey, answeredCheckIns, submitCheckIn } = useDemo()
  const [params] = useSearchParams()
  const sinceStart = -journey.daysToStart
  const due = dueCheckIns(sinceStart, answeredCheckIns)
  const requested = params.get('m') as CheckInMilestone | null
  const current = MILESTONES.find((m) => m.id === requested && due.some((d) => d.id === m.id)) ?? due[0]
  const upcoming = nextCheckIn(sinceStart, answeredCheckIns)

  return (
    <Stack spacing={2.5} sx={{ pt: 1 }}>
      <SubPageHeader title="Your feedback" subtitle="Tell us how it’s really going. It helps us fix things for the next joiner." />

      {current ? (
        <CheckInForm key={current.id} milestone={current.id} onSubmit={submitCheckIn} />
      ) : (
        <Card>
          <CardContent sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
            <CheckCircleRounded color="primary" sx={{ fontSize: 40 }} />
            <Box>
              <Typography variant="h6">Thank you</Typography>
              <Typography variant="body2" color="text.secondary">
                {upcoming
                  ? `You’re up to date. Your ${upcoming.label} check-in opens ${
                      upcoming.opensAfterDays === 0 ? 'on your first day' : `on Day ${upcoming.opensAfterDays + 1}`
                    }.`
                  : 'You’ve done all three check-ins. Your answers are already helping the team improve things for new joiners.'}
              </Typography>
            </Box>
          </CardContent>
        </Card>
      )}

      <Typography variant="caption" color="text.secondary">
        Your answers are anonymous. The team sees them grouped by role, never with your name. Please don’t put personal details in the
        text boxes.
      </Typography>

      <Stack direction="row" sx={{ gap: 1, flexWrap: 'wrap' }} aria-label="Check-ins">
        {MILESTONES.map((m) => (
          <Chip
            key={m.id}
            size="small"
            label={`${m.label}${answeredCheckIns.includes(m.id) ? ' · done' : due.some((d) => d.id === m.id) ? ' · open' : ' · not yet'}`}
            color={due.some((d) => d.id === m.id) ? 'secondary' : 'default'}
            variant={answeredCheckIns.includes(m.id) ? 'filled' : 'outlined'}
          />
        ))}
      </Stack>
    </Stack>
  )
}

type Submit = ReturnType<typeof useDemo>['submitCheckIn']

function CheckInForm({ milestone, onSubmit }: { milestone: CheckInMilestone; onSubmit: Submit }) {
  const info = MILESTONES.find((m) => m.id === milestone)!
  const isDay30 = milestone === 'day-30'
  const [mood, setMood] = useState<number | null>(null)
  const [enps, setEnps] = useState<number | null>(null)
  const [missed, setMissed] = useState('')
  const [better, setBetter] = useState('')
  const [note, setNote] = useState('')

  const ready = isDay30 ? enps !== null : mood !== null

  return (
    <Card component="form" onSubmit={(e: React.FormEvent) => {
      e.preventDefault()
      if (!ready) return
      onSubmit(isDay30 ? { milestone, enps: enps ?? undefined, mood: mood ?? undefined, missed, better } : { milestone, mood: mood ?? undefined, note })
    }}>
      <CardContent sx={{ p: 2.5 }}>
        <Stack spacing={2.5}>
          <Box>
            <Typography variant="overline" color="text.secondary">
              {info.label} check-in
            </Typography>
            <Typography variant="h6" component="h2">
              {info.title}
            </Typography>
          </Box>

          {isDay30 && (
            <Box component="fieldset" sx={{ border: 0, p: 0, m: 0 }}>
              <Typography component="legend" variant="subtitle2" sx={{ mb: 1 }}>
                How likely are you to recommend Lloyds as a place to work to a friend?
              </Typography>
              <ToggleButtonGroup
                exclusive
                value={enps}
                onChange={(_, v: number | null) => setEnps(v)}
                aria-label="Likelihood to recommend, 0 to 10"
                sx={{ display: 'flex', gap: 0.5, '& .MuiToggleButton-root': { flex: 1, minWidth: 0, px: 0, border: 1, borderColor: 'divider', borderRadius: '8px !important', ml: '0 !important' } }}
              >
                {Array.from({ length: 11 }, (_, i) => (
                  <ToggleButton key={i} value={i} aria-label={String(i)} color="primary">
                    {i}
                  </ToggleButton>
                ))}
              </ToggleButtonGroup>
              <Stack direction="row" sx={{ justifyContent: 'space-between', mt: 0.5 }}>
                <Typography variant="caption" color="text.secondary">
                  Not at all likely
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Extremely likely
                </Typography>
              </Stack>
            </Box>
          )}

          <Box component="fieldset" sx={{ border: 0, p: 0, m: 0 }}>
            <Typography component="legend" variant="subtitle2" sx={{ mb: 1 }}>
              {isDay30 ? 'And overall, how has your first month felt?' : 'How is it going so far?'}
            </Typography>
            <ToggleButtonGroup exclusive fullWidth value={mood} onChange={(_, v: number | null) => setMood(v)} aria-label="How it's going, 1 to 5" size="small">
              {MOODS.map((m) => (
                <ToggleButton key={m.value} value={m.value} aria-label={m.label} color="primary" sx={{ flexDirection: 'column', py: 1 }}>
                  <span aria-hidden>{m.emoji}</span>
                  <Typography variant="caption">{m.label}</Typography>
                </ToggleButton>
              ))}
            </ToggleButtonGroup>
          </Box>

          {isDay30 ? (
            <>
              <TextField
                label="What did we miss?"
                helperText="Anything you needed to know or have that we didn’t give you"
                value={missed}
                onChange={(e) => setMissed(e.target.value)}
                multiline
                minRows={2}
                slotProps={{ htmlInput: { maxLength: TEXT_LIMIT } }}
              />
              <TextField
                label="What could we do better?"
                helperText="One thing you’d change for the next joiner"
                value={better}
                onChange={(e) => setBetter(e.target.value)}
                multiline
                minRows={2}
                slotProps={{ htmlInput: { maxLength: TEXT_LIMIT } }}
              />
            </>
          ) : (
            <TextField
              label="Anything getting in the way? (optional)"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              multiline
              minRows={2}
              slotProps={{ htmlInput: { maxLength: TEXT_LIMIT } }}
            />
          )}

          <Button type="submit" variant="contained" size="large" disabled={!ready}>
            Send feedback
          </Button>
        </Stack>
      </CardContent>
    </Card>
  )
}
