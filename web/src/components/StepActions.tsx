import { Fragment, useState } from 'react'
import { Box, Button, Card, CardActionArea, Checkbox, Chip, Radio, Stack, Typography } from '@mui/material'
import CheckCircleRounded from '@mui/icons-material/CheckCircleRounded'
import LockRounded from '@mui/icons-material/LockRounded'
import { useNavigate } from 'react-router-dom'
import { useDemo } from '../demo/useDemo'
import { formatShortDate } from '../domain/dates'
import type { StepView } from '../domain/journey'
import { joinPicks, parsePicks, pickedLabels, togglePick } from '../domain/equipment'
import { laptopOrder } from '../domain/laptop'

/**
 * The interactive part of a step: choice options and a done button when available,
 * the outcome when done, and the unlock reason when locked.
 */
/** `inline` forces the form here even when the step has its own home screen (`href`). */
export function StepActions({ step, onDone, inline = false }: { step: StepView; onDone?: () => void; inline?: boolean }) {
  const { completeStep, journey } = useDemo()
  const navigate = useNavigate()
  const [choice, setChoice] = useState<string | undefined>()
  const [changing, setChanging] = useState(false)
  const laptopSpec = step.id === 'choose-kit' ? laptopOrder(journey).spec : undefined
  const isChange = changing && step.canChange
  const picks = parsePicks(choice)

  if (step.state === 'locked') {
    return (
      <Stack direction="row" spacing={1} sx={{ alignItems: 'center', color: 'text.secondary' }}>
        <LockRounded fontSize="small" />
        <Typography variant="body2">{step.lockedHint ?? 'Unlocks later in your journey.'}</Typography>
      </Stack>
    )
  }

  if (step.state === 'done' && !isChange) {
    const picked = pickedLabels(step)
    return (
      <Stack spacing={1.5}>
        <Stack direction="row" spacing={1} sx={{ alignItems: 'center', color: 'primary.main' }}>
          <CheckCircleRounded fontSize="small" />
          <Typography variant="body2" sx={{ fontWeight: 600 }}>
            {picked ? `${step.doneBy === 'manager' ? 'Agreed with your manager' : 'You chose'}: ${picked}` : step.kind === 'content' ? 'Read' : 'Done'}
            {step.doneAt && ` · ${formatShortDate(step.doneAt)}`}
          </Typography>
        </Stack>
        {step.doneBy === 'manager' && step.owner === 'joiner' ? (
          <Typography variant="caption" color="text.secondary">
            To change this, talk to your manager.
          </Typography>
        ) : step.canChange && step.changeUntil ? (
          <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
            <Button
              variant="outlined"
              onClick={() => {
                setChoice(step.value)
                setChanging(true)
              }}
            >
              Change
            </Button>
            <Typography variant="caption" color="text.secondary">
              You can change this until {formatShortDate(step.changeUntil)}.
            </Typography>
          </Stack>
        ) : (
          step.changeUntil &&
          step.changeClosedHint && (
            <Stack direction="row" spacing={1} sx={{ alignItems: 'center', color: 'text.secondary' }}>
              <LockRounded fontSize="small" />
              <Typography variant="body2">
                Changes closed after {formatShortDate(step.changeUntil)}. {step.changeClosedHint}
              </Typography>
            </Stack>
          )
        )}
      </Stack>
    )
  }

  // Some steps live on their own screen (e.g. benefits): signpost there instead of duplicating the form.
  if (step.href && !inline) {
    return (
      <Stack direction="row" spacing={1} sx={{ alignItems: 'center', flexWrap: 'wrap', rowGap: 1 }}>
        <Button variant="contained" onClick={() => { onDone?.(); navigate(step.href!) }}>
          {step.hrefLabel ?? 'Open'}
        </Button>
        {step.minutes && <Chip size="small" label={`${step.minutes} min`} />}
        {step.dueDate && <Chip size="small" variant="outlined" label={`By ${formatShortDate(step.dueDate)}`} />}
      </Stack>
    )
  }

  const finish = () => {
    completeStep(step.id, { value: choice })
    setChanging(false)
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
        <Stack spacing={1} sx={{ mb: 2 }} role={step.multiple ? 'group' : 'radiogroup'} aria-label={step.title}>
          {step.options.map((o, i) => {
            const selected = step.multiple ? picks.includes(o.value) : choice === o.value
            const showGroup = o.group && o.group !== step.options?.[i - 1]?.group
            return (
              <Fragment key={o.value}>
                {showGroup && (
                  <Typography variant="overline" color="text.secondary" sx={{ pt: 1 }}>
                    {o.group}
                  </Typography>
                )}
                <Card variant="outlined" sx={{ borderColor: selected ? 'primary.main' : undefined, borderWidth: selected ? 2 : 1 }}>
                  <CardActionArea
                    onClick={() => setChoice(step.multiple ? joinPicks(togglePick(picks, o.value)) : o.value)}
                    role={step.multiple ? 'checkbox' : 'radio'}
                    aria-checked={selected}
                  >
                    <Stack direction="row" spacing={1} sx={{ alignItems: 'center', p: 1.25 }}>
                      {step.multiple ? (
                        <Checkbox checked={selected} size="small" tabIndex={-1} />
                      ) : (
                        <Radio checked={selected} size="small" tabIndex={-1} />
                      )}
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
              </Fragment>
            )
          })}
        </Stack>
      )}

      <Stack direction="row" spacing={1} sx={{ alignItems: 'center', flexWrap: 'wrap', rowGap: 1 }}>
        {isChange ? (
          <>
            <Button variant="contained" disabled={!choice || choice === step.value} onClick={finish}>
              Save change
            </Button>
            <Button onClick={() => setChanging(false)}>Cancel</Button>
          </>
        ) : (
          <>
            <Button variant="contained" disabled={step.kind === 'choice' && !choice} onClick={finish}>
              {step.kind === 'choice' ? 'Confirm choice' : step.kind === 'content' ? 'Got it' : 'Mark as done'}
            </Button>
            {step.minutes && <Chip size="small" label={`${step.minutes} min`} />}
            {step.dueDate && <Chip size="small" variant="outlined" label={`By ${formatShortDate(step.dueDate)}`} />}
          </>
        )}
      </Stack>
    </Box>
  )
}
