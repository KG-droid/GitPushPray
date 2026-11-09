import { randomBytes } from 'node:crypto'
import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs'
import { dirname } from 'node:path'

/**
 * Shared demo sessions: an ordered log of demo actions that several phones read and add to, so a manager
 * on one phone and a joiner on another see the same journey. The server never looks inside an action; it
 * only orders them. Everything here is synthetic demo data and expires a day after its last use.
 */

export const OP_TYPES = ['event', 'feedback', 'question', 'reset', 'today'] as const
const MAX_OP_BYTES = 8 * 1024

export interface StoredOp {
  /** Position in this session's log, starting at 1 */
  seq: number
  /** Chosen by the phone that made it, so a retry is never applied twice */
  oid: string
  type: (typeof OP_TYPES)[number]
  [field: string]: unknown
}

interface Session {
  ops: StoredOp[]
  touched: number
}

export interface SessionStore {
  create(): string
  ops(id: string, since: number): { ops: StoredOp[]; seq: number } | undefined
  /** Appends new actions (skipping ones already seen). Returns them with their positions, or 'full'. */
  append(id: string, incoming: unknown[]): { ops: StoredOp[]; seq: number } | 'full' | 'invalid' | undefined
}

export interface SessionOptions {
  /** JSON file to keep sessions in across restarts. Omit to keep them in memory only. */
  file?: string
  now?: () => number
  maxSessions?: number
  maxOps?: number
  ttlMs?: number
}

const ID_ALPHABET = 'abcdefghijklmnopqrstuvwxyz234567'
export const SESSION_ID = /^[a-z2-7]{8}$/

export function createSessionStore({ file, now = Date.now, maxSessions = 300, maxOps = 5000, ttlMs = 24 * 60 * 60 * 1000 }: SessionOptions = {}): SessionStore {
  const sessions = new Map<string, Session>()

  if (file && existsSync(file)) {
    try {
      const saved = JSON.parse(readFileSync(file, 'utf8')) as Record<string, Session>
      for (const [id, s] of Object.entries(saved)) if (SESSION_ID.test(id) && Array.isArray(s.ops)) sessions.set(id, s)
    } catch {
      // A damaged file just means starting fresh.
    }
  }

  let timer: ReturnType<typeof setTimeout> | undefined
  const save = () => {
    if (!file || timer) return
    timer = setTimeout(() => {
      timer = undefined
      try {
        mkdirSync(dirname(file), { recursive: true })
        writeFileSync(`${file}.tmp`, JSON.stringify(Object.fromEntries(sessions)))
        renameSync(`${file}.tmp`, file)
      } catch (error) {
        console.warn('[sessions] could not save:', error instanceof Error ? error.message : error)
      }
    }, 1000)
    timer.unref()
  }

  const prune = () => {
    const t = now()
    for (const [id, s] of sessions) if (t - s.touched > ttlMs) sessions.delete(id)
  }

  const find = (id: string): Session | undefined => {
    const s = SESSION_ID.test(id) ? sessions.get(id) : undefined
    if (!s) return undefined
    if (now() - s.touched > ttlMs) {
      sessions.delete(id)
      return undefined
    }
    return s
  }

  return {
    create() {
      prune()
      if (sessions.size >= maxSessions) {
        // Make room by dropping the session that has been quiet the longest.
        const oldest = [...sessions].sort((a, b) => a[1].touched - b[1].touched)[0]
        if (oldest) sessions.delete(oldest[0])
      }
      const bytes = randomBytes(8)
      const id = Array.from(bytes, (b) => ID_ALPHABET[b % 32]).join('')
      sessions.set(id, { ops: [], touched: now() })
      save()
      return id
    },

    ops(id, since) {
      const s = find(id)
      if (!s) return undefined
      s.touched = now()
      return { ops: s.ops.filter((o) => o.seq > since), seq: s.ops.length }
    },

    append(id, incoming) {
      const s = find(id)
      if (!s) return undefined
      const seen = new Set(s.ops.map((o) => o.oid))
      const added: StoredOp[] = []
      const accepted: StoredOp[] = []
      for (const raw of incoming) {
        const op = raw as Record<string, unknown>
        const valid =
          op &&
          typeof op === 'object' &&
          typeof op.oid === 'string' &&
          op.oid.length > 0 &&
          op.oid.length <= 64 &&
          (OP_TYPES as readonly string[]).includes(op.type as string) &&
          JSON.stringify(op).length <= MAX_OP_BYTES
        if (!valid) return 'invalid'
        // A retry of something already stored is acknowledged with the stored copy, not added again.
        const existing = seen.has(op.oid as string) ? s.ops.find((o) => o.oid === op.oid) : undefined
        if (existing) {
          accepted.push(existing)
          continue
        }
        if (s.ops.length + added.length >= maxOps) return 'full'
        const stored = { ...op, seq: s.ops.length + added.length + 1 } as StoredOp
        added.push(stored)
        accepted.push(stored)
        seen.add(stored.oid)
      }
      s.ops.push(...added)
      s.touched = now()
      if (added.length) save()
      return { ops: accepted, seq: s.ops.length }
    },
  }
}

export const defaultSessions = createSessionStore()
