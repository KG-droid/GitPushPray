import { afterEach, describe, expect, it, vi } from 'vitest'
import { createMockRepository, memoryStorage, type Repository } from './repository'

interface FakeOp {
  oid: string
  seq: number
  [field: string]: unknown
}

/** A stand-in for the server's session API: numbers actions in arrival order and ignores repeats. */
function fakeServer() {
  const sessions = new Map<string, FakeOp[]>()
  const state = { down: false }
  const fetchImpl = (async (input: RequestInfo | URL, init?: RequestInit) => {
    if (state.down) throw new TypeError('network down')
    const path = String(input)
    const reply = (status: number, body: unknown) => new Response(JSON.stringify(body), { status })
    if (path === '/api/session') {
      const id = `abcd${String(sessions.size + 2).padStart(4, '2')}`
      sessions.set(id, [])
      return reply(200, { id })
    }
    const m = /^\/api\/session\/([^/]+)\/ops(?:\?since=(\d+))?$/.exec(path)
    const ops = m && sessions.get(m[1])
    if (!m || !ops) return reply(404, {})
    if (init?.method === 'POST') {
      const accepted: FakeOp[] = []
      for (const incoming of (JSON.parse(String(init.body)) as { ops: { oid: string }[] }).ops) {
        const known = ops.find((o) => o.oid === incoming.oid)
        const stored: FakeOp = known ?? { ...incoming, seq: ops.length + 1 }
        if (!known) ops.push(stored)
        accepted.push(stored)
      }
      return reply(200, { ops: accepted, seq: ops.length })
    }
    return reply(200, { ops: ops.filter((o) => o.seq > Number(m[2] ?? 0)), seq: ops.length })
  }) as typeof fetch
  return { fetchImpl, state, sessions }
}

const at = '2026-11-09T12:00:00Z'
const done = (personaId: string, stepId: string) => ({ personaId, type: 'step_completed' as const, at, payload: { stepId } })
const has = (repo: Repository, personaId: string, stepId: string) =>
  repo.listEvents(personaId).some((e) => (e.payload as { stepId?: string } | undefined)?.stepId === stepId && e.at === at)

const repos: Repository[] = []
function phone(server: ReturnType<typeof fakeServer>) {
  const repo = createMockRepository(memoryStorage(), { fetch: server.fetchImpl, pollMs: 10 })
  repos.push(repo)
  return repo
}
afterEach(() => repos.splice(0).forEach((r) => r.stopSharing()))

describe('shared demo', () => {
  it('shows a manager’s action on the joiner’s phone, and the other way round', async () => {
    const server = fakeServer()
    const manager = phone(server)
    const joiner = phone(server)

    const id = await manager.startSharing(null)
    joiner.joinShared(id)

    manager.addEvent(done('priya', 'mgr-set-goals'))
    await vi.waitFor(() => expect(has(joiner, 'priya', 'mgr-set-goals')).toBe(true))

    joiner.addEvent(done('priya', 'choose-kit'))
    await vi.waitFor(() => expect(has(manager, 'priya', 'choose-kit')).toBe(true))
  })

  it('shows your own action straight away, before the server has replied', async () => {
    const server = fakeServer()
    const a = phone(server)
    await a.startSharing(null)
    a.addEvent(done('priya', 'choose-kit'))
    expect(has(a, 'priya', 'choose-kit')).toBe(true)
  })

  it('carries what was already on screen into the shared demo', async () => {
    const server = fakeServer()
    const a = phone(server)
    a.addEvent(done('priya', 'choose-kit'))
    const id = await a.startSharing('2026-12-07')

    const b = phone(server)
    b.joinShared(id)
    await vi.waitFor(() => expect(has(b, 'priya', 'choose-kit')).toBe(true))
    expect(b.sharedToday()).toBe('2026-12-07')
  })

  it('shares the simulated date so both phones are on the same day', async () => {
    const server = fakeServer()
    const a = phone(server)
    const b = phone(server)
    b.joinShared(await a.startSharing(null))

    a.setSharedToday('2027-01-04')
    await vi.waitFor(() => expect(b.sharedToday()).toBe('2027-01-04'))
    b.setSharedToday(null)
    await vi.waitFor(() => expect(a.sharedToday()).toBeNull())
  })

  it('resets a persona on every phone', async () => {
    const server = fakeServer()
    const a = phone(server)
    const b = phone(server)
    b.joinShared(await a.startSharing(null))
    a.addEvent(done('priya', 'choose-kit'))
    await vi.waitFor(() => expect(has(b, 'priya', 'choose-kit')).toBe(true))

    b.reset('priya')
    await vi.waitFor(() => expect(has(a, 'priya', 'choose-kit')).toBe(false))
  })

  it('carries on through a dropped connection and catches up when it returns', async () => {
    const server = fakeServer()
    const a = phone(server)
    const b = phone(server)
    b.joinShared(await a.startSharing(null))
    await vi.waitFor(() => expect(b.shareStatus().connected).toBe(true))

    server.state.down = true
    a.addEvent(done('priya', 'choose-kit'))
    expect(has(a, 'priya', 'choose-kit')).toBe(true)
    await vi.waitFor(() => expect(a.shareStatus().connected).toBe(false))
    expect(has(b, 'priya', 'choose-kit')).toBe(false)

    server.state.down = false
    await vi.waitFor(() => expect(has(b, 'priya', 'choose-kit')).toBe(true))
    expect(a.shareStatus().connected).toBe(true)
    // Delivered once, not once per retry.
    expect(b.listEvents('priya').filter((e) => e.at === at)).toHaveLength(1)
  })

  it('keeps everything and goes private when the shared demo has expired', async () => {
    const server = fakeServer()
    const a = phone(server)
    const id = await a.startSharing(null)
    a.addEvent(done('priya', 'choose-kit'))
    await vi.waitFor(() => expect(server.sessions.get(id)?.length).toBeGreaterThan(1))

    server.sessions.clear() // the server has forgotten the session
    await vi.waitFor(() => expect(a.shareStatus().mode).toBe('solo'))
    expect(has(a, 'priya', 'choose-kit')).toBe(true)
  })

  it('stops sharing without losing what is on screen, and later changes stay private', async () => {
    const server = fakeServer()
    const a = phone(server)
    const b = phone(server)
    b.joinShared(await a.startSharing(null))
    a.addEvent(done('priya', 'choose-kit'))
    await vi.waitFor(() => expect(has(b, 'priya', 'choose-kit')).toBe(true))

    b.stopSharing()
    expect(b.shareStatus().mode).toBe('solo')
    expect(has(b, 'priya', 'choose-kit')).toBe(true)

    b.addEvent(done('priya', 'say-hello'))
    await new Promise((r) => setTimeout(r, 60))
    expect(has(a, 'priya', 'say-hello')).toBe(false)
  })

  it('rejoins the same shared demo after a reload', async () => {
    const server = fakeServer()
    const storage = memoryStorage()
    const first = createMockRepository(storage, { fetch: server.fetchImpl, pollMs: 10 })
    repos.push(first)
    const id = await first.startSharing(null)
    first.addEvent(done('priya', 'choose-kit'))
    await vi.waitFor(() => expect(first.shareStatus().connected).toBe(true))

    const reloaded = createMockRepository(storage, { fetch: server.fetchImpl, pollMs: 10 })
    repos.push(reloaded)
    expect(reloaded.shareStatus()).toMatchObject({ mode: 'shared', id })
    await vi.waitFor(() => expect(has(reloaded, 'priya', 'choose-kit')).toBe(true))
  })

  it('ignores a made-up code', () => {
    const a = phone(fakeServer())
    a.joinShared('../../x')
    expect(a.shareStatus().mode).toBe('solo')
  })
})
