import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react-swc";
import path from "path";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./src/test/setup.ts"],
    include: ["src/**/*.{test,spec}.{ts,tsx}", "scripts/**/*.{test,spec}.{ts,tsx}"],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'text-summary', 'json', 'html', 'json-summary'],
      exclude: ['node_modules/', 'src/test/setup.ts'],
      // Gate de coverage mínimo para o núcleo do Nexus.
      // Falha o CI se a cobertura cair abaixo do esperado.
      include: ['src/lib/nexusContent.ts'],
      thresholds: {
        statements: 90,
        branches: 80,
        functions: 90,
        lines: 90,
      },
    },

    reporters: ['default', 'json'],
    outputFile: 'test-results.json'
  },
  resolve: {
    alias: { "@": path.resolve(__dirname, "./src") },
  },
});
