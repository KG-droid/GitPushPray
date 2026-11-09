import { daysUntil } from './dates'
import { managerEquipmentSummary, pickedOptions, NO_EQUIPMENT } from './equipment'
import type { JourneyView, StepView } from './journey'
import { laptopLabel, laptopOrder } from './laptop'
import type { JourneyEvent, PulsePayload } from './types'

/**
 * What a hiring manager sees about a joiner. Deliberately progress-only:
 * no check-by-check results, no individual pulse answers, no chat or assistant history.
 */

export type JoinerStatus = 'needs-you' | 'waiting-on-checks' | 'on-track' | 'started'

export interface ManagerJoinerView {
  journey: JourneyView
  status: JoinerStatus
  /** The manager's own tasks for this joiner, soonest first */
  tasks: StepView[]
  tasksDone: number
  /** Available tasks due within a week (or overdue) */
  urgent: StepView[]
  /** Overall vetting state only, never per-check detail */
  vetting: { cleared: boolean; expectedBy: string; delayed: boolean }
  /** Joiner progress on their own tasks and choices */
  joinerDone: number
  joinerTotal: number
  /** Only the choices a manager needs to act on (e.g. kit to approve). Benefits stay private. */
  sharedChoices: { label: string; value: string }[]
  startDateMoved?: { from: string; to: string }
  /** Average of the Day-30 pulse, trend only (at least two responses so nobody's single answer is exposed) */
  pulse?: { responses: number; knowWhoToAsk: number; confident: number; trend: 'up' | 'flat' | 'down' }
}

export function managerView(journey: JourneyView, events: JourneyEvent[] = []): ManagerJoinerView {
  const tasks = journey.steps
    .filter((s) => s.owner === 'manager')
    .sort((a, b) => order(a) - order(b) || (a.dueDate ?? '9999').localeCompare(b.dueDate ?? '9999'))
  const urgent = tasks.filter((t) => t.state === 'available' && t.dueDate && daysUntil(t.dueDate, journey.today) <= 7)
  const joinerSteps = journey.steps.filter((s) => s.owner === 'joiner' && s.kind !== 'content')
  const kitLabel = laptopLabel(laptopOrder(journey))
  const equipment = journey.steps.find((s) => s.id === 'choose-equipment')
  const headset = journey.steps.find((s) => s.id === 'choose-headset')
  const moved = journey.notices.find((n) => n.kind === 'start-date-moved')

  const status: JoinerStatus =
    journey.daysToStart <= 0
      ? 'started'
      : urgent.length > 0
        ? 'needs-you'
        : !journey.vettingCleared
          ? 'waiting-on-checks'
          : 'on-track'

  return {
    journey,
    status,
    tasks,
    tasksDone: tasks.filter((t) => t.state === 'done').length,
    urgent,
    vetting: {
      cleared: journey.vettingCleared,
      expectedBy: journey.vettingExpectedClearOn,
      delayed: journey.checks.some((c) => c.status === 'delayed'),
    },
    joinerDone: joinerSteps.filter((s) => s.state === 'done').length,
    joinerTotal: joinerSteps.length,
    sharedChoices: [
      ...(kitLabel ? [{ label: 'Laptop', value: kitLabel }] : []),
      ...(headset?.state === 'done' ? [{ label: 'Headset', value: headset.options?.find((o) => o.value === headset.value)?.label ?? 'Chosen' }] : []),
      // If the manager agreed these with the joiner in the accessibility conversation, they already know the detail.
      ...(equipment?.state === 'done'
        ? equipment.doneBy === 'manager'
          ? agreedEquipment(equipment)
          : managerEquipmentSummary(equipment)
        : []),
    ],
    startDateMoved: moved && moved.kind === 'start-date-moved' ? { from: moved.from, to: moved.to } : undefined,
    pulse: pulseTrend(events, journey),
  }
}

function agreedEquipment(step: StepView): { label: string; value: string }[] {
  const picked = pickedOptions(step).filter((o) => o.value !== NO_EQUIPMENT)
  const by = (assistive: boolean) => picked.filter((o) => (o.group === 'Assistive technology') === assistive).map((o) => o.label).join(', ')
  return [
    { label: 'Equipment', value: by(false) },
    { label: 'Assistive technology', value: by(true) },
  ].filter((row) => row.value)
}

function order(s: StepView): number {
  return s.state === 'available' ? 0 : s.state === 'locked' ? 1 : 2
}

export function pulseTrend(events: JourneyEvent[], journey: JourneyView): ManagerJoinerView['pulse'] {
  const pulses = events
    .filter((e) => e.personaId === journey.persona.id && e.type === 'pulse_submitted' && e.at.slice(0, 10) <= journey.today)
    .sort((a, b) => a.at.localeCompare(b.at))
    .map((e) => e.payload as unknown as PulsePayload)
  if (pulses.length < 2) return undefined
  const avg = (k: keyof PulsePayload) => Math.round((pulses.reduce((t, p) => t + p[k], 0) / pulses.length) * 10) / 10
  const score = (p: PulsePayload) => p.knowWhoToAsk + p.confident
  const delta = score(pulses.at(-1)!) - score(pulses[0])
  return {
    responses: pulses.length,
    knowWhoToAsk: avg('knowWhoToAsk'),
    confident: avg('confident'),
    trend: delta > 0 ? 'up' : delta < 0 ? 'down' : 'flat',
  }
}

export type Nudge =
  | { kind: 'first-week'; personaId: string; name: string; startDate: string; daysToStart: number }
  | { kind: 'task-due'; personaId: string; name: string; task: StepView; overdue: boolean }
  | { kind: 'date-moved'; personaId: string; name: string; to: string }

/** The handful of things worth a manager's attention today, most important first. */
export function managerNudges(views: ManagerJoinerView[]): Nudge[] {
  const nudges: Nudge[] = []
  for (const v of views) {
    const { persona, daysToStart, startDate, today } = v.journey
    const name = persona.firstName
    if (v.startDateMoved) nudges.push({ kind: 'date-moved', personaId: persona.id, name, to: v.startDateMoved.to })
    // Google's research: a just-in-time nudge in the days before Day 1 makes the biggest difference.
    if (daysToStart > 0 && daysToStart <= 7) nudges.push({ kind: 'first-week', personaId: persona.id, name, startDate, daysToStart })
    for (const task of v.urgent.slice(0, 2)) {
      nudges.push({ kind: 'task-due', personaId: persona.id, name, task, overdue: !!task.dueDate && task.dueDate < today })
    }
  }
  const rank = { 'date-moved': 0, 'first-week': 1, 'task-due': 2 }
  return nudges.sort((a, b) => rank[a.kind] - rank[b.kind])
}

/** The five things that matter most before a new joiner starts (from Google's onboarding research). */
export const firstWeekEssentials = [
  'Talk through their role and what good looks like',
  'Check their buddy has said hello',
  'Introduce them to 3–5 people they’ll work with',
  'Book regular 1:1s for the first 6 months',
  'Tell them it’s OK to ask anything',
]
