import { useState } from 'react'
import { Box, Button, Card, CardActionArea, Checkbox, Chip, Drawer, FormControlLabel, IconButton, Radio, Stack, Table, TableBody, TableCell, TableHead, TableRow, TextField, Typography } from '@mui/material'
import CloseRounded from '@mui/icons-material/CloseRounded'
import LockRounded from '@mui/icons-material/LockRounded'
import CheckCircleRounded from '@mui/icons-material/CheckCircleRounded'
import { IconTile } from '../../components/IconTile'
import { PersonAvatar } from '../../components/PersonAvatar'
import { groupBySystem, holderCounts, itemsFor, joinAccess, parseAccess, profilesFor, teamAccess } from '../../domain/access'
import { GOAL_SEPARATOR, suggestedGoals } from '../../data/goals'
import { repository } from '../../data/repository'
import { useDemo } from '../../demo/useDemo'
import { formatShortDate } from '../../domain/dates'
import type { JourneyView, StepView } from '../../domain/journey'
import { laptopLabel, laptopOrder, suggestedLaptopSpec } from '../../domain/laptop'

/** Bottom sheet for one of the manager's tasks. Setting goals and assigning a buddy get their own forms. */
export function ManagerTaskSheet({ journey, stepId, onClose }: { journey: JourneyView; stepId: string | null; onClose: () => void }) {
  const step = journey.steps.find((s) => s.id === stepId)

  return (
    <Drawer
      anchor="bottom"
      open={!!step}
      onClose={onClose}
      slotProps={{ paper: { sx: { maxWidth: 440, mx: 'auto', borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '90dvh' } } }}
    >
      {step && (
        <Box sx={{ p: 3, pb: 'calc(24px + env(safe-area-inset-bottom))' }} role="dialog" aria-label={step.title}>
          <Box sx={{ width: 40, height: 4, borderRadius: 2, bgcolor: 'divider', mx: 'auto', mb: 2 }} />
          <Stack direction="row" spacing={2} sx={{ alignItems: 'flex-start', mb: 1.5 }}>
            <IconTile name={step.icon} muted={step.state === 'locked'} size={52} />
            <Box sx={{ flex: 1 }}>
              <Typography variant="caption" color="text.secondary">
                For {journey.persona.firstName}
                {step.dueDate && ` · due ${formatShortDate(step.dueDate)}`}
              </Typography>
              <Typography variant="h6" component="h2" sx={{ lineHeight: 1.3 }}>
                {step.title}
              </Typography>
            </Box>
            <IconButton aria-label="Close" onClick={onClose} edge="end">
              <CloseRounded />
            </IconButton>
          </Stack>
          <Typography color="text.secondary" sx={{ mb: 2.5 }}>
            {step.body}
          </Typography>

          {step.state === 'locked' ? (
            <Stack direction="row" spacing={1} sx={{ color: 'text.secondary' }}>
              <LockRounded fontSize="small" />
              <Typography variant="body2">{step.lockedHint}</Typography>
            </Stack>
          ) : step.state === 'done' ? (
            <DoneState key={step.id} journey={journey} step={step} onClose={onClose} />
          ) : step.id === 'mgr-set-goals' ? (
            <GoalsForm journey={journey} onDone={onClose} />
          ) : step.id === 'mgr-assign-buddy' ? (
            <BuddyForm journey={journey} onDone={onClose} />
          ) : step.id === 'mgr-request-access' ? (
            <AccessForm journey={journey} onDone={onClose} />
          ) : step.id === 'mgr-set-device-spec' ? (
            <LaptopSpecForm journey={journey} onDone={onClose} />
          ) : (
            <SimpleAction journey={journey} stepId={step.id} label={step.id === 'mgr-request-device' ? 'Approve order' : 'Submit request'} onDone={onClose} />
          )}
        </Box>
      )}
    </Drawer>
  )
}

/** What a done task shows, plus a way to change it while its change window is open. */
function DoneState({ journey, step, onClose }: { journey: JourneyView; step: StepView; onClose: () => void }) {
  const [changing, setChanging] = useState(false)
  if (changing && step.canChange && step.id === 'mgr-set-device-spec') {
    return <LaptopSpecForm journey={journey} current={step.value} onCancel={() => setChanging(false)} onDone={onClose} />
  }

  const accessIds = step.id === 'mgr-request-access' ? parseAccess(step.value) : []
  const accessItems = itemsFor(journey.persona.jobFamily).filter((i) => accessIds.includes(i.id))

  return (
    <Stack spacing={1.5}>
      {accessItems.length > 0 && (
        <Box role="region" aria-label="Access requested">
          <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>
            {accessItems.length} access items requested
          </Typography>
          {groupBySystem(accessItems).map((g) => (
            <Typography key={g.system} variant="caption" color="text.secondary" component="div">
              <strong>{g.system}:</strong> {g.items.map((i) => i.label).join(', ')}
            </Typography>
          ))}
        </Box>
      )}
      <Stack direction="row" spacing={1} sx={{ color: 'primary.main', alignItems: 'center' }}>
        <CheckCircleRounded fontSize="small" />
        <Typography variant="body2" sx={{ fontWeight: 600 }}>
          {step.options?.find((o) => o.value === step.value)?.label ?? 'Done'}
          {step.doneAt ? ` · ${formatShortDate(step.doneAt)}` : ''}
        </Typography>
      </Stack>
      {step.canChange && step.changeUntil ? (
        <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
          <Button variant="outlined" onClick={() => setChanging(true)}>
            Change spec
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

function GoalsForm({ journey, onDone }: { journey: JourneyView; onDone: () => void }) {
  const { completeStep } = useDemo()
  const [goals, setGoals] = useState(() => [...suggestedGoals[journey.persona.jobFamily]])

  return (
    <Stack spacing={1.5}>
      <Typography variant="body2" color="text.secondary">
        We’ve suggested three goals for a {journey.persona.role.toLowerCase()}. Edit them to suit.
      </Typography>
      {goals.map((g, i) => (
        <TextField
          key={i}
          label={`Goal ${i + 1}`}
          value={g}
          multiline
          size="small"
          onChange={(e) => setGoals((gs) => gs.map((x, j) => (j === i ? e.target.value : x)))}
        />
      ))}
      <Button
        variant="contained"
        disabled={goals.some((g) => !g.trim())}
        onClick={() => {
          completeStep('mgr-set-goals', { by: 'manager', personaId: journey.persona.id, value: goals.map((g) => g.trim()).join(GOAL_SEPARATOR) })
          onDone()
        }}
      >
        Set goals and send welcome pack
      </Button>
    </Stack>
  )
}

function BuddyForm({ journey, onDone }: { journey: JourneyView; onDone: () => void }) {
  const { completeStep } = useDemo()
  const buddy = journey.persona.buddyId ? repository.getPerson(journey.persona.buddyId) : undefined
  if (!buddy) return <Typography variant="body2">No buddy suggestions yet for this team.</Typography>

  return (
    <Stack spacing={2}>
      <Box sx={{ border: 2, borderColor: 'secondary.main', borderRadius: 4, p: 2 }}>
        <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center', mb: 1 }}>
          <PersonAvatar name={buddy.name} size={44} />
          <Box>
            <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
              {buddy.name}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {buddy.role}
            </Typography>
          </Box>
        </Stack>
        <Typography variant="caption" color="text.secondary" component="div">
          <strong>Why we suggest {buddy.name.split(' ')[0]}:</strong> {buddy.bio} Same location as {journey.persona.firstName}, and has
          time for a weekly coffee.
        </Typography>
      </Box>
      <Button
        variant="contained"
        onClick={() => {
          completeStep('mgr-assign-buddy', { by: 'manager', personaId: journey.persona.id })
          onDone()
        }}
      >
        Assign {buddy.name.split(' ')[0]} as buddy
      </Button>
    </Stack>
  )
}

/** Sets the laptop spec, or changes it when `current` is given. */
function LaptopSpecForm({
  journey,
  current,
  onCancel,
  onDone,
}: {
  journey: JourneyView
  current?: string
  onCancel?: () => void
  onDone: () => void
}) {
  const { completeStep } = useDemo()
  const step = journey.steps.find((s) => s.id === 'mgr-set-device-spec')
  const suggested = suggestedLaptopSpec(journey.persona.jobFamily)
  const [spec, setSpec] = useState<string>(current ?? suggested)
  const name = journey.persona.firstName
  const model = laptopOrder(journey).model

  return (
    <Stack spacing={1.5}>
      <Stack spacing={1} role="radiogroup" aria-label="Laptop spec">
        {step?.options?.map((o) => {
          const selected = spec === o.value
          return (
            <Card key={o.value} variant="outlined" sx={{ borderColor: selected ? 'primary.main' : undefined, borderWidth: selected ? 2 : 1 }}>
              <CardActionArea onClick={() => setSpec(o.value)} role="radio" aria-checked={selected}>
                <Stack direction="row" spacing={1} sx={{ alignItems: 'center', p: 1.25 }}>
                  <Radio checked={selected} size="small" tabIndex={-1} />
                  <Box>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {o.label}
                      {o.value === suggested && (
                        <Typography component="span" variant="caption" color="text.secondary">
                          {' '}
                          · suggested for a {journey.persona.role.toLowerCase()}
                        </Typography>
                      )}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {o.detail}
                    </Typography>
                  </Box>
                </Stack>
              </CardActionArea>
            </Card>
          )
        })}
      </Stack>
      <Typography variant="caption" color="text.secondary">
        {current && model
          ? `${name} has chosen the ${model.label}. Changing the spec clears that choice so they can pick again, and the order will need your approval again.`
          : `${name} will then choose a Surface, HP EliteBook or Apple MacBook in this spec.`}
      </Typography>
      <Stack direction="row" spacing={1}>
        <Button
          variant="contained"
          disabled={spec === current}
          onClick={() => {
            completeStep('mgr-set-device-spec', { by: 'manager', personaId: journey.persona.id, value: spec })
            onDone()
          }}
        >
          {current ? 'Save change' : 'Confirm spec'}
        </Button>
        {onCancel && <Button onClick={onCancel}>Cancel</Button>}
      </Stack>
    </Stack>
  )
}

/** Pick a role profile or copy a teammate, compare with what the team has, tweak, then request. */
function AccessForm({ journey, onDone }: { journey: JourneyView; onDone: () => void }) {
  const { completeStep } = useDemo()
  const family = journey.persona.jobFamily
  const items = itemsFor(family)
  const profiles = profilesFor(family)
  const team = teamAccess(family)
  const counts = holderCounts(team)
  const [picked, setPicked] = useState<string[]>(profiles[0].itemIds)
  const [source, setSource] = useState<string>(profiles[0].id)
  const name = journey.persona.firstName

  const choose = (id: string, ids: string[]) => {
    setSource(id)
    setPicked(ids)
  }
  const toggle = (id: string) => setPicked((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]))

  return (
    <Stack spacing={2}>
      <Box role="group" aria-label="Start from">
        <Typography variant="overline" color="text.secondary">
          Start from
        </Typography>
        <Stack direction="row" useFlexGap sx={{ flexWrap: 'wrap', gap: 0.75 }}>
          {profiles.map((p) => (
            <Chip key={p.id} label={p.name} color={source === p.id ? 'primary' : 'default'} onClick={() => choose(p.id, p.itemIds)} />
          ))}
          {team.map((m) => (
            <Chip
              key={m.person.id}
              label={`Same as ${m.person.name.split(' ')[0]}`}
              color={source === m.person.id ? 'primary' : 'default'}
              variant={source === m.person.id ? 'filled' : 'outlined'}
              onClick={() => choose(m.person.id, m.itemIds)}
            />
          ))}
        </Stack>
      </Box>

      <Box role="region" aria-label="What your team has now">
        <Typography variant="overline" color="text.secondary">
          What your team has now
        </Typography>
        <Table size="small" aria-label="Team access matrix">
          <TableHead>
            <TableRow>
              <TableCell sx={{ px: 0.5 }}>Access</TableCell>
              {team.map((m) => (
                <TableCell key={m.person.id} align="center" sx={{ px: 0.5 }} aria-label={m.person.name} title={m.person.name}>
                  {m.person.name.split(' ').map((w) => w[0]).join('')}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {items.map((i) => (
              <TableRow key={i.id}>
                <TableCell sx={{ px: 0.5 }}>
                  <Typography variant="caption">
                    {i.system}: {i.label}
                  </Typography>
                </TableCell>
                {team.map((m) => (
                  <TableCell key={m.person.id} align="center" sx={{ px: 0.5 }}>
                    <span aria-label={`${m.person.name} ${m.itemIds.includes(i.id) ? 'has' : 'does not have'} ${i.label}`}>{m.itemIds.includes(i.id) ? '✓' : '–'}</span>
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <Typography variant="caption" color="text.secondary">
          Illustrative demo data. Live data would come from Entra, GitHub and Jira.
        </Typography>
      </Box>

      <Box role="group" aria-label={`Access for ${name}`}>
        <Typography variant="overline" color="text.secondary">
          Access for {name}
        </Typography>
        {groupBySystem(items).map((g) => (
          <Box key={g.system} sx={{ mb: 0.5 }}>
            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>
              {g.system}
            </Typography>
            {g.items.map((i) => (
              <FormControlLabel
                key={i.id}
                sx={{ display: 'flex', mx: 0 }}
                control={<Checkbox size="small" checked={picked.includes(i.id)} onChange={() => toggle(i.id)} />}
                label={
                  <Typography variant="body2">
                    {i.label}{' '}
                    <Typography component="span" variant="caption" color="text.secondary">
                      · {counts[i.id] ?? 0} of {team.length} teammates
                    </Typography>
                  </Typography>
                }
              />
            ))}
          </Box>
        ))}
      </Box>

      <Button
        variant="contained"
        disabled={picked.length === 0}
        onClick={() => {
          completeStep('mgr-request-access', { by: 'manager', personaId: journey.persona.id, value: joinAccess(items.filter((i) => picked.includes(i.id)).map((i) => i.id)) })
          onDone()
        }}
      >
        Request access ({picked.length})
      </Button>
    </Stack>
  )
}

function SimpleAction({ journey, stepId, label, onDone }: { journey: JourneyView; stepId: string; label: string; onDone: () => void }) {
  const { completeStep } = useDemo()
  const kitLabel = laptopLabel(laptopOrder(journey))

  return (
    <Stack spacing={1.5}>
      {stepId === 'mgr-request-device' && kitLabel && (
        <Typography variant="body2">
          {journey.persona.firstName} chose: <strong>{kitLabel}</strong>
        </Typography>
      )}
      <Button
        variant="contained"
        onClick={() => {
          completeStep(stepId, { by: 'manager', personaId: journey.persona.id })
          onDone()
        }}
      >
        {label}
      </Button>
    </Stack>
  )
}
