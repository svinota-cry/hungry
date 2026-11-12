import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  // Relative base keeps the build working on GitHub Pages project sites,
  // custom domains, and plain static file servers without extra config.
  base: './',
  plugins: [react()],
})
