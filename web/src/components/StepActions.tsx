import { useState } from 'react'
import { Box, Button, Card, CardActionArea, Chip, Radio, Stack, Typography } from '@mui/material'
import CheckCircleRounded from '@mui/icons-material/CheckCircleRounded'
import LockRounded from '@mui/icons-material/LockRounded'
import { useDemo } from '../demo/useDemo'
import { formatShortDate } from '../domain/dates'
import type { StepView } from '../domain/journey'
import { laptopOrder } from '../domain/laptop'

/**
 * The interactive part of a step: choice options and a done button when available,
 * the outcome when done, and the unlock reason when locked.
 */
export function StepActions({ step, onDone }: { step: StepView; onDone?: () => void }) {
  const { completeStep, journey } = useDemo()
  const [choice, setChoice] = useState<string | undefined>()
  const laptopSpec = step.id === 'choose-kit' ? laptopOrder(journey).spec : undefined

  if (step.state === 'locked') {
    return (
      <Stack direction="row" spacing={1} sx={{ alignItems: 'center', color: 'text.secondary' }}>
        <LockRounded fontSize="small" />
        <Typography variant="body2">{step.lockedHint ?? 'Unlocks later in your journey.'}</Typography>
      </Stack>
    )
  }

  if (step.state === 'done') {
    const picked = step.options?.find((o) => o.value === step.value)
    return (
      <Stack direction="row" spacing={1} sx={{ alignItems: 'center', color: 'primary.main' }}>
        <CheckCircleRounded fontSize="small" />
        <Typography variant="body2" sx={{ fontWeight: 600 }}>
          {picked ? `You chose: ${picked.label}` : step.kind === 'content' ? 'Read' : 'Done'}
          {step.doneAt && ` · ${formatShortDate(step.doneAt)}`}
        </Typography>
      </Stack>
    )
  }

  const finish = () => {
    completeStep(step.id, { value: choice })
    onDone?.()
  }

  return (
    <Box>
      {laptopSpec && (
        <Box sx={{ bgcolor: 'action.hover', borderRadius: 3, p: 1.5, mb: 1.5 }}>
          <Typography variant="body2" sx={{ fontWeight: 600 }}>
            Your manager has set you up with the {laptopSpec.label} spec
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {laptopSpec.detail} Every model below comes in this spec.
          </Typography>
        </Box>
      )}
      {step.kind === 'choice' && step.options && (
        <Stack spacing={1} sx={{ mb: 2 }} role="radiogroup" aria-label={step.title}>
          {step.options.map((o) => {
            const selected = choice === o.value
            return (
              <Card
                key={o.value}
                variant="outlined"
                sx={{ borderColor: selected ? 'primary.main' : undefined, borderWidth: selected ? 2 : 1 }}
              >
                <CardActionArea onClick={() => setChoice(o.value)} role="radio" aria-checked={selected}>
                  <Stack direction="row" spacing={1} sx={{ alignItems: 'center', p: 1.25 }}>
                    <Radio checked={selected} size="small" tabIndex={-1} />
                    <Box>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {o.label}
                      </Typography>
                      {o.detail && (
                        <Typography variant="caption" color="text.secondary">
                          {o.detail}
                        </Typography>
                      )}
                    </Box>
                  </Stack>
                </CardActionArea>
              </Card>
            )
          })}
        </Stack>
      )}

      <Stack direction="row" spacing={1} sx={{ alignItems: 'center', flexWrap: 'wrap', rowGap: 1 }}>
        <Button variant="contained" disabled={step.kind === 'choice' && !choice} onClick={finish}>
          {step.kind === 'choice' ? 'Confirm choice' : step.kind === 'content' ? 'Got it' : 'Mark as done'}
        </Button>
        {step.minutes && <Chip size="small" label={`${step.minutes} min`} />}
        {step.dueDate && <Chip size="small" variant="outlined" label={`By ${formatShortDate(step.dueDate)}`} />}
      </Stack>
    </Box>
  )
}
