import type { FeedbackResponse, QuestionLog } from '../domain/feedback'
import type { JourneyEvent } from '../domain/types'
import { seedFeedback, seedQuestionLogs } from './insightsSeed'
import { seedEvents } from './seed'

/**
 * Everything the demo changes is an "op": add an event, record a check-in, reset a persona, change the
 * simulated date. The current state is the seed data with the ops applied in order. Because that is all a
 * shared demo has to send between phones, two phones that apply the same ops end up showing the same app.
 */
export type Op =
  | { oid: string; type: 'event'; event: JourneyEvent }
  | { oid: string; type: 'feedback'; feedback: FeedbackResponse }
  | { oid: string; type: 'question'; log: QuestionLog }
  | { oid: string; type: 'reset'; personaId?: string }
  /** The date everyone in a shared demo is pretending it is (null for the real date) */
  | { oid: string; type: 'today'; value: string | null }

export type ServerOp = Op & { seq: number }

export interface DemoData {
  events: JourneyEvent[]
  feedback: FeedbackResponse[]
  questions: QuestionLog[]
  /** undefined until someone sets it */
  today: string | null | undefined
}

export function applyOps(ops: Op[]): DemoData {
  let events = [...seedEvents]
  let feedback = [...seedFeedback]
  let questions = [...seedQuestionLogs]
  let today: string | null | undefined

  for (const op of ops) {
    switch (op.type) {
      case 'event':
        events.push(op.event)
        break
      case 'feedback':
        feedback.push(op.feedback)
        break
      case 'question':
        questions.push(op.log)
        break
      case 'today':
        today = op.value
        break
      case 'reset':
        if (op.personaId) {
          events = [...events.filter((e) => e.personaId !== op.personaId), ...seedEvents.filter((e) => e.personaId === op.personaId)]
        } else {
          events = [...seedEvents]
          feedback = [...seedFeedback]
          questions = [...seedQuestionLogs]
        }
        break
    }
  }
  return { events, feedback, questions, today }
}

export const newId = (prefix: string) => `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
