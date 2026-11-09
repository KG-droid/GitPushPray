// @vitest-environment node
import { mkdtempSync, readFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { createSessionStore, SESSION_ID } from './sessions.ts'

const op = (oid: string, extra: Record<string, unknown> = {}) => ({ oid, type: 'event', event: { id: oid }, ...extra })

describe('session store', () => {
  it('makes hard-to-guess codes', () => {
    const store = createSessionStore()
    const a = store.create()
    expect(a).toMatch(SESSION_ID)
    expect(store.create()).not.toBe(a)
  })

  it('numbers actions in the order they arrive and returns only what is new', () => {
    const store = createSessionStore()
    const id = store.create()
    store.append(id, [op('a'), op('b')])
    store.append(id, [op('c')])
    expect(store.ops(id, 0)?.ops.map((o) => [o.seq, o.oid])).toEqual([[1, 'a'], [2, 'b'], [3, 'c']])
    expect(store.ops(id, 2)?.ops.map((o) => o.oid)).toEqual(['c'])
    expect(store.ops(id, 3)).toMatchObject({ ops: [], seq: 3 })
  })

  it('does not apply a retried action twice', () => {
    const store = createSessionStore()
    const id = store.create()
    store.append(id, [op('a')])
    const again = store.append(id, [op('a'), op('b')])
    expect(again).toMatchObject({ seq: 2 })
    expect(again !== 'full' && again !== 'invalid' && again?.ops.map((o) => [o.seq, o.oid])).toEqual([[1, 'a'], [2, 'b']])
  })

  it('refuses malformed, oversized and unknown-type actions', () => {
    const store = createSessionStore()
    const id = store.create()
    expect(store.append(id, [{ type: 'event' }])).toBe('invalid')
    expect(store.append(id, [op('a', { type: 'delete-everything' })])).toBe('invalid')
    expect(store.append(id, [op('a', { blob: 'x'.repeat(9000) })])).toBe('invalid')
    expect(store.ops(id, 0)?.ops).toEqual([])
  })

  it('stops a session growing without limit', () => {
    const store = createSessionStore({ maxOps: 2 })
    const id = store.create()
    expect(store.append(id, [op('a'), op('b')])).toMatchObject({ seq: 2 })
    expect(store.append(id, [op('c')])).toBe('full')
  })

  it('knows nothing about an unknown or malformed code', () => {
    const store = createSessionStore()
    expect(store.ops('abcdefgh', 0)).toBeUndefined()
    expect(store.ops('../../etc', 0)).toBeUndefined()
    expect(store.append('abcdefgh', [op('a')])).toBeUndefined()
  })

  it('forgets a session a day after it was last used', () => {
    let t = 0
    const store = createSessionStore({ now: () => t })
    const id = store.create()
    t = 23 * 3600_000
    expect(store.ops(id, 0)).toBeDefined() // using it keeps it alive
    t += 23 * 3600_000
    expect(store.ops(id, 0)).toBeDefined()
    t += 25 * 3600_000
    expect(store.ops(id, 0)).toBeUndefined()
  })

  it('makes room by dropping the quietest session when full', () => {
    let t = 0
    const store = createSessionStore({ maxSessions: 2, now: () => t })
    const first = store.create()
    t = 10
    const second = store.create()
    t = 20
    store.ops(first, 0) // first was used more recently than second
    t = 30
    store.create()
    expect(store.ops(first, 0)).toBeDefined()
    expect(store.ops(second, 0)).toBeUndefined()
  })

  it('keeps sessions across a restart when given a file', async () => {
    const file = join(mkdtempSync(join(tmpdir(), 'sessions-')), 'sessions.json')
    const store = createSessionStore({ file })
    const id = store.create()
    store.append(id, [op('a')])
    await new Promise((r) => setTimeout(r, 1200))
    expect(readFileSync(file, 'utf8')).toContain('"oid":"a"')
    expect(createSessionStore({ file }).ops(id, 0)?.ops.map((o) => o.oid)).toEqual(['a'])
  })
})
