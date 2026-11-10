import { useState } from 'react'
import { Alert, Box, Button, Card, CardActionArea, Checkbox, Chip, Drawer, FormControlLabel, IconButton, Radio, Stack, Table, TableBody, TableCell, TableHead, TableRow, TextField, Typography } from '@mui/material'
import CloseRounded from '@mui/icons-material/CloseRounded'
import LockRounded from '@mui/icons-material/LockRounded'
import CheckCircleRounded from '@mui/icons-material/CheckCircleRounded'
import { IconTile } from '../../components/IconTile'
import { PersonAvatar } from '../../components/PersonAvatar'
import { AccessTracker } from '../../components/AccessTracker'
import { accessProgress, groupBySystem, holderCounts, itemsFor, joinAccess, profilesFor, requestedItems, summariseAccess, teamAccess } from '../../domain/access'
import { GOAL_SEPARATOR, suggestedGoals } from '../../data/goals'
import { repository } from '../../data/repository'
import { useDemo } from '../../demo/useDemo'
import { formatShortDate } from '../../domain/dates'
import type { JourneyView, StepView } from '../../domain/journey'
import { joinPicks, NO_EQUIPMENT, parsePicks, togglePick } from '../../domain/equipment'
import { encodeLaptopSpec, laptopLabel, laptopOrder, parseLaptopSpec, suggestedLaptopSpec } from '../../domain/laptop'
import { weekOneItems } from '../../data/weekOne'
import { joinPlan, plannedWeekOne, recommendedIds, WEEK_ONE_STEP, workingDay } from '../../domain/weekOne'
import { packLaptops, SEND_WELCOME_PACK_STEP, welcomePackStatus } from '../../domain/welcomePack'

/** Bottom sheet for one of the manager's tasks. Sending the welcome pack, setting goals and assigning a buddy get their own forms. */
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
          ) : step.id === SEND_WELCOME_PACK_STEP ? (
            <WelcomePackForm journey={journey} onDone={onClose} />
          ) : step.id === 'mgr-set-goals' ? (
            <GoalsForm journey={journey} onDone={onClose} />
          ) : step.id === 'mgr-assign-buddy' ? (
            <BuddyForm journey={journey} onDone={onClose} />
          ) : step.id === WEEK_ONE_STEP ? (
            <WeekOneForm journey={journey} onDone={onClose} />
          ) : step.id === 'mgr-request-access' ? (
            <AccessForm journey={journey} onDone={onClose} />
          ) : step.id === 'mgr-set-device-spec' ? (
            <LaptopSpecForm journey={journey} onDone={onClose} />
          ) : step.id === 'mgr-accessibility-conversation' ? (
            <AccessibilityConversationForm journey={journey} onDone={onClose} />
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

  const planned = step.id === WEEK_ONE_STEP ? plannedWeekOne(journey) : undefined
  const accessItems = step.id === 'mgr-request-access' ? requestedItems(journey.persona.jobFamily, step.value) : []
  const progress = step.doneAt ? accessProgress(accessItems, step.doneAt, journey.today, journey.startDate) : []
  const access = summariseAccess(progress)

  return (
    <Stack spacing={1.5}>
      {accessItems.length > 0 && (
        <Stack spacing={1} role="region" aria-label="Access requested">
          <Box>
            <Typography variant="body2" sx={{ fontWeight: 600 }}>
              {accessItems.length} access items requested
            </Typography>
            <Typography variant="caption" color="text.secondary">
              One request, sent to each system’s owner. {access.ready} ready, {access.inProgress} in progress
              {access.afterTraining ? `, ${access.afterTraining} after training` : ''}.
            </Typography>
          </Box>
          {access.late.length > 0 && (
            <Alert severity="warning" variant="outlined">
              {access.late.length === 1 ? '1 item is' : `${access.late.length} items are`} not expected until after Day 1:{' '}
              {access.late.map((p) => `${p.item.label} (${p.route.owner})`).join(', ')}. Chase the owner, or plan the first days around it.
            </Alert>
          )}
          <AccessTracker progress={progress} dense />
        </Stack>
      )}
      {planned && (
        <Box component="ul" aria-label="Planned sessions" sx={{ m: 0, pl: 2.5 }}>
          {planned.map((i) => (
            <Typography key={i.id} component="li" variant="body2">
              {formatShortDate(i.date)}, {i.time}: {i.title}
            </Typography>
          ))}
        </Box>
      )}
      <Stack direction="row" spacing={1} sx={{ color: 'primary.main', alignItems: 'center' }}>
        <CheckCircleRounded fontSize="small" />
        <Typography variant="body2" sx={{ fontWeight: 600 }}>
          {step.id === SEND_WELCOME_PACK_STEP ? 'Welcome pack sent' : planned ? `${planned.length} session${planned.length === 1 ? '' : 's'} planned` : step.options?.find((o) => o.value === (step.id === 'mgr-set-device-spec' ? parseLaptopSpec(step.value)?.spec : step.value))?.label ?? 'Done'}
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
        Add goals to their welcome pack
      </Button>
    </Stack>
  )
}

function WeekOneForm({ journey, onDone }: { journey: JourneyView; onDone: () => void }) {
  const { completeStep } = useDemo()
  const items = weekOneItems[journey.persona.jobFamily]
  const [picked, setPicked] = useState<string[]>(() => recommendedIds(journey.persona.jobFamily))
  const name = journey.persona.firstName

  return (
    <Stack spacing={1}>
      <Typography variant="body2" color="text.secondary">
        Day 1 is already planned. Pick what {name} does for the rest of the week. We’ve ticked the ones that work best for a {journey.persona.role.toLowerCase()}.
      </Typography>
      {items.map((i) => (
        <FormControlLabel
          key={i.id}
          sx={{ alignItems: 'flex-start', mr: 0 }}
          control={
            <Checkbox
              size="small"
              checked={picked.includes(i.id)}
              onChange={() => setPicked((ps) => (ps.includes(i.id) ? ps.filter((p) => p !== i.id) : [...ps, i.id]))}
            />
          }
          label={
            <Box sx={{ pt: 0.5 }}>
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                {i.title}
              </Typography>
              <Typography variant="caption" color="text.secondary" component="div">
                {formatShortDate(workingDay(journey.startDate, i.day))}, {i.time} · {i.minutes} min · {i.detail}
              </Typography>
            </Box>
          }
        />
      ))}
      <Button
        variant="contained"
        sx={{ mt: 1 }}
        disabled={picked.length === 0}
        onClick={() => {
          // Keep the catalogue's order, whatever order they were ticked in.
          completeStep(WEEK_ONE_STEP, { by: 'manager', personaId: journey.persona.id, value: joinPlan(items.filter((i) => picked.includes(i.id)).map((i) => i.id)) })
          onDone()
        }}
      >
        Add to {name}’s first week
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

/**
 * The manager sends the welcome pack. If the joiner gets a laptop, the manager first chooses which ones
 * they can pick from: those choices go out in the pack, so it can't be sent without them.
 */
function WelcomePackForm({ journey, onDone }: { journey: JourneyView; onDone: () => void }) {
  const { completeStep } = useDemo()
  const name = journey.persona.firstName
  const laptops = packLaptops(journey)

  if (welcomePackStatus(journey).needsLaptops) {
    return (
      <Stack spacing={1.5}>
        <Alert severity="info" variant="outlined">
          First choose which laptops {name} is allowed. They go out in the welcome pack, so it can’t be sent without them.
        </Alert>
        <LaptopSpecForm journey={journey} sendPack onDone={onDone} />
      </Stack>
    )
  }

  return (
    <Stack spacing={1.5}>
      {laptops && (
        <Box role="region" aria-label="Laptops in the pack" sx={{ bgcolor: 'action.hover', borderRadius: 3, p: 1.5 }}>
          <Typography variant="overline" color="text.secondary">
            Laptops {name} can choose from · {laptops.spec.label} spec
          </Typography>
          <Box component="ul" sx={{ m: 0, pl: 2.5 }}>
            {laptops.options.map((o) => (
              <Typography key={o.value} component="li" variant="body2">
                {o.label}
                {laptops.recommended?.value === o.value ? ' (your recommendation)' : ''}
              </Typography>
            ))}
          </Box>
          <Typography variant="caption" color="text.secondary">
            To change these, use “Set their laptop spec”.
          </Typography>
        </Box>
      )}
      <Typography variant="body2" color="text.secondary">
        The pack lands in {name}’s app straight away. Your goals and first-week plan are added to it as you set them.
      </Typography>
      <Button
        variant="contained"
        onClick={() => {
          completeStep(SEND_WELCOME_PACK_STEP, { by: 'manager', personaId: journey.persona.id })
          onDone()
        }}
      >
        Send welcome pack
      </Button>
    </Stack>
  )
}

/** Sets the laptop spec, or changes it when `current` is given. With `sendPack`, saving also sends the welcome pack. */
function LaptopSpecForm({
  journey,
  current,
  sendPack,
  onCancel,
  onDone,
}: {
  journey: JourneyView
  current?: string
  sendPack?: boolean
  onCancel?: () => void
  onDone: () => void
}) {
  const { completeStep } = useDemo()
  const step = journey.steps.find((s) => s.id === 'mgr-set-device-spec')
  const suggested = suggestedLaptopSpec(journey.persona.jobFamily)
  const currentChoice = parseLaptopSpec(current)
  const allModels = journey.steps.find((s) => s.id === 'choose-kit')?.options ?? []
  const [spec, setSpec] = useState<string>(currentChoice?.spec ?? suggested)
  const [offered, setOffered] = useState<string[]>(currentChoice?.models ?? allModels.map((o) => o.value))
  const [recommended, setRecommended] = useState<string | undefined>(currentChoice?.recommended)
  const name = journey.persona.firstName
  const model = laptopOrder(journey).model
  const value = encodeLaptopSpec({
    spec,
    models: offered.length === allModels.length ? undefined : offered,
    recommended: recommended && offered.includes(recommended) ? recommended : undefined,
  })
  const offeredOptions = allModels.filter((o) => offered.includes(o.value))

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

      {allModels.length > 0 && (
        <>
          <Stack spacing={1} role="group" aria-label="Laptops they can choose">
            <Typography variant="overline" color="text.secondary">
              Laptops {name} can choose from
            </Typography>
            {allModels.map((o) => {
              const selected = offered.includes(o.value)
              return (
                <Card key={o.value} variant="outlined" sx={{ borderColor: selected ? 'primary.main' : undefined, borderWidth: selected ? 2 : 1 }}>
                  <CardActionArea
                    onClick={() => setOffered((cur) => (cur.includes(o.value) ? (cur.length > 1 ? cur.filter((v) => v !== o.value) : cur) : [...cur, o.value]))}
                    role="checkbox"
                    aria-checked={selected}
                  >
                    <Stack direction="row" spacing={1} sx={{ alignItems: 'center', p: 1.25 }}>
                      <Checkbox checked={selected} size="small" tabIndex={-1} />
                      <Box>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {o.label}
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
          {offeredOptions.length > 1 && (
            <Stack spacing={1} role="radiogroup" aria-label="Recommended laptop">
              <Typography variant="overline" color="text.secondary">
                Recommended laptop
              </Typography>
              {[{ value: '', label: 'No recommendation', detail: undefined as string | undefined }, ...offeredOptions].map((o) => {
                const selected = (recommended ?? '') === o.value
                return (
                  <Card key={o.value || 'none'} variant="outlined" sx={{ borderColor: selected ? 'primary.main' : undefined, borderWidth: selected ? 2 : 1 }}>
                    <CardActionArea onClick={() => setRecommended(o.value || undefined)} role="radio" aria-checked={selected}>
                      <Stack direction="row" spacing={1} sx={{ alignItems: 'center', p: 1.25 }}>
                        <Radio checked={selected} size="small" tabIndex={-1} />
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {o.label}
                        </Typography>
                      </Stack>
                    </CardActionArea>
                  </Card>
                )
              })}
            </Stack>
          )}
        </>
      )}

      <Typography variant="caption" color="text.secondary">
        {current && model
          ? `${name} has chosen the ${model.label}. Saving a change clears that choice so they can pick again, and the order will need your approval again.`
          : sendPack
            ? `The welcome pack tells ${name} which laptops they can choose from, with your recommendation highlighted.`
            : `${name} will then choose from the laptops above, with your recommendation highlighted.`}
      </Typography>
      <Stack direction="row" spacing={1}>
        <Button
          variant="contained"
          disabled={value === current}
          onClick={() => {
            completeStep('mgr-set-device-spec', { by: 'manager', personaId: journey.persona.id, value })
            if (sendPack) completeStep(SEND_WELCOME_PACK_STEP, { by: 'manager', personaId: journey.persona.id })
            onDone()
          }}
        >
          {sendPack ? 'Send welcome pack' : current ? 'Save change' : 'Confirm spec'}
        </Button>
        {onCancel && <Button onClick={onCancel}>Cancel</Button>}
      </Stack>
    </Stack>
  )
}

const conversationPrompts = [
  'Ask what would make their first weeks easier. Let them lead, and don’t ask for a diagnosis or medical detail.',
  'Talk through the laptop and headset options together, including anything that isn’t on the standard list.',
  'Ask whether they’d like Teams and Outlook on their personal phone. It’s optional, and some access tools work well there.',
  'Mention Occupational Health if they’d like a workplace assessment. IT and Occupational Health can arrange specialist kit.',
  'Agree what to record. Keep the detail between you, them, IT and Occupational Health.',
]

/**
 * The manager talks adjustments through with the joiner, then records what was agreed.
 * The laptop and headset are saved as the joiner's own choices so the rest of the journey carries on as normal.
 */
function AccessibilityConversationForm({ journey, onDone }: { journey: JourneyView; onDone: () => void }) {
  const { completeStep } = useDemo()
  const name = journey.persona.firstName
  const stepOf = (id: string) => journey.steps.find((s) => s.id === id)
  const specStep = stepOf('mgr-set-device-spec')
  const kitStep = stepOf('choose-kit')
  const headsetStep = stepOf('choose-headset')
  const [spec, setSpec] = useState<string>(parseLaptopSpec(specStep?.value)?.spec ?? suggestedLaptopSpec(journey.persona.jobFamily))
  const [laptop, setLaptop] = useState<string | undefined>(kitStep?.value)
  const [headset, setHeadset] = useState<string | undefined>(headsetStep?.value)
  const equipmentStep = stepOf('choose-equipment')
  const [extras, setExtras] = useState<string[]>(parsePicks(equipmentStep?.value))
  const phoneStep = stepOf('phone-access')
  const [phone, setPhone] = useState<string | undefined>(phoneStep?.value)
  const ready = (!kitStep || !!laptop) && (!headsetStep || !!headset) && (!phoneStep || !!phone)

  const record = () => {
    const as = { by: 'manager' as const, personaId: journey.persona.id }
    // The spec goes first: a laptop choice only stands if it was made after the spec.
    if (specStep && laptop) completeStep('mgr-set-device-spec', { ...as, value: spec })
    if (kitStep && laptop) completeStep('choose-kit', { ...as, value: laptop })
    if (headsetStep && headset) completeStep('choose-headset', { ...as, value: headset })
    if (phoneStep && phone) completeStep('phone-access', { ...as, value: phone })
    if (equipmentStep) completeStep('choose-equipment', { ...as, value: joinPicks(extras.length ? extras : [NO_EQUIPMENT]) })
    completeStep('mgr-accessibility-conversation', as)
    onDone()
  }

  return (
    <Stack spacing={2}>
      <Box sx={{ bgcolor: 'action.hover', borderRadius: 3, p: 1.5 }}>
        <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>
          Have this conversation with {name} first
        </Typography>
        <Box component="ul" sx={{ m: 0, pl: 2.5 }}>
          {conversationPrompts.map((p) => (
            <Typography key={p} component="li" variant="caption" color="text.secondary" sx={{ mb: 0.5 }}>
              {p}
            </Typography>
          ))}
        </Box>
      </Box>

      <Typography variant="body2" sx={{ fontWeight: 600 }}>
        Then record what you agreed
      </Typography>

      {kitStep && (
        <>
          <ChoiceGroup
            label="Laptop spec"
            options={specStep?.options ?? []}
            value={spec}
            onChange={setSpec}
            hint={(v) => (v === suggestedLaptopSpec(journey.persona.jobFamily) ? `suggested for a ${journey.persona.role.toLowerCase()}` : undefined)}
          />
          <ChoiceGroup label="Laptop" options={kitStep.options ?? []} value={laptop} onChange={setLaptop} />
        </>
      )}
      {headsetStep && <ChoiceGroup label="Headset" options={headsetStep.options ?? []} value={headset} onChange={setHeadset} />}
      {phoneStep && <ChoiceGroup label="Teams and Outlook on their personal phone" options={phoneStep.options ?? []} value={phone} onChange={setPhone} />}
      {equipmentStep && (
        <EquipmentPicker
          options={equipmentStep.options ?? []}
          picks={extras}
          onChange={(value) => setExtras((current) => togglePick(current, value))}
        />
      )}

      <Typography variant="caption" color="text.secondary">
        This is saved as {name}’s own choice, and the laptop order will come to you to approve as usual. If they need something that isn’t listed, ask IT or Occupational Health to arrange it.
      </Typography>
      <Button variant="contained" disabled={!ready} onClick={record}>
        We’ve talked it through
      </Button>
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

/** Everything else on offer, grouped: workstation kit, then assistive technology and apps such as ZoomText. Pick as many as were agreed. */
function EquipmentPicker({
  options,
  picks,
  onChange,
}: {
  options: { value: string; label: string; detail?: string; group?: string }[]
  picks: string[]
  onChange: (value: string) => void
}) {
  return (
    <Stack spacing={1} role="group" aria-label="Equipment and assistive technology">
      <Typography variant="overline" color="text.secondary">
        Equipment, apps and assistive technology
      </Typography>
      <Typography variant="caption" color="text.secondary" sx={{ mt: '-4px !important' }}>
        Pick everything you agreed. This goes to IT and Occupational Health.
      </Typography>
      {options.map((o, i) => {
        const selected = picks.includes(o.value)
        const showGroup = o.group && o.group !== options[i - 1]?.group
        return (
          <Box key={o.value} sx={{ display: 'contents' }}>
            {showGroup && (
              <Typography variant="caption" color="text.secondary" sx={{ pt: 1, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                {o.group}
              </Typography>
            )}
            <Card variant="outlined" sx={{ borderColor: selected ? 'primary.main' : undefined, borderWidth: selected ? 2 : 1 }}>
              <CardActionArea onClick={() => onChange(o.value)} role="checkbox" aria-checked={selected}>
                <Stack direction="row" spacing={1} sx={{ alignItems: 'center', p: 1.25 }}>
                  <Checkbox checked={selected} size="small" tabIndex={-1} />
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
          </Box>
        )
      })}
    </Stack>
  )
}

function ChoiceGroup({
  label,
  options,
  value,
  onChange,
  hint,
}: {
  label: string
  options: { value: string; label: string; detail?: string }[]
  value?: string
  onChange: (value: string) => void
  hint?: (value: string) => string | undefined
}) {
  return (
    <Stack spacing={1} role="radiogroup" aria-label={label}>
      <Typography variant="overline" color="text.secondary">
        {label}
      </Typography>
      {options.map((o) => {
        const selected = value === o.value
        const note = hint?.(o.value)
        return (
          <Card key={o.value} variant="outlined" sx={{ borderColor: selected ? 'primary.main' : undefined, borderWidth: selected ? 2 : 1 }}>
            <CardActionArea onClick={() => onChange(o.value)} role="radio" aria-checked={selected}>
              <Stack direction="row" spacing={1} sx={{ alignItems: 'center', p: 1.25 }}>
                <Radio checked={selected} size="small" tabIndex={-1} />
                <Box>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    {o.label}
                    {note && (
                      <Typography component="span" variant="caption" color="text.secondary">
                        {' '}
                        · {note}
                      </Typography>
                    )}
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
