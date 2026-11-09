import { addDays, daysUntil } from './dates'
import type {
  Audience,
  CheckDefinition,
  CheckId,
  CheckStatus,
  CheckUpdatedPayload,
  JourneyEvent,
  Owner,
  Persona,
  StageId,
  StartDateChangedPayload,
  StepCompletedPayload,
  StepDefinition,
  UnlockRule,
} from './types'

/**
 * The journey engine: pure functions that turn a persona, their events and "today" into
 * everything the screens need. No React, no storage — easy to test and to move server-side later.
 */

export const STAGES: { id: StageId; title: string; subtitle: string }[] = [
  { id: 'offer', title: 'Offer', subtitle: 'Welcome aboard' },
  { id: 'unlock', title: 'Unlock & choose', subtitle: 'Get set up before Day 1' },
  { id: 'meet', title: 'Meet your people', subtitle: 'Your manager, buddy and team' },
  { id: 'manager-ready', title: 'Manager ready', subtitle: 'Everything waiting for you' },
  { id: 'week-one', title: 'Day 1 to Week 1', subtitle: 'Find your feet' },
  { id: 'day-30', title: 'Day 30', subtitle: 'Connected and confident' },
]

export type StepState = 'locked' | 'available' | 'done'

export interface StepView extends StepDefinition {
  state: StepState
  dueDate?: string
  doneAt?: string
  value?: string
  /** Last day a done step can still be changed, for steps that allow changes */
  changeUntil?: string
  /** Done, and still inside its change window */
  canChange: boolean
}

export interface CheckView extends CheckDefinition {
  status: CheckStatus
  expectedClearOn: string
  note?: string
}

export type StageStatus = 'done' | 'current' | 'upcoming'

export interface StageView {
  id: StageId
  title: string
  subtitle: string
  status: StageStatus
  steps: StepView[]
}

export type Notice =
  | { kind: 'start-date-moved'; from: string; to: string; reason: string; at: string }
  | { kind: 'check-delayed'; checkId: CheckId; label: string; expectedClearOn: string; note?: string; at: string }

export interface JourneyView {
  persona: Persona
  today: string
  startDate: string
  /** Positive before Day 1, 0 on Day 1, negative after */
  daysToStart: number
  checks: CheckView[]
  vettingCleared: boolean
  /** Latest expected clear date across all checks */
  vettingExpectedClearOn: string
  stages: StageView[]
  currentStage: StageId
  /** The single most useful thing for this owner to do now */
  nextAction?: StepView
  /** Steps for this persona, flattened, in journey order */
  steps: StepView[]
  notices: Notice[]
}

export interface JourneyInput {
  persona: Persona
  events: JourneyEvent[]
  today: string
  steps: StepDefinition[]
  checks: CheckDefinition[]
}

export function buildJourney({ persona, events, today, steps, checks }: JourneyInput): JourneyView {
  // Only events that have happened by "today" count, so time travel works in both directions.
  const past = events
    .filter((e) => e.personaId === persona.id && e.at.slice(0, 10) <= today)
    .sort((a, b) => a.at.localeCompare(b.at))

  const startDate = currentStartDate(persona, past)
  const daysToStart = daysUntil(startDate, today)
  const checkViews = buildChecks(persona, past, today, checks)
  const cleared = new Set(checkViews.filter((c) => c.status === 'cleared').map((c) => c.id))

  const mySteps = steps.filter((s) => matchesAudience(persona, s.audience))
  const completions = effectiveCompletions(mySteps, past)

  const ctx: RuleContext = {
    daysToStart,
    isCleared: (ids) => (ids === 'all' ? checkViews.every((c) => c.status === 'cleared') : ids.every((id) => cleared.has(id))),
    isDone: (stepId) => completions.has(stepId),
  }

  const stepViews: StepView[] = mySteps.map((s) => {
    const done = completions.get(s.id)
    const state: StepState = done ? 'done' : evaluate(s.unlock, ctx) ? 'available' : 'locked'
    const changeUntil = s.changeUntilOffsetDays === undefined ? undefined : addDays(startDate, s.changeUntilOffsetDays)
    return {
      ...s,
      state,
      doneAt: done?.at,
      value: done?.value,
      dueDate: s.dueOffsetDays === undefined ? undefined : addDays(startDate, s.dueOffsetDays),
      changeUntil,
      canChange: state === 'done' && !!changeUntil && today <= changeUntil,
    }
  })

  const stages = buildStages(stepViews)
  const currentStage = stages.find((s) => s.status === 'current')?.id ?? 'day-30'

  return {
    persona,
    today,
    startDate,
    daysToStart,
    checks: checkViews,
    vettingCleared: checkViews.every((c) => c.status === 'cleared'),
    vettingExpectedClearOn: checkViews.reduce((max, c) => (c.expectedClearOn > max ? c.expectedClearOn : max), today),
    stages,
    currentStage,
    nextAction: pickNextAction(stepViews, 'joiner'),
    steps: stepViews,
    notices: buildNotices(persona, past, checkViews),
  }
}

/** Highest-priority available step for an owner: earliest stage, then earliest due date, tasks before content. */
export function pickNextAction(steps: StepView[], owner: Owner): StepView | undefined {
  const stageOrder = STAGES.map((s) => s.id)
  const kindOrder = { task: 0, choice: 0, content: 1 }
  return steps
    .filter((s) => s.owner === owner && s.state === 'available')
    .sort(
      (a, b) =>
        kindOrder[a.kind] - kindOrder[b.kind] ||
        stageOrder.indexOf(a.stage) - stageOrder.indexOf(b.stage) ||
        (a.dueDate ?? '9999').localeCompare(b.dueDate ?? '9999'),
    )[0]
}

export function matchesAudience(persona: Persona, audience?: Audience): boolean {
  if (!audience) return true
  if (audience.jobFamilies && !audience.jobFamilies.includes(persona.jobFamily)) return false
  if (audience.sites && !audience.sites.includes(persona.site)) return false
  if (audience.workPatterns && !audience.workPatterns.includes(persona.workPattern)) return false
  if (audience.software && !audience.software.some((s) => persona.software.includes(s))) return false
  if (audience.smcr !== undefined && audience.smcr !== persona.isSmcr) return false
  return true
}

interface RuleContext {
  daysToStart: number
  isCleared: (ids: CheckId[] | 'all') => boolean
  isDone: (stepId: string) => boolean
}

export function evaluate(rule: UnlockRule, ctx: RuleContext): boolean {
  switch (rule.type) {
    case 'always':
      return true
    case 'checksCleared':
      return ctx.isCleared(rule.checks)
    case 'stepDone':
      return ctx.isDone(rule.stepId)
    case 'daysToStart':
      return ctx.daysToStart <= rule.atMost
    case 'daysSinceStart':
      return -ctx.daysToStart >= rule.atLeast
    case 'all':
      return rule.rules.every((r) => evaluate(r, ctx))
    case 'any':
      return rule.rules.some((r) => evaluate(r, ctx))
  }
}

/**
 * The latest completion of each step that still stands. A completion is undone when a step in its
 * `resetBy` list was redone after it, or is itself undone (so a spec change clears the laptop choice
 * and, through it, the approval).
 */
function effectiveCompletions(steps: StepDefinition[], past: JourneyEvent[]): Map<string, { at: string; value?: string }> {
  const latest = new Map<string, { at: string; value?: string }>()
  for (const e of past) {
    if (e.type !== 'step_completed') continue
    const p = e.payload as unknown as StepCompletedPayload
    latest.set(p.stepId, { at: e.at, value: p.value })
  }

  const byId = new Map(steps.map((s) => [s.id, s]))
  const stands = new Map<string, boolean>()
  const standsFor = (id: string): boolean => {
    const known = stands.get(id)
    if (known !== undefined) return known
    const done = latest.get(id)
    const resetBy = (byId.get(id)?.resetBy ?? []).filter((dep) => byId.has(dep))
    const result = !!done && resetBy.every((dep) => standsFor(dep) && latest.get(dep)!.at <= done.at)
    stands.set(id, result)
    return result
  }

  const effective = new Map<string, { at: string; value?: string }>()
  for (const [id, done] of latest) if (!byId.has(id) || standsFor(id)) effective.set(id, done)
  return effective
}

function currentStartDate(persona: Persona, past: JourneyEvent[]): string {
  const moves = past.filter((e) => e.type === 'start_date_changed')
  const last = moves[moves.length - 1]
  return last ? (last.payload as unknown as StartDateChangedPayload).to : persona.startDate
}

function buildChecks(persona: Persona, past: JourneyEvent[], today: string, defs: CheckDefinition[]): CheckView[] {
  return defs
    .filter((d) => persona.checkPlan[d.id])
    .map((d) => {
      const plan = persona.checkPlan[d.id]!
      const startsOn = addDays(persona.offerAcceptedOn, plan.startDay)
      let expectedClearOn = addDays(startsOn, plan.days)
      let status: CheckStatus = today < startsOn ? 'not-started' : today >= expectedClearOn ? 'cleared' : 'in-progress'
      let note: string | undefined

      // Explicit updates (a stalled reference, a document needed) override the plan.
      for (const e of past) {
        if (e.type !== 'check_updated') continue
        const p = e.payload as unknown as CheckUpdatedPayload
        if (p.checkId !== d.id) continue
        if (p.expectedClearOn) expectedClearOn = p.expectedClearOn
        status = p.status
        note = p.note
      }
      // A delayed check still clears once its new expected date arrives.
      if ((status === 'delayed' || status === 'in-progress') && today >= expectedClearOn) status = 'cleared'

      return { ...d, status, expectedClearOn, note }
    })
}

function buildStages(steps: StepView[]): StageView[] {
  let foundCurrent = false
  return STAGES.map((stage) => {
    const stageSteps = steps.filter((s) => s.stage === stage.id)
    // Content never blocks progress: a stage is done when its tasks and choices are done
    // (or, for a content-only stage, when everything in it is unlocked).
    const actionable = stageSteps.filter((s) => s.kind !== 'content')
    const allDone =
      stageSteps.length > 0 &&
      (actionable.length > 0 ? actionable.every((s) => s.state === 'done') : stageSteps.every((s) => s.state !== 'locked'))
    let status: StageStatus
    if (allDone && !foundCurrent) status = 'done'
    else if (!foundCurrent) {
      status = 'current'
      foundCurrent = true
    } else status = allDone ? 'done' : 'upcoming'
    return { ...stage, status, steps: stageSteps }
  })
}

function buildNotices(persona: Persona, past: JourneyEvent[], checks: CheckView[]): Notice[] {
  const notices: Notice[] = []
  let previous = persona.startDate
  for (const e of past) {
    if (e.type === 'start_date_changed') {
      const p = e.payload as unknown as StartDateChangedPayload
      notices.push({ kind: 'start-date-moved', from: previous, to: p.to, reason: p.reason, at: e.at })
      previous = p.to
    }
    if (e.type === 'check_updated') {
      const p = e.payload as unknown as CheckUpdatedPayload
      const check = checks.find((c) => c.id === p.checkId)
      if (p.status === 'delayed' && check && check.status !== 'cleared') {
        notices.push({
          kind: 'check-delayed',
          checkId: p.checkId,
          label: check.label,
          expectedClearOn: check.expectedClearOn,
          note: p.note,
          at: e.at,
        })
      }
    }
  }
  return notices.reverse()
}
