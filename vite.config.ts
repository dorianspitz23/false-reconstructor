import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

/**
 * Open Graph tags need absolute URLs, so the canonical address has to be baked
 * in at build time. CI sets this from the CNAME file when a custom domain is
 * attached; the default is where the project site currently lives.
 */
const SITE_URL = process.env.VITE_SITE_URL ?? 'https://dorianspitz23.github.io/false-reconstructor/'

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
