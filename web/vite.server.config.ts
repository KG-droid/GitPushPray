import { defineConfig } from 'vite'

/**
 * Bundles server/serve.ts (and the Anthropic SDK) into one file, so the deploy package
 * needs no `npm install` on Azure: just `node server/index.mjs`.
 */
export default defineConfig({
  publicDir: false,
  build: {
    ssr: 'server/serve.ts',
    outDir: 'dist-server',
    emptyOutDir: true,
    target: 'node22',
    rollupOptions: { output: { entryFileNames: 'index.mjs', format: 'es' } },
  },
  ssr: { noExternal: true, target: 'node' },
})
