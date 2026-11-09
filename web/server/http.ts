import type { IncomingMessage, ServerResponse } from 'node:http'
import type { AskRequest, HandoverRequest, InsightsRequest } from '../src/assistant/protocol.ts'
import { ask, recommendFromInsights, summariseHandover, type AssistantConfig } from './ask.ts'
import type { Guard } from './guard.ts'

/**
 * Node HTTP handler for /api/ask, /api/handover and /api/insights. The Vite dev server mounts this locally
 * and the production server (serve.ts) uses it too.
 *
 * With a guard, only requests it allows reach live Claude; everyone else gets the scripted offline answers.
 */
export async function handleApi(req: IncomingMessage, res: ServerResponse, baseConfig: AssistantConfig, guard?: Guard): Promise<boolean> {
  const path = (req.url ?? '').split('?')[0]
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
