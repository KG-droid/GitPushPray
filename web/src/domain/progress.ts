import type { JourneyProgress } from '../assistant/protocol'
import type { JourneyView } from './journey'

const LIMIT = 6

/** A short, plain summary of where the joiner is, for the assistant to answer "what's left?" from. */
export function journeyProgress(journey: JourneyView): JourneyProgress {
  const steps = journey.steps.filter((s) => !s.exploreOnly)
  const mine = steps.filter((s) => s.owner === 'joiner')
  const own = mine.filter((s) => s.kind !== 'content')
  const byDue = (a: { dueDate?: string }, b: { dueDate?: string }) => (a.dueDate ?? '9999').localeCompare(b.dueDate ?? '9999')

  const cleared = journey.checks.filter((c) => c.status === 'cleared').length
  return {
    stepsDone: own.filter((s) => s.state === 'done').length,
    stepsTotal: own.length,
    checks: {
      cleared,
      total: journey.checks.length,
      expectedBy: cleared < journey.checks.length ? journey.vettingExpectedClearOn : undefined,
    },
    todo: own
      .filter((s) => s.state === 'available')
      .sort(byDue)
      .slice(0, LIMIT)
      .map((s) => ({ title: s.title, due: s.dueDate })),
    locked: mine
      .filter((s) => s.state === 'locked')
      .slice(0, LIMIT)
      .map((s) => ({ title: s.title, unlocksWhen: s.lockedHint ?? 'Unlocks later in your journey.' })),
    team: steps
      .filter((s) => (s.owner === 'manager' || s.owner === 'buddy') && s.state !== 'done')
      .sort(byDue)
      .slice(0, LIMIT)
      .map((s) => ({ title: s.title, who: s.owner as 'manager' | 'buddy', due: s.dueDate })),
  }
}
