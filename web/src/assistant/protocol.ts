/** Wire format between the Ask tab and /api/ask. Shared by the browser and the server. */

export type HandoverRoute = 'screening' | 'hr' | 'manager' | 'buddy'

export const HANDOVER_ROUTES: HandoverRoute[] = ['screening', 'hr', 'manager', 'buddy']

export interface ChatTurn {
  role: 'user' | 'assistant'
  content: string
}

/** What the assistant knows about the joiner. Deliberately small: no checks results, no contact details. */
export interface JoinerContext {
  firstName: string
  role: string
  jobFamily: string
  location: string
  workPattern: string
  isSmcr: boolean
  startDate: string
  daysToStart: number
  currentStage: string
  managerName?: string
  buddyName?: string
}

export interface AskRequest {
  messages: ChatTurn[]
  joiner: JoinerContext
}

export type AskEvent =
  | { type: 'mode'; mode: 'live' | 'offline' }
  | { type: 'text'; text: string }
  | { type: 'citation'; title: string; quote: string }
  | { type: 'handover'; route: HandoverRoute }
  | { type: 'error'; message: string }
  | { type: 'done' }

export interface HandoverRequest {
  messages: ChatTurn[]
  joiner: JoinerContext
  route: HandoverRoute
}

export interface HandoverResponse {
  summary: string
  mode: 'live' | 'offline'
}
