/**
 * Baseline & pixel-parity de screenshots da Catequese — Sprint CQ-1.2/1.3
 *
 * Um único spec, dois usos:
 *
 * 1) Baseline (revisão manual, default):
 *      CATEQUESE_SCREENSHOT_DIR=tests/e2e/baseline/catequese/_review \
 *      bunx playwright test tests/e2e/catequese-baseline.spec.ts
 *
 * 2) Pixel-parity CQ-1.3 (invocado por scripts/catequese-pixel-parity.ts):
 *      VITE_MODULES_CATEQUESE=0 CATEQUESE_SCREENSHOT_DIR=.tmp/catequese-parity/flag-0 \
 *      bunx playwright test tests/e2e/catequese-baseline.spec.ts
 *      # e novamente com flag-1, seguido de diff via pixelmatch.
 *
 * Rotas cobertas: canônicas + redirects legados (que devem renderizar a mesma
 * tela de /catechism após o replace). Dois breakpoints: desktop 1280x1800 e
 * mobile 390x844.
 *
 * Pré-requisito: preview server servindo o build correto em
 * PLAYWRIGHT_TEST_BASE_URL (default http://127.0.0.1:8080).
 */

import { test, expect } from "@playwright/test";
import { mkdirSync } from "node:fs";
import { resolve } from "node:path";

const OUTPUT_DIR = resolve(
  process.env.CATEQUESE_SCREENSHOT_DIR ??
    "tests/e2e/baseline/catequese/_review",
);
mkdirSync(OUTPUT_DIR, { recursive: true });

type Route = { path: string; name: string; note?: string };

const ROUTES: Route[] = [
  { path: "/catechism", name: "catechism" },
  { path: "/catechism-legacy", name: "catechism-legacy" },
  { path: "/admin/catechism-queue", name: "admin-catechism-queue",
    note: "sem sessão admin, captura o gate — ainda válido como baseline" },
  // Redirects legados — devem terminar em /catechism.
  { path: "/catecismo", name: "redirect-catecismo" },
  { path: "/catechism-explorer", name: "redirect-catechism-explorer" },
];

const VIEWPORTS = [
  { label: "desktop", width: 1280, height: 1800 },
  { label: "mobile", width: 390, height: 844 },
] as const;

for (const route of ROUTES) {
  for (const vp of VIEWPORTS) {
    test(`catequese · ${route.path} · ${vp.label}`, async ({ page }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.goto(route.path, { waitUntil: "networkidle" });
      // Aguarda tipografia carregar para evitar diff de FOUT.
      await page.evaluate(() => document.fonts.ready);
      // Desabilita animações e cursor blink para screenshot determinístico.
      await page.addStyleTag({
        content: `*, *::before, *::after {
          animation: none !important;
          transition: none !important;
          caret-color: transparent !important;
        }`,
      });
      await page.waitForTimeout(300);

      await page.screenshot({
        path: resolve(OUTPUT_DIR, `${route.name}-${vp.label}.png`),
        fullPage: false,
        animations: "disabled",
      });

      // Redirects devem terminar na rota canônica.
      if (route.name.startsWith("redirect-")) {
        expect(new URL(page.url()).pathname).toBe("/catechism");
      } else {
        expect(true).toBe(true);
      }
    });
  }
}
