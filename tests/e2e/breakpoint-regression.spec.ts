import { test, expect, type Page } from '@playwright/test';

/**
 * Cross-breakpoint visual & layout regression suite.
 *
 * Garante que não existam conflitos entre mobile, tablet e desktop nos
 * módulos centrais do Cathedra Digital:
 *  - Sem overflow horizontal (scroll lateral indesejado)
 *  - Sem duplicação de navegação (bottom nav mobile vs. nav desktop)
 *  - Snapshot visual estável por breakpoint
 *  - Hierarquia de cabeçalho preservada (um único H1 visível)
 */

type Breakpoint = { name: 'mobile' | 'tablet' | 'desktop'; width: number; height: number };

const BREAKPOINTS: Breakpoint[] = [
  { name: 'mobile', width: 390, height: 844 },
  { name: 'tablet', width: 820, height: 1180 },
  { name: 'desktop', width: 1440, height: 900 },
];

const MODULES = [
  { path: '/', label: 'home' },
  { path: '/bible', label: 'bible' },
  { path: '/catechism', label: 'catechism' },
  { path: '/logos', label: 'logos' },
  { path: '/biblioteca', label: 'biblioteca' },
  { path: '/study', label: 'study' },
  { path: '/hoje', label: 'hoje' },
  { path: '/itineraria', label: 'itineraria' },
  { path: '/santos', label: 'santos' },
];

async function waitForReady(page: Page) {
  await page.waitForLoadState('domcontentloaded');
  // Aguarda esqueletos cinematográficos desaparecerem (até 8s)
  await page
    .waitForFunction(
      () => !document.querySelector('[data-skeleton="true"], [aria-busy="true"]'),
      undefined,
      { timeout: 8000 }
    )
    .catch(() => {});
  // Pequena espera para fontes/imagens estabilizarem
  await page.waitForTimeout(400);
}

test.describe('Breakpoint regression — fluidez entre mobile, tablet e desktop', () => {
  for (const bp of BREAKPOINTS) {
    test.describe(`viewport ${bp.name} (${bp.width}x${bp.height})`, () => {
      test.use({ viewport: { width: bp.width, height: bp.height } });

      for (const mod of MODULES) {
        test(`${mod.label} — sem overflow, nav coerente e snapshot estável`, async ({ page }) => {
          await page.goto(mod.path, { waitUntil: 'commit' });
          await waitForReady(page);

          // 1. Sem overflow horizontal
          const overflow = await page.evaluate(() => ({
            scrollWidth: document.documentElement.scrollWidth,
            clientWidth: document.documentElement.clientWidth,
          }));
          expect(
            overflow.scrollWidth,
            `Overflow horizontal em ${mod.label} @ ${bp.name}: scroll=${overflow.scrollWidth} client=${overflow.clientWidth}`
          ).toBeLessThanOrEqual(overflow.clientWidth + 1);

          // 2. Navegação coerente: bottom-nav só em mobile, desktop-nav só em desktop
          const bottomNav = page.locator('[data-testid="bottom-nav"], nav[aria-label*="inferior" i]').first();
          const desktopNav = page.locator('[data-testid="desktop-nav"], nav[aria-label*="principal" i]').first();

          const bottomVisible = (await bottomNav.count()) ? await bottomNav.isVisible() : false;
          const desktopVisible = (await desktopNav.count()) ? await desktopNav.isVisible() : false;

          if (bp.name === 'mobile') {
            expect(
              desktopVisible,
              `Nav desktop não deveria aparecer em mobile (${mod.label})`
            ).toBeFalsy();
          }
          if (bp.name === 'desktop') {
            expect(
              bottomVisible,
              `Bottom nav mobile não deveria aparecer em desktop (${mod.label})`
            ).toBeFalsy();
          }
          // Nunca os dois ao mesmo tempo
          expect(
            bottomVisible && desktopVisible,
            `Duplicação de navegação em ${mod.label} @ ${bp.name}`
          ).toBeFalsy();

          // 3. Apenas um H1 visível
          const h1Count = await page.locator('h1:visible').count();
          expect(h1Count, `Esperado no máximo 1 H1 em ${mod.label} @ ${bp.name}`).toBeLessThanOrEqual(1);

          // 4. Snapshot visual (tolerância já configurada globalmente)
          await expect(page).toHaveScreenshot(`${mod.label}-${bp.name}.png`, {
            fullPage: false,
            animations: 'disabled',
            maxDiffPixelRatio: 0.03,
          });
        });
      }
    });
  }
});
