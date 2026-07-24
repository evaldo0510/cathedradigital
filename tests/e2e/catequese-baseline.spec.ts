/**
 * Baseline de screenshots da Catequese — Sprint CQ-1.2
 *
 * Roda ANTES da movimentação física dos 15 arquivos. Gera imagens em
 * `tests/e2e/baseline/catequese/_review/` (fora do commit) para você
 * revisar antes de promover para `tests/e2e/baseline/catequese/`.
 *
 * Fluxo:
 *   1. bunx playwright test tests/e2e/catequese-baseline.spec.ts --update-snapshots
 *      → grava PNGs em _review/
 *   2. Você abre os PNGs, valida visualmente.
 *   3. Se OK: mv tests/e2e/baseline/catequese/_review/*.png tests/e2e/baseline/catequese/
 *      → então commita.
 *   4. Se algo estranho: apaga _review/, ajusta o app, roda de novo.
 *
 * Pré-requisito: preview server em http://127.0.0.1:8080 (bun run preview).
 * Rotas cobertas: /catechism, /catechism-legacy, /admin/catechism-queue.
 * Nota: /admin/catechism-queue requer sessão de admin; sem ela captura
 * apenas o gate de auth — ainda serve como baseline visual do gate.
 */

import { test, expect } from "@playwright/test";
import { mkdirSync } from "node:fs";
import { resolve } from "node:path";

const REVIEW_DIR = resolve("tests/e2e/baseline/catequese/_review");
mkdirSync(REVIEW_DIR, { recursive: true });

const ROUTES = [
  { path: "/catechism", name: "catechism" },
  { path: "/catechism-legacy", name: "catechism-legacy" },
  { path: "/admin/catechism-queue", name: "admin-catechism-queue" },
] as const;

for (const route of ROUTES) {
  test(`baseline · ${route.path}`, async ({ page }) => {
    await page.goto(route.path, { waitUntil: "networkidle" });
    // Aguarda tipografia carregar para evitar diff de FOUT.
    await page.evaluate(() => document.fonts.ready);
    // Desabilita animações para screenshot estável.
    await page.addStyleTag({
      content: `*, *::before, *::after { animation: none !important; transition: none !important; }`,
    });
    await page.waitForTimeout(300);

    // Viewport padrão do usuário.
    await page.setViewportSize({ width: 1280, height: 1800 });
    await page.screenshot({
      path: resolve(REVIEW_DIR, `${route.name}-desktop.png`),
      fullPage: false,
    });

    // Mobile.
    await page.setViewportSize({ width: 390, height: 844 });
    await page.waitForTimeout(200);
    await page.screenshot({
      path: resolve(REVIEW_DIR, `${route.name}-mobile.png`),
      fullPage: false,
    });

    expect(true).toBe(true);
  });
}
