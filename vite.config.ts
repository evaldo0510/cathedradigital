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
    {
      name: 'seo-headers',
      configureServer(server) {
        server.middlewares.use((req, res, next) => {
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
      configurePreviewServer(server) {
        server.middlewares.use((req, res, next) => {
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
...
        ]
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
          if (id.includes('src/data/apparitions')) return 'data-apparitions';
          if (id.includes('src/data/cross-references')) return 'data-cross-refs';
        },
      },
    },
    target: 'es2020',
    cssMinify: true,
  },
}));
