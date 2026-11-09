import { createContext, useContext } from 'react'
import type { JourneyView } from '../domain/journey'
import type { CheckInMilestone } from '../domain/feedback'
import type { CheckId, HandoverSentPayload, MeetupKind, Owner } from '../domain/types'

export type DemoRole = 'joiner' | 'manager' | 'buddy' | 'admin'

export interface DemoState {
  personaId: string
  /** ISO date to pretend it is, or null for the real date */
  todayOverride: string | null
  /** Whose side of the app we're showing */
  role: DemoRole
}

export interface DemoContextValue extends DemoState {
  today: string
  /** Journey for the selected persona */
  journey: JourneyView
  /** Journey for any persona (e.g. a manager's other joiners), on the same demo date */
  journeyFor(personaId: string): JourneyView
  setPersona(id: string): void
  setToday(iso: string | null): void
  setRole(role: DemoRole): void
  /** Complete a step. Defaults to the selected persona's journey, done by the joiner */
  completeStep(stepId: string, opts?: { value?: string; by?: Owner; personaId?: string }): void
  /** Complete everything that should already be done by the demo date, with sensible defaults */
  catchUp(): number
  slipStartDate(days: number): void
  delayCheck(checkId: CheckId, days: number): void
  resetPersona(): void
  panelOpen: boolean
  setPanelOpen(open: boolean): void
  /** Feedback message after an action, shown app-wide */
  toast: string | null
  clearToast(): void
  /** Chat messages with each person, up to "today" (oldest first) */
  chats: Record<string, ChatEntry[]>
  /** Send a chat message; a scripted reply follows */
  sendChat(withId: string, text: string): void
  /** Person currently "typing" a reply, if any */
  typingId: string | null
  /** Buddy logs a meetup with the selected joiner */
  logMeetup(kind: MeetupKind): void
  /** Record that the joiner's question was handed to a person (so their buddy or manager can see it) */
  recordHandover(route: HandoverSentPayload['route'], summary: string): void
  /** Answer the two-question pulse that belongs to a step, which also completes that step */
  submitPulse(stepId: string, answers: { knowWhoToAsk: number; confident: number }): void
  /** Check-ins the selected joiner has already answered */
  answeredCheckIns: CheckInMilestone[]
  /** Submit a check-in. Stored anonymously; only the fact that it was done is tied to the joiner. */
  submitCheckIn(input: { milestone: CheckInMilestone; mood?: number; enps?: number; missed?: string; better?: string; note?: string }): void
  /** Log what the joiner asked the assistant about: a topic only, never the question text */
  logQuestion(question: string, outcome: { handedOver: boolean; cited: boolean }): void
}

export interface ChatEntry {
  id: string
  from: 'joiner' | 'them'
  text: string
  at: string
}

export const DemoContext = createContext<DemoContextValue | null>(null)

export function useDemo(): DemoContextValue {
  const ctx = useContext(DemoContext)
  if (!ctx) throw new Error('useDemo must be used inside <DemoProvider>')
  return ctx
}

/** Shortcut for screens that only need the computed journey. */
export function useJourney(): JourneyView {
  return useDemo().journey
}
