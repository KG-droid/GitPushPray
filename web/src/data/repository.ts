import type { JourneyEvent, Person, Persona } from '../domain/types'
import { checkCatalogue, stepCatalogue } from './catalogue'
import { seedEvents, seedPeople, seedPersonas } from './seed'
import type { CheckDefinition, StepDefinition } from '../domain/types'

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
  /** Remove demo-added events for one persona (or everyone) and go back to the seed data */
  reset(personaId?: string): void
  /** Called whenever events change; returns an unsubscribe function */
  subscribe(listener: () => void): () => void
}

type MinimalStorage = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>

const STORAGE_KEY = 'lbg-joiner:events:v1'

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
    reset: (personaId) => {
      if (!personaId) {
        storage.removeItem(STORAGE_KEY)
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
