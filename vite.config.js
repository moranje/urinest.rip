import { readFileSync } from 'node:fs'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import decisionEngine from 'decision-engine-core/vite'
import viteCompression from 'vite-plugin-compression'
import { VitePWA } from 'vite-plugin-pwa'

const pkg = JSON.parse(readFileSync('./package.json', 'utf-8'))

export default defineConfig({
  define: {
    __APP_VERSION__: JSON.stringify(pkg.version)
  },
  test: {
    passWithNoTests: true
  },
  plugins: [
    vue(),
    decisionEngine(),
    VitePWA({
      registerType: 'prompt',
      includeAssets: ['favicon.ico', 'droplet.svg', 'apple-touch-icon.png'],
      manifest: {
        name: 'urinest.rip — Beslishulp urineonderzoek',
        short_name: 'urinest.rip',
        description: 'Beslishulp urineonderzoek voor huisartsen',
        theme_color: '#16a34a',
        background_color: '#fdfcff',
        display: 'standalone',
        start_url: '/',
        icons: [
          {
            src: '/icon-192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: '/icon.png',
            sizes: '512x512',
            type: 'image/png'
          },
          {
            src: '/icon.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable'
          }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,json,png,ico}'],
        navigateFallback: '/index.html'
      }
    }),
    viteCompression({
      algorithm: 'brotliCompress',
      ext: '.br',
      threshold: 1024
    }),
    viteCompression({
      algorithm: 'gzip',
      ext: '.gz',
      threshold: 1024
    })
  ]
})
