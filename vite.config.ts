import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { VitePWA } from 'vite-plugin-pwa';
import { sentryVitePlugin } from "@sentry/vite-plugin";
import { mcpPlugin } from "@lovable.dev/mcp-js/stacks/supabase/vite";

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
    mcpPlugin(),
    mode === "development" && componentTagger(),
    {
      name: 'seo-headers',
      configureServer(server: any) {
        server.middlewares.use((req: any, res: any, next: any) => {
          if (req.url === '/sitemap.xml') {
            res.setHeader('Content-Type', 'application/xml');
            res.setHeader('Cache-Control', 'public, max-age=3600');
          }
          if (req.url === '/robots.txt') {
            res.setHeader('Content-Type', 'text/plain');
            res.setHeader('Cache-Control', 'public, max-age=3600');
          }
          next();
        });
      },
      configurePreviewServer(server: any) {
        server.middlewares.use((req: any, res: any, next: any) => {
          if (req.url === '/sitemap.xml') {
            res.setHeader('Content-Type', 'application/xml');
            res.setHeader('Cache-Control', 'public, max-age=3600');
          }
          if (req.url === '/robots.txt') {
            res.setHeader('Content-Type', 'text/plain');
            res.setHeader('Cache-Control', 'public, max-age=3600');
          }
          next();
        });
      }
    },
    VitePWA({
      strategies: 'injectManifest',
      srcDir: 'src',
      filename: 'sw.js',
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'favicon.png', 'icon-192.png', 'icon-512.png', 'icon-maskable.png', 'robots.txt', 'logos-avatar.png', 'logos-aquinas.png', 'logos-colloquium.png'],
      manifest: {
        name: 'Cathedra Digital',
        short_name: 'Cathedra',
        description: 'Sanctum Teologicum — Bíblia, Catecismo, Magistério e oração',
        theme_color: '#0A192F',
        background_color: '#0A192F',
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
    }),
    // Upload de sourcemaps para o Sentry — só ativa em build quando as três
    // variáveis de ambiente estão presentes (SENTRY_AUTH_TOKEN é secret de
    // BUILD, configurado em Workspace Settings → Build Secrets).
    ...(mode !== 'development' &&
    process.env.SENTRY_AUTH_TOKEN &&
    process.env.SENTRY_ORG &&
    process.env.SENTRY_PROJECT
      ? [
          sentryVitePlugin({
            authToken: process.env.SENTRY_AUTH_TOKEN,
            org: process.env.SENTRY_ORG,
            project: process.env.SENTRY_PROJECT,
            release: {
              name: process.env.SENTRY_RELEASE || process.env.VITE_GIT_SHA || undefined,
            },
            sourcemaps: {
              filesToDeleteAfterUpload: ['./dist/**/*.map'],
            },
            telemetry: false,
          }),
        ]
      : []),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    sourcemap: true, // exigido pelo Sentry para stack traces resolvidos
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules/react-dom') || id.includes('node_modules/react/') || id.includes('node_modules/react-router')) return 'vendor-react';
          if (id.includes('node_modules/@supabase')) return 'vendor-supabase';
          if (id.includes('node_modules/framer-motion')) return 'vendor-motion';
          if (id.includes('node_modules/recharts') || id.includes('node_modules/d3-')) return 'vendor-recharts';
          if (id.includes('node_modules/lucide-react')) return 'vendor-lucide';
          if (id.includes('node_modules/@sentry')) return 'vendor-sentry';
          if (id.includes('node_modules/jspdf')) return 'vendor-pdf';
          if (id.includes('node_modules/canvas-confetti')) return 'vendor-confetti';
          if (id.includes('node_modules/html2canvas')) return 'vendor-html2canvas';
          if (id.includes('node_modules/@radix-ui/')) return 'vendor-ui';
          // Isolate heavy data files
          if (id.includes('src/data/apparitions')) return 'data-apparitions';
          if (id.includes('src/data/cross-references')) return 'data-cross-refs';
        },
      },
    },
    target: 'es2020',
    cssMinify: true,
  },
}));
