import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { tanstackRouter } from '@tanstack/router-vite-plugin'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  root: 'frontend',
  envDir: '..',
  cacheDir: '../.vite',
  plugins: [
    react(),
    tanstackRouter(),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './frontend/src'),
    },
  },
  build: {
    outDir: 'dist/client',
    emptyOutDir: true,
  }
})
