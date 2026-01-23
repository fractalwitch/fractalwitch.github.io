import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

export default defineConfig({
  plugins: [react()],
  base: './',
  build: {
    outDir: 'modules',
    emptyOutDir: false,
    rollupOptions: {
      input: {
        breathe: resolve(__dirname, 'breathe-entry.html'),
        'celestial-portal': resolve(__dirname, 'celestial-portal-entry.html')
      },
      output: {
        entryFileNames: '[name].js',
        chunkFileNames: '[name].js',
        assetFileNames: '[name].[ext]'
      }
    }
  }
})
