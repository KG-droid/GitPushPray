/// <reference types="vitest/config" />
import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv, type Plugin } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

/**
 * Serves /api/* from server/ during development, so the assistant works with `npm run dev`.
 * The API key is read server-side from web/.env and never reaches the browser bundle.
 */
function joinerApi(): Plugin {
  return {
    name: 'joiner-api',
    configureServer(server) {
      const env = loadEnv(server.config.mode, server.config.root, '')
      server.middlewares.use(async (req, res, next) => {
        if (!req.url?.startsWith('/api/')) return next()
        try {
          const { handleApi } = (await server.ssrLoadModule('/server/http.ts')) as typeof import('./server/http.ts')
          const handled = await handleApi(req, res, { apiKey: env.ANTHROPIC_API_KEY, model: env.ASSISTANT_MODEL })
          if (!handled) next()
        } catch (error) {
          next(error)
        }
      })
    },
  }
}

export default defineConfig({
  plugins: [
    react(),
    joinerApi(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icon.svg', 'brand/*'],
      workbox: { navigateFallbackDenylist: [/^\/api\//] },
      manifest: {
        name: 'LBG Joiner Companion',
        short_name: 'Joiner',
        description: 'Your companion from offer to Day 30 at Lloyds Banking Group.',
        theme_color: '#006A4D',
        background_color: '#F4F6F5',
        display: 'standalone',
        start_url: '/today',
        icons: [{ src: '/icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any maskable' }],
      },
    }),
  ],
  // host: true lets a phone on the same Wi-Fi open the dev server.
  server: { host: true },
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    exclude: ['e2e/**', 'node_modules/**'],
  },
})
