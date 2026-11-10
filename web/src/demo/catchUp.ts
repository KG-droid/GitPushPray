import { GOAL_SEPARATOR, suggestedGoals } from '../data/goals'
import { buildJourney, type JourneyInput, type JourneyView, type StepView } from '../domain/journey'
import { PULSE_STEP_IDS } from '../domain/pulse'
import { joinPlan, recommendedIds, WEEK_ONE_STEP } from '../domain/weekOne'
import { SEND_WELCOME_PACK_STEP, welcomePackStatus } from '../domain/welcomePack'
import type { Owner, Persona, StageId } from '../domain/types'

/**
 * Demo helper: after jumping the date, work out which steps should already be done by then so the app
 * looks lived-in. Only used by the presenter's "Catch up" button; nothing in the real journey depends on it.
 */

export interface CatchUpStep {
  stepId: string
  by: Owner
  value?: string
}

const BEFORE_DAY_ONE: StageId[] = ['offer', 'unlock', 'meet', 'manager-ready']
/** Left for the presenter to do live: they need real answers, or belong at the very end. */
const LEAVE_OPEN = [...PULSE_STEP_IDS, 'mgr-day-30-review']
/** Week one is over by the end of Day 5 (day index 4). */
const END_OF_WEEK_ONE = 4

function shouldBeDone(s: StepView, j: JourneyView): boolean {
  if (s.state !== 'available' || s.kind === 'content' || s.exploreOnly || s.stage === 'day-30' || LEAVE_OPEN.includes(s.id)) return false
  // The pack can't go until the laptop options are chosen, so it waits a round for them.
  if (s.id === SEND_WELCOME_PACK_STEP && welcomePackStatus(j).needsLaptops) return false
  const daysSinceStart = -j.daysToStart
  if (j.daysToStart <= 0 && BEFORE_DAY_ONE.includes(s.stage)) return true
  if (s.stage === 'week-one') return daysSinceStart >= END_OF_WEEK_ONE
  return !!s.dueDate && s.dueDate <= j.today
}

function defaultValue(s: StepView, persona: Persona): string | undefined {
  if (s.id === 'mgr-set-goals') return suggestedGoals[persona.jobFamily].join(GOAL_SEPARATOR)
  if (s.id === WEEK_ONE_STEP) return joinPlan(recommendedIds(persona.jobFamily))
  return s.options?.[0]?.value
}

/** The steps to complete, in an order that respects dependencies (a laptop is chosen before it is approved). */
export function planCatchUp(input: JourneyInput): CatchUpStep[] {
  const plan: CatchUpStep[] = []
  const events = [...input.events]
  // Completing one step can unlock the next, so go round until nothing new is due.
  for (let round = 0; round < 8; round++) {
    const journey = buildJourney({ ...input, events })
    const due = journey.steps.filter((s) => shouldBeDone(s, journey))
    if (!due.length) break
    for (const s of due) {
      plan.push({ stepId: s.id, by: s.owner, value: defaultValue(s, input.persona) })
      events.push({
        id: `plan-${plan.length}`,
        personaId: input.persona.id,
        type: 'step_completed',
        at: `${input.today}T23:59:59.${String(plan.length).padStart(3, '0')}Z`,
        payload: { stepId: s.id, by: s.owner, value: defaultValue(s, input.persona) },
      })
    }
  }
  return plan
}
