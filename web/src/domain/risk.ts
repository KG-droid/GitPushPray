import { daysUntil } from './dates'
import type { JourneyView } from './journey'
import type { ChatMessagePayload, JourneyEvent, StepCompletedPayload } from './types'

/**
 * "Gone quiet": a joiner who has done nothing for a week or more before starting. Research behind the app
 * found each extra week between offer and Day 1 makes a no-show more likely, so the manager gets a nudge
 * and a one-tap hello. It looks only at whether the joiner has been active, never at what they did or said.
 */

export const QUIET_AFTER_DAYS = 7
export const VERY_QUIET_AFTER_DAYS = 14
/** A hello from the manager buys this many days before the nudge comes back. */
export const HELLO_GRACE_DAYS = 5

export type QuietSignal =
  | { status: 'quiet'; level: 'watch' | 'at-risk'; quietDays: number; reasons: string[] }
  | { status: 'contacted'; at: string }

export function quietSignal(journey: JourneyView, events: JourneyEvent[]): QuietSignal | undefined {
  const { persona, today, daysToStart } = journey
  if (daysToStart <= 0) return undefined

  const mine = events.filter((e) => e.personaId === persona.id && e.at.slice(0, 10) <= today)
  const isJoinerActivity = (e: JourneyEvent) =>
    e.type === 'offer_accepted' ||
    e.type === 'handover_sent' ||
    e.type === 'feedback_submitted' ||
    (e.type === 'step_completed' && ((e.payload as unknown as StepCompletedPayload).by ?? 'joiner') === 'joiner') ||
    (e.type === 'chat_message' && (e.payload as unknown as ChatMessagePayload).from === 'joiner')
  const lastActive = mine.filter(isJoinerActivity).map((e) => e.at).sort().at(-1)?.slice(0, 10) ?? persona.offerAcceptedOn
  const quietDays = -daysUntil(lastActive, today)
  if (quietDays < QUIET_AFTER_DAYS) return undefined

  // The manager has already reached out since the joiner last did anything.
  const hello = mine
    .filter((e) => e.type === 'chat_message')
    .filter((e) => {
      const p = e.payload as unknown as ChatMessagePayload
      return p.from === 'them' && p.withId === persona.managerId
    })
    .map((e) => e.at)
    .sort()
    .at(-1)
  if (hello && hello.slice(0, 10) >= lastActive && -daysUntil(hello.slice(0, 10), today) < HELLO_GRACE_DAYS) {
    return { status: 'contacted', at: hello }
  }

  const moved = journey.notices.some((n) => n.kind === 'start-date-moved')
  const delayed = journey.checks.some((c) => c.status === 'delayed')
  const score = (quietDays >= VERY_QUIET_AFTER_DAYS ? 2 : 1) + Number(moved) + Number(delayed)
  return {
    status: 'quiet',
    level: score >= 2 ? 'at-risk' : 'watch',
    quietDays,
    reasons: [
      `${persona.firstName} hasn’t opened a step or sent a message for ${quietDays} days.`,
      ...(moved ? ['Their start date has moved, which can be unsettling.'] : []),
      ...(delayed ? ['Their checks are taking longer than expected.'] : []),
    ],
  }
}

/** A friendly default for the one-tap hello. The manager's name goes on it in the chat, not here. */
export function helloMessage(joinerFirstName: string, managerFirstName: string, startLabel: string): string {
  return `Hi ${joinerFirstName}, it’s ${managerFirstName}. Nothing you need to do, I just wanted to say we’re looking forward to having you join us on ${startLabel}. If there’s anything I can help with before then, or anything you’re unsure about, just reply here.`
}
