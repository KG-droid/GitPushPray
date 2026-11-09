import type { IncomingMessage, ServerResponse } from 'node:http'
import type { AskRequest, HandoverRequest, InsightsRequest } from '../src/assistant/protocol.ts'
import { ask, recommendFromInsights, summariseHandover, type AssistantConfig } from './ask.ts'
import type { Guard } from './guard.ts'
import { defaultSessions, type SessionStore } from './sessions.ts'

/**
 * Node HTTP handler for /api/ask, /api/handover and /api/insights. The Vite dev server mounts this locally
 * and the production server (serve.ts) uses it too.
 *
 * With a guard, only requests it allows reach live Claude; everyone else gets the scripted offline answers.
 */
export async function handleApi(
  req: IncomingMessage,
  res: ServerResponse,
  baseConfig: AssistantConfig,
  guard?: Guard,
  sessions: SessionStore = defaultSessions,
): Promise<boolean> {
  const path = (req.url ?? '').split('?')[0]
  if (path === '/api/session' || path.startsWith('/api/session/')) return handleSession(req, res, path, sessions)
  if (path !== '/api/ask' && path !== '/api/handover' && path !== '/api/insights') return false

  if (req.method !== 'POST') {
    res.statusCode = 405
    res.end()
    return true
  }

  const config: AssistantConfig = baseConfig.apiKey && guard && !guard.allow(req) ? { ...baseConfig, apiKey: undefined } : baseConfig

  let body: unknown
  try {
    body = JSON.parse(await readBody(req, 64 * 1024))
  } catch {
    res.statusCode = 400
    res.end('Invalid JSON')
    return true
  }

  if (path === '/api/insights') {
    // The admin suggestions are the least interesting live use, so they stay on the built-in baseline unless switched on.
    const result = await recommendFromInsights(body as InsightsRequest, config.insightsLive === false ? { ...config, apiKey: undefined } : config)
    res.setHeader('Content-Type', 'application/json')
    res.end(JSON.stringify(result))
    return true
  }

  if (path === '/api/handover') {
    const result = await summariseHandover(body as HandoverRequest, config)
    res.setHeader('Content-Type', 'application/json')
    res.end(JSON.stringify(result))
    return true
  }

  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache, no-transform',
    Connection: 'keep-alive',
  })
  for await (const event of ask(body as AskRequest, config)) {
    res.write(`data: ${JSON.stringify(event)}\n\n`)
  }
  res.end()
  return true
}

/** Sends a JSON reply. Returns true, so handlers can `return json(...)` to say the request was handled. */
const json = (res: ServerResponse, status: number, body: unknown): true => {
  res.statusCode = status
  res.setHeader('Content-Type', 'application/json')
  res.setHeader('Cache-Control', 'no-store')
  res.end(JSON.stringify(body))
  return true
}

/** Shared demo sessions: POST /api/session, then GET or POST /api/session/<id>/ops. */
async function handleSession(req: IncomingMessage, res: ServerResponse, path: string, sessions: SessionStore): Promise<boolean> {
  if (path === '/api/session') {
    if (req.method !== 'POST') return json(res, 405, { error: 'method' })
    return json(res, 200, { id: sessions.create() })
  }

  const match = /^\/api\/session\/([^/]+)\/ops$/.exec(path)
  if (!match) return json(res, 404, { error: 'not found' })
  const id = match[1]

  if (req.method === 'GET') {
    const since = Number(new URL(req.url ?? '', 'http://x').searchParams.get('since')) || 0
    const result = sessions.ops(id, Math.max(0, since))
    return result ? json(res, 200, result) : json(res, 404, { error: 'unknown session' })
  }

  if (req.method === 'POST') {
    let body: { ops?: unknown }
    try {
      body = JSON.parse(await readBody(req, 64 * 1024)) as { ops?: unknown }
    } catch {
      return json(res, 400, { error: 'bad body' })
    }
    if (!Array.isArray(body.ops) || body.ops.length > 100) return json(res, 400, { error: 'bad ops' })
    const result = sessions.append(id, body.ops)
    if (!result) return json(res, 404, { error: 'unknown session' })
    if (result === 'invalid') return json(res, 400, { error: 'bad ops' })
    if (result === 'full') return json(res, 413, { error: 'session is full' })
    return json(res, 200, result)
  }

  return json(res, 405, { error: 'method' })
}

function readBody(req: IncomingMessage, limit: number): Promise<string> {
  return new Promise((resolve, reject) => {
    let size = 0
    const chunks: Buffer[] = []
    req.on('data', (c: Buffer) => {
      size += c.length
      if (size > limit) {
        reject(new Error('Body too large'))
        req.destroy()
      } else chunks.push(c)
    })
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')))
    req.on('error', reject)
  })
}
