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
 * Rotas cobertas:
 *   - Canônicas (com e sem query params, ex.: ?p=2, ?ref=)
 *   - Redirects legados que devem replace para /catechism (com e sem query
 *     preservada), garantindo pixel-parity com a rota canônica destino.
 *
 * Dois breakpoints: desktop 1280x1800 e mobile 390x844.
 *
 * Estratégia de estabilidade dos screenshots:
 *   1. goto com waitUntil "load" (evita long-poll do networkidle)
 *   2. wait explícito por um seletor âncora por rota (readerReady / main)
 *   3. document.fonts.ready + rechecagem síncrona
 *   4. neutraliza animações, transitions, cursores e SVGs animados
 *   5. force `text-rendering: geometricPrecision` para reduzir diff sub-pixel
 *      de antialiasing entre execuções da flag
 *
 * Pré-requisito: preview server servindo o build correto em
 * PLAYWRIGHT_TEST_BASE_URL (default http://127.0.0.1:8080).
 */

import { test, expect, type Page } from "@playwright/test";
import { mkdirSync } from "node:fs";
import { resolve } from "node:path";

const OUTPUT_DIR = resolve(
  process.env.CATEQUESE_SCREENSHOT_DIR ??
    "tests/e2e/baseline/catequese/_review",
);
mkdirSync(OUTPUT_DIR, { recursive: true });

type Route = {
  path: string;
  name: string;
  /** Seletor âncora que confirma a tela renderizou (não apenas o shell). */
  ready?: string;
  /** Para redirects: pathname final esperado após replace. */
  expectFinalPath?: string;
  /** Para redirects: search final esperado (inclui '?'). Vazio = qualquer. */
  expectFinalSearch?: string;
  note?: string;
};

const READER_READY = 'main, [data-testid="reader-shell"], [role="main"]';

const ROUTES: Route[] = [
  // ---- Canônicas base
  { path: "/catechism", name: "catechism", ready: READER_READY },
  {
    path: "/catechism-legacy",
    name: "catechism-legacy",
    ready: READER_READY,
  },
  {
    path: "/admin/catechism-queue",
    name: "admin-catechism-queue",
    ready: "main, [role='main'], [data-testid='auth-gate']",
    note: "sem sessão admin, captura o gate — ainda válido como baseline",
  },

  // ---- Query params (parâmetros preservados pelo router)
  {
    path: "/catechism?p=2",
    name: "catechism-qp-p2",
    ready: READER_READY,
    note: "deep-link para parágrafo 2",
  },
  {
    path: "/catechism?p=10&ref=nexus",
    name: "catechism-qp-p10-ref",
    ready: READER_READY,
    note: "query composta, valida coexistência com nexus",
  },

  // ---- Redirects legados (sem query) — devem terminar em /catechism
  {
    path: "/catecismo",
    name: "redirect-catecismo",
    ready: READER_READY,
    expectFinalPath: "/catechism",
  },
  {
    path: "/catechism-explorer",
    name: "redirect-catechism-explorer",
    ready: READER_READY,
    expectFinalPath: "/catechism",
  },

  // ---- Redirects legados com query — a query deve ser preservada
  {
    path: "/catecismo?p=2",
    name: "redirect-catecismo-qp-p2",
    ready: READER_READY,
    expectFinalPath: "/catechism",
    expectFinalSearch: "?p=2",
  },
  {
    path: "/catechism-explorer?p=10&ref=nexus",
    name: "redirect-explorer-qp-composed",
    ready: READER_READY,
    expectFinalPath: "/catechism",
    expectFinalSearch: "?p=10&ref=nexus",
  },
];

const VIEWPORTS = [
  { label: "desktop", width: 1280, height: 1800 },
  { label: "mobile", width: 390, height: 844 },
] as const;

/** Aguarda fontes e estabiliza antialiasing/animation antes do screenshot. */
async function stabilizePage(page: Page, readySelector?: string) {
  // 1. Espera âncora da rota (rápida) — timeout curto para não travar CI.
  if (readySelector) {
    await page
      .waitForSelector(readySelector, { state: "attached", timeout: 15_000 })
      .catch(() => {
        /* algumas rotas (gate admin) podem não expor a âncora — segue */
      });
  }

  // 2. Espera network idle com timeout curto (evita long polls).
  await page.waitForLoadState("networkidle", { timeout: 10_000 }).catch(() => {});

  // 3. Fontes prontas (dupla checagem para navegadores que resolvem cedo).
  await page.evaluate(async () => {
    await document.fonts.ready;
    // força layout final após fonts
    document.body.getBoundingClientRect();
    await document.fonts.ready;
  });

  // 4. Neutraliza animações, transitions, carets, SVG smil e ajusta AA.
  await page.addStyleTag({
    content: `
      *, *::before, *::after {
        animation-duration: 0s !important;
        animation-delay: 0s !important;
        animation-iteration-count: 1 !important;
        transition-duration: 0s !important;
        transition-delay: 0s !important;
        caret-color: transparent !important;
        scroll-behavior: auto !important;
      }
      html {
        -webkit-font-smoothing: antialiased;
        -moz-osx-font-smoothing: grayscale;
        text-rendering: geometricPrecision;
      }
      /* Congela SVG SMIL e videos autoplay */
      svg animate, svg animateTransform, svg animateMotion { display: none !important; }
      video { visibility: hidden !important; }
      /* Suprime cursores piscando em inputs focados */
      input, textarea, [contenteditable] { caret-color: transparent !important; }
    `,
  });

  // 5. Pequena margem para reflow pós-injeção de estilo.
  await page.waitForTimeout(150);
}

for (const route of ROUTES) {
  for (const vp of VIEWPORTS) {
    test(`catequese · ${route.path} · ${vp.label}`, async ({ page }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.emulateMedia({ reducedMotion: "reduce" });

      await page.goto(route.path, { waitUntil: "load" });
      await stabilizePage(page, route.ready);

      await page.screenshot({
        path: resolve(OUTPUT_DIR, `${route.name}-${vp.label}.png`),
        fullPage: false,
        animations: "disabled",
        caret: "hide",
        scale: "css",
      });

      // Validação de redirect (path e, quando aplicável, search).
      if (route.expectFinalPath) {
        const url = new URL(page.url());
        expect(url.pathname).toBe(route.expectFinalPath);
        if (route.expectFinalSearch !== undefined) {
          expect(url.search).toBe(route.expectFinalSearch);
        }
      }
    });
  }
}
