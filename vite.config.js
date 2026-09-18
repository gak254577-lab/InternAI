import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // Proxy /api/adzuna/* → https://api.adzuna.com/v1/api/*
      // This bypasses CORS — the browser calls localhost, Vite forwards to Adzuna
      '/api/adzuna': {
        target: 'https://api.adzuna.com/v1/api',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/adzuna/, ''),
        secure: true,
      },
    },
  },
})

