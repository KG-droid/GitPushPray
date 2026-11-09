import { createReadStream, existsSync, statSync } from 'node:fs'
import { createServer } from 'node:http'
import { extname, join, normalize, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { handleApi } from './http.ts'

/**
 * Production server: serves the built PWA and the /api endpoints from one process.
 * Azure App Service sets PORT; the Claude key comes from the ANTHROPIC_API_KEY app setting.
 */

const here = fileURLToPath(new URL('.', import.meta.url))
const root = resolve(process.env.STATIC_DIR ?? join(here, '..', 'dist'))
const port = Number(process.env.PORT ?? 8080)
const config = { apiKey: process.env.ANTHROPIC_API_KEY, model: process.env.ASSISTANT_MODEL }

const types: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
  '.json': 'application/json',
  '.webmanifest': 'application/manifest+json',
  '.woff2': 'font/woff2',
  '.txt': 'text/plain; charset=utf-8',
}

const server = createServer(async (req, res) => {
  res.setHeader('X-Content-Type-Options', 'nosniff')
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin')
  res.setHeader('X-Frame-Options', 'DENY')

  try {
    if (await handleApi(req, res, config)) return
  } catch (error) {
    console.error('[api]', error)
    if (!res.headersSent) res.statusCode = 500
    res.end()
    return
  }

  if (req.url === '/healthz') {
    res.end(config.apiKey ? 'ok (live)' : 'ok (offline)')
    return
  }

  if (req.method !== 'GET' && req.method !== 'HEAD') {
    res.statusCode = 405
    res.end()
    return
  }

  // Resolve inside the static root only; anything else falls back to the SPA shell.
  const path = decodeURIComponent((req.url ?? '/').split('?')[0])
  let file = normalize(join(root, path))
  if (!file.startsWith(root) || !existsSync(file) || statSync(file).isDirectory()) file = join(root, 'index.html')

  const name = file.slice(root.length)
  const immutable = name.startsWith('/assets/')
  res.setHeader('Content-Type', types[extname(file)] ?? 'application/octet-stream')
  // Hashed assets can be cached forever; the shell and service worker must always be fresh.
  res.setHeader('Cache-Control', immutable ? 'public, max-age=31536000, immutable' : 'no-cache')
  if (req.method === 'HEAD') {
    res.end()
    return
  }
  createReadStream(file).pipe(res)
})

server.listen(port, () => {
  console.log(`LBG Joiner Companion on :${port} (assistant ${config.apiKey ? 'live' : 'offline'})`)
})
