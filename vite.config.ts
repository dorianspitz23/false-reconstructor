import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// `base` is overridden in CI so the bundle works from a GitHub Pages subpath.
export default defineConfig({
  plugins: [react()],
  base: process.env.VITE_BASE ?? '/',
  test: {
    globals: true,
    environment: 'node',
    include: ['tests/**/*.test.ts'],
  },
})
