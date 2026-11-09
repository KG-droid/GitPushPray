import { daysUntil } from './dates'
import type { JourneyView, StepView } from './journey'
import { pulseTrend } from './manager'
import type { BuddyMeetupPayload, HandoverSentPayload, JourneyEvent, MeetupKind } from './types'

/**
 * The buddy's side: who they're looking after, when to step in, and how often they've met.
 * Alerts come from journey events and trends, never from the joiner's private answers or chats.
 */

export type BuddyAlert =
  | { kind: 'asked-for-you'; summary: string; at: string }
  | { kind: 'date-moved'; to: string }
  | { kind: 'no-hello'; daysToStart: number }
  | { kind: 'day-3' }
  | { kind: 'week-one-end' }
  | { kind: 'quiet'; days: number }
  | { kind: 'pulse-down' }

export interface Meetup {
  kind: MeetupKind
  at: string
}

export interface BuddyView {
  journey: JourneyView
  meetups: Meetup[]
  /** Where they are against Microsoft's research on buddy meetups in the first 90 days */
  meetupLevel: { label: string; next?: number }
  alerts: BuddyAlert[]
  tasks: StepView[]
  /** From Day 28: time to introduce them to the wider team */
  graduating: boolean
}

/** Microsoft: 56% said their buddy helped after 1 meetup, 73% after 2–3, 86% after 4–8, 97% after more than 8. */
export function meetupLevel(count: number): BuddyView['meetupLevel'] {
  if (count === 0) return { label: 'Not met yet', next: 1 }
  if (count === 1) return { label: 'Good start', next: 2 }
  if (count <= 3) return { label: 'Building a habit', next: 4 }
  if (count <= 8) return { label: 'Making a real difference', next: 9 }
  return { label: 'Brilliant buddy' }
}

export function buddyView(journey: JourneyView, events: JourneyEvent[]): BuddyView {
  const { persona, today, daysToStart } = journey
  const mine = events
    .filter((e) => e.personaId === persona.id && e.at.slice(0, 10) <= today)
    .sort((a, b) => a.at.localeCompare(b.at))

  const meetups: Meetup[] = mine
    .filter((e) => e.type === 'buddy_meetup')
    .map((e) => ({ kind: (e.payload as unknown as BuddyMeetupPayload).kind, at: e.at }))

  const daysSinceStart = -daysToStart
  const alerts: BuddyAlert[] = []

  // The joiner chose to ask for their buddy: always first.
  for (const e of mine) {
    if (e.type !== 'handover_sent') continue
    const p = e.payload as unknown as HandoverSentPayload
    if (p.route === 'buddy') alerts.push({ kind: 'asked-for-you', summary: p.summary, at: e.at })
  }
  alerts.reverse()

  const moved = journey.notices.find((n) => n.kind === 'start-date-moved')
  if (moved && moved.kind === 'start-date-moved' && daysToStart > 0) alerts.push({ kind: 'date-moved', to: moved.to })

  const hello = journey.steps.find((s) => s.id === 'say-hello')
  if (daysToStart > 0 && daysToStart <= 14 && hello && hello.state !== 'done') alerts.push({ kind: 'no-hello', daysToStart })

  if (daysSinceStart >= 2 && daysSinceStart <= 3) alerts.push({ kind: 'day-3' })
  if (daysSinceStart >= 4 && daysSinceStart <= 6) alerts.push({ kind: 'week-one-end' })

  if (daysSinceStart > 0) {
    const last = meetups.at(-1)?.at.slice(0, 10) ?? journey.startDate
    const quiet = -daysUntil(last, today)
    if (quiet >= 10) alerts.push({ kind: 'quiet', days: quiet })
  }

  if (pulseTrend(events, journey)?.trend === 'down') alerts.push({ kind: 'pulse-down' })

  return {
    journey,
    meetups,
    meetupLevel: meetupLevel(meetups.length),
    alerts,
    tasks: journey.steps.filter((s) => s.owner === 'buddy'),
    graduating: daysSinceStart >= 27,
  }
}
