import type { JourneyEvent, Person, Persona } from '../domain/types'
import { checkCatalogue, stepCatalogue } from './catalogue'
import { seedPeople, seedPersonas } from './seed'
import type { CheckDefinition, StepDefinition } from '../domain/types'
import type { FeedbackResponse, QuestionLog } from '../domain/feedback'
import { applyOps, newId, type DemoData, type Op, type ServerOp } from './ops'

export interface ShareStatus {
  /** solo: this phone only. shared: several phones follow the same demo through the server. */
  mode: 'solo' | 'shared'
  id?: string
  /** Shared only: the last conversation with the server worked */
  connected: boolean
}

/**
 * The only way screens read or write data. Today this is backed by seed data plus a log of demo actions kept in
 * localStorage; a demo can also be shared, in which case the log lives on the server and every phone follows it.
 * A real API (e.g. SQLite behind Azure Functions) can implement the same interface later.
 */
export interface Repository {
  listPersonas(): Persona[]
  getPersona(id: string): Persona | undefined
  getPerson(id: string): Person | undefined
  listSteps(): StepDefinition[]
  listChecks(): CheckDefinition[]
  listEvents(personaId: string): JourneyEvent[]
  addEvent(event: Omit<JourneyEvent, 'id'>): JourneyEvent
  /** Anonymous check-in answers: the synthetic history plus anything submitted in this demo */
  listFeedback(): FeedbackResponse[]
  addFeedback(response: Omit<FeedbackResponse, 'id'>): FeedbackResponse
  /** Anonymous assistant log (topic only, never the question) */
  listQuestionLogs(): QuestionLog[]
  addQuestionLog(log: Omit<QuestionLog, 'id'>): QuestionLog
  /** Remove demo-added events for one persona (or everyone) and go back to the seed data */
  reset(personaId?: string): void
  /** Called whenever the data or the sharing status changes; returns an unsubscribe function */
  subscribe(listener: () => void): () => void

  shareStatus(): ShareStatus
  /** The simulated date in a shared demo. undefined when not shared, or nobody has set it. */
  sharedToday(): string | null | undefined
  setSharedToday(value: string | null): void
  /** Move this demo onto the server so other phones can join it. Resolves to the demo's code. */
  startSharing(today: string | null): Promise<string>
  /** Follow someone else's shared demo */
  joinShared(id: string): void
  /** Come back to a private demo, keeping what is on screen */
  stopSharing(): void
}

type MinimalStorage = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>

const OPS_KEY = 'lbg-joiner:ops:v1'
const SESSION_KEY = 'lbg-joiner:session:v1'
const SESSION_ID = /^[a-z2-7]{8}$/

interface Shared {
  id: string
  /** What the server has told us, by position */
  server: Map<number, ServerOp>
  lastSeq: number
  /** Ours, not yet confirmed by the server. Still shown, so taps never seem to do nothing. */
  pending: Op[]
  connected: boolean
  busy: boolean
}

export interface RepositoryOptions {
  fetch?: typeof fetch
  /** How often a shared demo asks the server for news */
  pollMs?: number
}

export function createMockRepository(storage: MinimalStorage = localStorage, options: RepositoryOptions = {}): Repository {
  const listeners = new Set<() => void>()
  const notify = () => listeners.forEach((l) => l())
  const send: typeof fetch = (...args) => (options.fetch ?? fetch)(...args)
  const pollMs = options.pollMs ?? 1500

  const loadLocal = (): Op[] => {
    try {
      const raw = storage.getItem(OPS_KEY)
      return raw ? (JSON.parse(raw) as Op[]) : []
    } catch {
      return []
    }
  }
  let localOps = loadLocal()
  const saveLocal = () => storage.setItem(OPS_KEY, JSON.stringify(localOps))

  let shared: Shared | null = null
  let timer: ReturnType<typeof setInterval> | undefined

  const currentOps = (): Op[] => {
    if (!shared) return localOps
    const confirmed = new Set([...shared.server.values()].map((o) => o.oid))
    return [
      ...[...shared.server.values()].sort((a, b) => a.seq - b.seq),
      ...shared.pending.filter((o) => !confirmed.has(o.oid)),
    ]
  }

  let cached: DemoData | undefined
  const data = () => (cached ??= applyOps(currentOps()))
  const changed = () => {
    cached = undefined
    notify()
  }

  // ── Sharing ──────────────────────────────────────────────

  const url = (id: string, path = 'ops') => `/api/session/${id}/${path}`

  /** The session has gone (a day without use, or a restart without storage): carry on privately with what we have. */
  const dropToSolo = () => {
    if (!shared) return
    localOps = currentOps()
    saveLocal()
    clearInterval(timer)
    timer = undefined
    shared = null
    storage.removeItem(SESSION_KEY)
    changed()
  }

  async function flush() {
    const s = shared
    if (!s || s.busy || !s.pending.length) return
    s.busy = true
    const batch = s.pending.slice(0, 50)
    try {
      const res = await send(url(s.id), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ops: batch }),
      })
      if (shared !== s) return
      if (res.status === 404) return dropToSolo()
      const sent = new Set(batch.map((o) => o.oid))
      if (res.ok) {
        for (const op of ((await res.json()) as { ops: ServerOp[] }).ops) s.server.set(op.seq, op)
        s.pending = s.pending.filter((o) => !sent.has(o.oid))
        s.connected = true
        changed()
      } else if (res.status === 400 || res.status === 413) {
        // The server will never take these; stop retrying them.
        s.pending = s.pending.filter((o) => !sent.has(o.oid))
        changed()
      } else {
        throw new Error(String(res.status))
      }
    } catch {
      if (s.connected) {
        s.connected = false
        notify()
      }
    } finally {
      s.busy = false
    }
  }

  async function poll() {
    const s = shared
    if (!s) return
    await flush()
    if (shared !== s) return
    try {
      const res = await send(`${url(s.id)}?since=${s.lastSeq}`)
      if (shared !== s) return
      if (res.status === 404) return dropToSolo()
      if (!res.ok) throw new Error(String(res.status))
      const { ops } = (await res.json()) as { ops: ServerOp[] }
      let news = !s.connected
      for (const op of ops) {
        if (!s.server.has(op.seq)) news = true
        s.server.set(op.seq, op)
        s.lastSeq = Math.max(s.lastSeq, op.seq)
      }
      // A write whose reply was lost shows up here; it is no longer pending.
      const confirmed = new Set(ops.map((o) => o.oid))
      s.pending = s.pending.filter((o) => !confirmed.has(o.oid))
      s.connected = true
      if (news) changed()
    } catch {
      if (s.connected) {
        s.connected = false
        notify()
      }
    }
  }

  const join = (id: string, pending: Op[] = []) => {
    clearInterval(timer)
    shared = { id, server: new Map(), lastSeq: 0, pending, connected: false, busy: false }
    storage.setItem(SESSION_KEY, id)
    timer = setInterval(() => void poll(), pollMs)
    void poll()
    changed()
  }

  const push = (op: Op) => {
    if (shared) {
      shared.pending.push(op)
      void flush()
    } else {
      localOps = [...localOps, op]
      saveLocal()
    }
    changed()
  }

  // Pick up where this phone left off if it was in a shared demo.
  const savedSession = storage.getItem(SESSION_KEY)
  if (savedSession && SESSION_ID.test(savedSession)) join(savedSession)

  return {
    listPersonas: () => seedPersonas,
    getPersona: (id) => seedPersonas.find((p) => p.id === id),
    getPerson: (id) => seedPeople.find((p) => p.id === id),
    listSteps: () => stepCatalogue,
    listChecks: () => checkCatalogue,
    listEvents: (personaId) => data().events.filter((e) => e.personaId === personaId),
    addEvent: (event) => {
      const full = { ...event, id: newId('evt') }
      push({ oid: newId('op'), type: 'event', event: full })
      return full
    },
    listFeedback: () => data().feedback,
    addFeedback: (response) => {
      const full = { ...response, id: newId('fb') }
      push({ oid: newId('op'), type: 'feedback', feedback: full })
      return full
    },
    listQuestionLogs: () => data().questions,
    addQuestionLog: (log) => {
      const full = { ...log, id: newId('q') }
      push({ oid: newId('op'), type: 'question', log: full })
      return full
    },
    reset: (personaId) => {
      // On a private demo a full reset can simply forget everything, which keeps the stored log small.
      if (!shared && !personaId) {
        localOps = []
        saveLocal()
        changed()
        return
      }
      push({ oid: newId('op'), type: 'reset', personaId })
    },
    subscribe: (listener) => {
      listeners.add(listener)
      return () => listeners.delete(listener)
    },

    shareStatus: () => (shared ? { mode: 'shared', id: shared.id, connected: shared.connected } : { mode: 'solo', connected: true }),
    sharedToday: () => (shared ? data().today : undefined),
    setSharedToday: (value) => {
      if (shared) push({ oid: newId('op'), type: 'today', value })
    },
    startSharing: async (today) => {
      if (shared) return shared.id
      const res = await send('/api/session', { method: 'POST' })
      if (!res.ok) throw new Error(`Could not start a shared demo (${res.status})`)
      const { id } = (await res.json()) as { id: string }
      // What is on screen now becomes the starting point everyone shares.
      join(id, [...localOps, { oid: newId('op'), type: 'today', value: today }])
      return id
    },
    joinShared: (id) => {
      if (SESSION_ID.test(id) && shared?.id !== id) join(id)
    },
    stopSharing: () => {
      if (!shared) return
      localOps = currentOps()
      saveLocal()
      clearInterval(timer)
      timer = undefined
      shared = null
      storage.removeItem(SESSION_KEY)
      changed()
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
