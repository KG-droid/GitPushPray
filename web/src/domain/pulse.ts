import type { JourneyView } from './journey'
import type { JourneyEvent, PulsePayload } from './types'

/** The two questions behind "connected and confident". Same wording every time so the trend means something. */
export const PULSE_QUESTIONS: { key: keyof PulsePayload; label: string }[] = [
  { key: 'knowWhoToAsk', label: 'I know who to ask when I need help' },
  { key: 'confident', label: 'I feel confident in my role' },
]

/** Journey steps that are answered with the two-question pulse. */
export const PULSE_STEP_IDS = ['pulse-two-weeks', 'day-30-checkin']

export interface MonthSummary {
  day: number
  stepsDone: number
  meetups: number
  pulses: number
  /** First and last answers, so the celebration can say how far they have come */
  first?: PulsePayload
  last?: PulsePayload
}

/** What the joiner has to show for their first month. Counts only; nothing private is copied out. */
export function monthSummary(journey: JourneyView, events: JourneyEvent[]): MonthSummary {
  const mine = events
    .filter((e) => e.personaId === journey.persona.id && e.at.slice(0, 10) <= journey.today)
    .sort((a, b) => a.at.localeCompare(b.at))
  const pulses = mine.filter((e) => e.type === 'pulse_submitted').map((e) => e.payload as unknown as PulsePayload)
  return {
    day: -journey.daysToStart + 1,
    stepsDone: journey.steps.filter((s) => s.owner === 'joiner' && s.kind !== 'content' && s.state === 'done').length,
    meetups: mine.filter((e) => e.type === 'buddy_meetup').length,
    pulses: pulses.length,
    first: pulses[0],
    last: pulses.at(-1),
  }
}
