import { useState } from 'react'
import { Box, Button, Stack, ToggleButton, ToggleButtonGroup, Typography } from '@mui/material'
import { useDemo } from '../demo/useDemo'
import { PULSE_QUESTIONS } from '../domain/pulse'

/** The two-question "connected and confident" pulse. Answers go to the trend, so one tap each is enough. */
export function PulseForm({ stepId }: { stepId: string }) {
  const { submitPulse } = useDemo()
  const [answers, setAnswers] = useState<Record<string, number>>({})
  const complete = PULSE_QUESTIONS.every((q) => answers[q.key])

  return (
    <Box>
      <Stack spacing={2.5} sx={{ mb: 2.5 }}>
        {PULSE_QUESTIONS.map((q) => (
          <Box key={q.key}>
            <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }} id={`pulse-${stepId}-${q.key}`}>
              {q.label}
            </Typography>
            <ToggleButtonGroup
              exclusive
              fullWidth
              size="small"
              color="primary"
              aria-labelledby={`pulse-${stepId}-${q.key}`}
              value={answers[q.key] ?? null}
              onChange={(_, v: number | null) => v && setAnswers((a) => ({ ...a, [q.key]: v }))}
            >
              {[1, 2, 3, 4, 5].map((n) => (
                <ToggleButton key={n} value={n} sx={{ minHeight: 44 }}>
                  {n}
                </ToggleButton>
              ))}
            </ToggleButtonGroup>
            <Stack direction="row" sx={{ justifyContent: 'space-between', mt: 0.5 }}>
              <Typography variant="caption" color="text.secondary">
                Not really
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Absolutely
              </Typography>
            </Stack>
          </Box>
        ))}
      </Stack>
      <Button
        variant="contained"
        disabled={!complete}
        onClick={() => {
          submitPulse(stepId, { knowWhoToAsk: answers.knowWhoToAsk, confident: answers.confident })
          // The Day 30 celebration appears at the top of Today; bring it into view.
          if (stepId === 'day-30-checkin') window.scrollTo({ top: 0, behavior: 'smooth' })
        }}
      >
        Send
      </Button>
      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
        Your manager sees the trend over time, never your individual answers.
      </Typography>
    </Box>
  )
}
