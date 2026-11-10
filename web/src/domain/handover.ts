import type { HandoverSentPayload, JourneyEvent } from './types'

/** A question a joiner chose to pass on to a person. Only the summary they saw and approved is kept. */
export interface HandoverItem {
  personaId: string
  route: HandoverSentPayload['route']
  summary: string
  at: string
}

/** Handovers sent to any of these routes by "today", newest first. Optionally for one joiner only. */
export function handoversTo(
  events: JourneyEvent[],
  routes: HandoverSentPayload['route'][],
  today: string,
  personaId?: string,
): HandoverItem[] {
  return events
    .filter((e) => e.type === 'handover_sent' && e.at.slice(0, 10) <= today && (!personaId || e.personaId === personaId))
    .map((e) => ({ personaId: e.personaId, at: e.at, ...(e.payload as unknown as HandoverSentPayload) }))
    .filter((h) => routes.includes(h.route))
    .sort((a, b) => b.at.localeCompare(a.at))
}
