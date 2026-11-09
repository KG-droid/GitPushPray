// @vitest-environment node
import { createServer, type Server } from 'node:http'
import type { AddressInfo } from 'node:net'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { createGuard } from './guard.ts'
import { handleApi } from './http.ts'

// The fake SDK says "live" and then fails, so the first mode event tells us which path a request took.
vi.mock('@anthropic-ai/sdk', () => {
  class APIError extends Error {
    status = 503
  }
  class Anthropic {
    static APIError = APIError
    messages = {
      stream: () => ({ [Symbol.asyncIterator]: () => ({ next: () => Promise.reject(new APIError('down')) }) }),
      create: () => Promise.reject(new APIError('down')),
    }
  }
  return { default: Anthropic }
})

const joiner = { firstName: 'Priya', role: 'Software Engineer', jobFamily: 'technology', location: 'Leeds', workPattern: 'hybrid', isSmcr: false, startDate: '2026-12-07', daysToStart: 28, currentStage: 'Unlock & choose' }
let server: Server

async function start(config: Parameters<typeof handleApi>[2], guard?: ReturnType<typeof createGuard>) {
  server = createServer((req, res) => void handleApi(req, res, config, guard))
  await new Promise<void>((r) => server.listen(0, r))
  return `http://127.0.0.1:${(server.address() as AddressInfo).port}`
}
afterEach(() => new Promise<void>((r) => (server ? server.close(() => r()) : r())))

async function firstMode(url: string, headers: Record<string, string> = {}) {
  const res = await fetch(`${url}/api/ask`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...headers },
    body: JSON.stringify({ messages: [{ role: 'user', content: 'Can I work from home in week one?' }], joiner }),
  })
  return /"mode":"(live|offline)"/.exec(await res.text())?.[1]
}

describe('API guard', () => {
  it('uses live Claude only for requests carrying the access code', async () => {
    const url = await start({ apiKey: 'test-key' }, createGuard({ accessCode: 'judge-code' }))
    expect(await firstMode(url, { 'X-Demo-Key': 'judge-code' })).toBe('live')
    expect(await firstMode(url)).toBe('offline')
    expect(await firstMode(url, { 'X-Demo-Key': 'wrong' })).toBe('offline')
  })

  it('falls back to scripted answers, not an error, once the limit is hit', async () => {
    const url = await start({ apiKey: 'test-key' }, createGuard({ dailyTotal: 1 }))
    expect(await firstMode(url)).toBe('live')
    expect(await firstMode(url)).toBe('offline')
  })

  it('keeps the admin suggestions offline unless they are switched on', async () => {
    const url = await start({ apiKey: 'test-key', insightsLive: false })
    const res = await fetch(`${url}/api/insights`, {
      method: 'POST',
      body: JSON.stringify({ summary: { scope: 'All roles', responses: 0, questions: 0, enps: { n: 0 }, mood: [], topics: [], themes: [] } }),
    })
    expect(((await res.json()) as { mode: string }).mode).toBe('offline')
  })
})
