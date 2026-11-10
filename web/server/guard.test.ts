// @vitest-environment node
import type { IncomingMessage } from 'node:http'
import { describe, expect, it } from 'vitest'
import { clientIp, createGuard } from './guard.ts'

const req = (headers: Record<string, string> = {}): IncomingMessage => ({ headers, socket: { remoteAddress: '10.0.0.1' } }) as unknown as IncomingMessage

describe('access code', () => {
  const guard = createGuard({ accessCode: 'secret-code' })

  it('lets a request with the right code use live Claude', () => {
    expect(guard.allow(req({ 'x-demo-key': 'secret-code' }))).toBe(true)
  })

  it('keeps everyone else on the offline answers', () => {
    expect(guard.allow(req())).toBe(false)
    expect(guard.allow(req({ 'x-demo-key': 'nope' }))).toBe(false)
    expect(guard.allow(req({ 'x-demo-key': 'secret-code-and-more' }))).toBe(false)
  })

  it('needs no code when none is configured', () => {
    expect(createGuard().allow(req())).toBe(true)
  })
})

describe('rate limits', () => {
  it('limits each address per minute, then lets it back in', () => {
    let t = 0
    const guard = createGuard({ perIpPerMinute: 2, now: () => t })
    const a = req({ 'x-forwarded-for': '1.1.1.1' })
    expect([guard.allow(a), guard.allow(a), guard.allow(a)]).toEqual([true, true, false])
    expect(guard.allow(req({ 'x-forwarded-for': '2.2.2.2' }))).toBe(true)
    t = 61_000
    expect(guard.allow(a)).toBe(true)
  })

  it('caps the whole site per day and starts again tomorrow', () => {
    let t = Date.parse('2026-11-12T10:00:00Z')
    const guard = createGuard({ dailyTotal: 3, perIpPerMinute: 100, now: () => t })
    const results = ['1.1.1.1', '2.2.2.2', '3.3.3.3', '4.4.4.4'].map((ip) => guard.allow(req({ 'x-forwarded-for': ip })))
    expect(results).toEqual([true, true, true, false])
    t = Date.parse('2026-11-13T00:00:01Z')
    expect(guard.allow(req({ 'x-forwarded-for': '4.4.4.4' }))).toBe(true)
  })

  it('does not count refused requests against the daily total', () => {
    const guard = createGuard({ accessCode: 'c', dailyTotal: 1 })
    for (let i = 0; i < 5; i++) guard.allow(req())
    expect(guard.allow(req({ 'x-demo-key': 'c' }))).toBe(true)
  })
})

describe('clientIp', () => {
  it('trusts the last forwarded address, which Azure adds, not one the caller made up', () => {
    expect(clientIp(req({ 'x-forwarded-for': '6.6.6.6, 81.2.3.4:51234' }))).toBe('81.2.3.4')
  })

  it('falls back to the socket address', () => {
    expect(clientIp(req())).toBe('10.0.0.1')
  })
})
