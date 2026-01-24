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
        'celestial-portal': resolve(__dirname, 'celestial-portal-entry.html'),
        'living-color': resolve(__dirname, 'living-color-entry.html'),
        gyraflux: resolve(__dirname, 'gyraflux-entry.html'),
        // 'arrival-glyph': resolve(__dirname, 'arrival-glyph-entry.html'), // TODO: Fix TypeScript syntax
        'death-flip': resolve(__dirname, 'death-flip-entry.html'),
        'nodal-network': resolve(__dirname, 'nodal-network-entry.html'),
        'rcm-visual': resolve(__dirname, 'rcm-visual-entry.html'),
        'triphase-matrix': resolve(__dirname, 'triphase-matrix-entry.html')
      },
      output: {
        entryFileNames: '[name].js',
        chunkFileNames: '[name].js',
        assetFileNames: '[name].[ext]'
      }
    }
  }
})
