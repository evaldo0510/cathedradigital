import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { VitePWA } from 'vite-plugin-pwa';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false,
    },
  },
  plugins: [
    react(),
    mode === "development" && componentTagger(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'icon-192.png', 'icon-512.png', 'icon-maskable.png', 'robots.txt'],
      manifest: {
        name: 'Cathedra Digital',
        short_name: 'Cathedra',
        description: 'Sanctum Teologicum — Bíblia, Catecismo, Magistério e oração',
        theme_color: '#1a1a1a',
        background_color: '#1a1a1a',
        display: 'standalone',
        orientation: 'portrait',
        lang: 'pt-BR',
        categories: ['education', 'books', 'lifestyle'],
        icons: [
          {
            src: 'icon-192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'icon-512.png',
            sizes: '512x512',
            type: 'image/png'
          },
          {
            src: 'icon-maskable.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable'
          }
        ],
        shortcuts: [
          {
            name: 'Bíblia Sagrada',
            short_name: 'Bíblia',
            url: '/biblia',
            icons: [{ src: 'icon-192.png', sizes: '192x192' }]
          },
          {
            name: 'Orações',
            short_name: 'Oração',
            url: '/oracao',
            icons: [{ src: 'icon-192.png', sizes: '192x192' }]
          },
          {
            name: 'Catecismo',
            short_name: 'Catecismo',
            url: '/catecismo',
            icons: [{ src: 'icon-192.png', sizes: '192x192' }]
          }
        ]
      },
      workbox: {
        runtimeCaching: [
          {
            urlPattern: ({ url }) => url.pathname.includes('/functions/v1/liturgical-calendar'),
            handler: 'NetworkFirst',
            options: {
              cacheName: 'cathedra-liturgy-v1',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 7, // 1 week
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365, // 1 year
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
          {
            urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'gstatic-fonts-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365, // 1 year
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
          {
            urlPattern: /^https:\/\/images\.unsplash\.com\/.*/i,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'unsplash-images-cache',
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 60 * 24 * 30, // 30 days
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          }
        ],
      },
    }),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules/react-dom') || id.includes('node_modules/react/') || id.includes('node_modules/react-router')) return 'vendor-react';
          if (id.includes('node_modules/@supabase')) return 'vendor-supabase';
          if (id.includes('node_modules/framer-motion')) return 'vendor-motion';
          if (id.includes('node_modules/recharts') || id.includes('node_modules/d3-')) return 'vendor-recharts';
          if (id.includes('node_modules/canvas-confetti')) return 'vendor-confetti';
          if (id.includes('node_modules/html2canvas')) return 'vendor-html2canvas';
          if (id.includes('node_modules/@radix-ui/react-dialog') || id.includes('node_modules/@radix-ui/react-popover') || id.includes('node_modules/@radix-ui/react-tabs') || id.includes('node_modules/@radix-ui/react-accordion') || id.includes('node_modules/@radix-ui/react-dropdown-menu') || id.includes('node_modules/@radix-ui/react-scroll-area') || id.includes('node_modules/@radix-ui/react-select') || id.includes('node_modules/@radix-ui/react-tooltip')) return 'vendor-ui';
          // Isolate heavy data files
          if (id.includes('src/data/saints')) return 'data-saints';
          if (id.includes('src/data/apparitions')) return 'data-apparitions';
          if (id.includes('src/data/cross-references')) return 'data-cross-refs';
        },
      },
    },
    target: 'es2020',
    cssMinify: true,
  },
}));
