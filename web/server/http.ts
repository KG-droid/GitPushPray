import type { IncomingMessage, ServerResponse } from 'node:http'
import type { AskRequest, HandoverRequest } from '../src/assistant/protocol.ts'
import { ask, summariseHandover, type AssistantConfig } from './ask.ts'

/**
 * Node HTTP handler for /api/ask and /api/handover. The Vite dev server mounts this locally;
 * the Azure Static Web Apps function wraps the same ask()/summariseHandover() calls.
 */
export async function handleApi(req: IncomingMessage, res: ServerResponse, config: AssistantConfig): Promise<boolean> {
  const path = (req.url ?? '').split('?')[0]
  if (path !== '/api/ask' && path !== '/api/handover') return false

  if (req.method !== 'POST') {
    res.statusCode = 405
    res.end()
    return true
  }

  let body: unknown
  try {
    body = JSON.parse(await readBody(req, 64 * 1024))
  } catch {
    res.statusCode = 400
    res.end('Invalid JSON')
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
