import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

/**
 * Open Graph tags need absolute URLs, so the canonical address has to be baked
 * in at build time. CI works the real one out from the repo — custom domain,
 * owner site, or project site — and passes it in. This fallback only ever
 * applies to a local build, so it names no account: hardcoding one here would
 * be a second copy of a fact that lives in the repo's own settings, and it
 * would go stale the moment the site moved.
 */
const SITE_URL = process.env.VITE_SITE_URL ?? 'http://localhost/'

// `base` is overridden in CI so the bundle works from a GitHub Pages subpath.
export default defineConfig({
  plugins: [
    react(),
    {
      name: 'site-url',
      transformIndexHtml: (html) => html.replaceAll('%SITE_URL%', SITE_URL),
    },
  ],
  base: process.env.VITE_BASE ?? '/',
  test: {
    globals: true,
    environment: 'node',
    include: ['tests/**/*.test.ts'],
  },
})
