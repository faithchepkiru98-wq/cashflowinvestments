import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'masked-icon.svg'],
      // ── SPA fallback: service worker serves index.html for all nav requests ──
      workbox: {
        navigateFallback: '/index.html',
        navigateFallbackDenylist: [/^\/api\//],   // don't intercept API calls
        globPatterns: ['**/*.{js,css,html,ico,png,svg,webp,woff2}']
      },
      manifest: {
        name: 'Cashflowvest',
        short_name: 'Cashflowvest',
        description: 'Smart Investment Solutions for Modern Investors',
        theme_color: '#050505',
        background_color: '#050505',
        display: 'standalone',
        icons: [
          {
            src: '/icon.svg',
            sizes: 'any',
            type: 'image/svg+xml',
            purpose: 'any maskable'
          }
        ]
      }
    })
  ],
})
