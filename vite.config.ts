import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      // Descarga las versiones nuevas en segundo plano; los datos de localStorage no se tocan.
      registerType: 'autoUpdate',
      // Los íconos ya entran por globPatterns; así no se duplican en el precache.
      includeManifestIcons: false,
      manifest: {
        name: 'Dulce Balance Repostería',
        short_name: 'Dulce Balance',
        description: 'Calculadora de costos, precios y bolsillos para repostería artesanal.',
        lang: 'es-CO',
        start_url: '/',
        display: 'standalone',
        orientation: 'portrait',
        theme_color: '#fff9f8',
        background_color: '#fff9f8',
        icons: [
          { src: 'pwa-64x64.png', sizes: '64x64', type: 'image/png' },
          { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png' },
          {
            src: 'maskable-icon-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        // Guarda también los íconos para que la app abra completa sin conexión.
        globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
      },
    }),
  ],
})
