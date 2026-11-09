import type { JourneyEvent, Person, Persona } from '../domain/types'
import { checkCatalogue, stepCatalogue } from './catalogue'
import { seedEvents, seedPeople, seedPersonas } from './seed'
import type { CheckDefinition, StepDefinition } from '../domain/types'
import type { FeedbackResponse, QuestionLog } from '../domain/feedback'
import { seedFeedback, seedQuestionLogs } from './insightsSeed'

/**
 * The only way screens read or write data. Today this is backed by seed data plus localStorage;
 * a real API (e.g. SQLite behind Azure Functions) can implement the same interface later.
 */
export interface Repository {
  listPersonas(): Persona[]
  getPersona(id: string): Persona | undefined
  getPerson(id: string): Person | undefined
  listSteps(): StepDefinition[]
  listChecks(): CheckDefinition[]
  listEvents(personaId: string): JourneyEvent[]
  addEvent(event: Omit<JourneyEvent, 'id'>): JourneyEvent
  /** Anonymous check-in answers: the synthetic history plus anything submitted in this browser */
  listFeedback(): FeedbackResponse[]
  addFeedback(response: Omit<FeedbackResponse, 'id'>): FeedbackResponse
  /** Anonymous assistant log (topic only, never the question) */
  listQuestionLogs(): QuestionLog[]
  addQuestionLog(log: Omit<QuestionLog, 'id'>): QuestionLog
  /** Remove demo-added events for one persona (or everyone) and go back to the seed data */
  reset(personaId?: string): void
  /** Called whenever events change; returns an unsubscribe function */
  subscribe(listener: () => void): () => void
}

type MinimalStorage = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>

const STORAGE_KEY = 'lbg-joiner:events:v1'
const INSIGHTS_KEY = 'lbg-joiner:insights:v1'

interface InsightsStore {
  feedback: FeedbackResponse[]
  questions: QuestionLog[]
}

export function createMockRepository(storage: MinimalStorage = localStorage): Repository {
  const listeners = new Set<() => void>()
  const notify = () => listeners.forEach((l) => l())

  const load = (): JourneyEvent[] => {
    const raw = storage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as JourneyEvent[]) : [...seedEvents]
  }
  const save = (events: JourneyEvent[]) => {
    storage.setItem(STORAGE_KEY, JSON.stringify(events))
    notify()
  }

  const loadInsights = (): InsightsStore => {
    try {
      const raw = storage.getItem(INSIGHTS_KEY)
      return raw ? (JSON.parse(raw) as InsightsStore) : { feedback: [], questions: [] }
    } catch {
      return { feedback: [], questions: [] }
    }
  }
  const saveInsights = (store: InsightsStore) => {
    storage.setItem(INSIGHTS_KEY, JSON.stringify(store))
    notify()
  }
  const newId = (prefix: string) => `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`

  return {
    listPersonas: () => seedPersonas,
    getPersona: (id) => seedPersonas.find((p) => p.id === id),
    getPerson: (id) => seedPeople.find((p) => p.id === id),
    listSteps: () => stepCatalogue,
    listChecks: () => checkCatalogue,
    listEvents: (personaId) => load().filter((e) => e.personaId === personaId),
    addEvent: (event) => {
      const full = { ...event, id: `evt-${Date.now()}-${Math.random().toString(36).slice(2, 7)}` }
      save([...load(), full])
      return full
    },
    listFeedback: () => [...seedFeedback, ...loadInsights().feedback],
    addFeedback: (response) => {
      const full = { ...response, id: newId('fb') }
      const store = loadInsights()
      saveInsights({ ...store, feedback: [...store.feedback, full] })
      return full
    },
    listQuestionLogs: () => [...seedQuestionLogs, ...loadInsights().questions],
    addQuestionLog: (log) => {
      const full = { ...log, id: newId('q') }
      const store = loadInsights()
      saveInsights({ ...store, questions: [...store.questions, full] })
      return full
    },
    reset: (personaId) => {
      if (!personaId) {
        storage.removeItem(STORAGE_KEY)
        storage.removeItem(INSIGHTS_KEY)
        notify()
        return
      }
      const others = load().filter((e) => e.personaId !== personaId)
      save([...others, ...seedEvents.filter((e) => e.personaId === personaId)])
    },
    subscribe: (listener) => {
      listeners.add(listener)
      return () => listeners.delete(listener)
    },
  }
}

export const repository = createMockRepository(typeof localStorage === 'undefined' ? memoryStorage() : localStorage)

export function memoryStorage(): MinimalStorage {
  const m = new Map<string, string>()
  return {
    getItem: (k) => m.get(k) ?? null,
    setItem: (k, v) => void m.set(k, v),
    removeItem: (k) => void m.delete(k),
  }
}
