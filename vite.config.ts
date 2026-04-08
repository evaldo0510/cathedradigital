import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false,
    },
  },
  plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
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
