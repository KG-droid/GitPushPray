import { createHash, timingSafeEqual } from 'node:crypto'
import type { IncomingMessage } from 'node:http'

/**
 * Keeps the Claude key from being spent by strangers. A request that fails the guard is not rejected:
 * it gets the scripted offline answers instead, so the app always works and only live Claude is protected.
 */

export interface GuardOptions {
  /** If set, live answers need this value in the X-Demo-Key header. Unset means no code is required. */
  accessCode?: string
  perIpPerMinute?: number
  /** Live requests allowed across everyone, per UTC day */
  dailyTotal?: number
  now?: () => number
}

export interface Guard {
  /** True if this request may use live Claude. Counts it against the limits when it does. */
  allow(req: IncomingMessage): boolean
}

const sha = (s: string) => createHash('sha256').update(s).digest()

export function createGuard({ accessCode, perIpPerMinute = 20, dailyTotal = 500, now = Date.now }: GuardOptions = {}): Guard {
  const hits = new Map<string, number[]>()
  let day = new Date(now()).toISOString().slice(0, 10)
  let total = 0

  return {
    allow(req) {
      if (accessCode) {
        const given = req.headers['x-demo-key']
        if (typeof given !== 'string' || !timingSafeEqual(sha(given), sha(accessCode))) return false
      }

      const t = now()
      const today = new Date(t).toISOString().slice(0, 10)
      if (today !== day) {
        day = today
        total = 0
      }
      if (total >= dailyTotal) return false

      const ip = clientIp(req)
      const recent = (hits.get(ip) ?? []).filter((at) => t - at < 60_000)
      if (recent.length >= perIpPerMinute) {
        hits.set(ip, recent)
        return false
      }
      hits.set(ip, [...recent, t])
      total++

      // Keep the map small: forget anyone who hasn't been seen for a minute.
      if (hits.size > 1000) {
        for (const [key, times] of hits) if (times.every((at) => t - at >= 60_000)) hits.delete(key)
      }
      return true
    },
  }
}

/** Azure's front end appends the real client address to X-Forwarded-For, so the last entry is the one to trust. */
export function clientIp(req: IncomingMessage): string {
  const forwarded = req.headers['x-forwarded-for']
  const last = (Array.isArray(forwarded) ? forwarded.join(',') : forwarded)?.split(',').at(-1)?.trim()
  if (last) return last.replace(/^(\d+\.\d+\.\d+\.\d+):\d+$/, '$1')
  return req.socket?.remoteAddress ?? 'unknown'
}
