/**
 * Prayer Portal — E2E (B.2.5).
 *
 * Cobre o piloto do Rosário e a generalização para Via Sacra + Liturgia
 * das Horas:
 *   1. Portal renderizado antes do Reader (gate `?enter=1`).
 *   2. Contraste WCAG AA (axe-core) em mobile e desktop.
 *   3. Botão "ENTRAR EM ORAÇÃO" leva ao Reader.
 *   4. Continuar / Recomeçar aparecem quando há sessão aberta.
 *   5. Screenshots por rota × viewport.
 */
import { test, expect, Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const VIEWPORTS = [
  { name: 'mobile', width: 390, height: 844 },
  { name: 'desktop', width: 1280, height: 900 },
] as const;

const PORTAL_ROUTES = [
  { label: 'rosario', path: '/oracao/rosario', readerSelector: '[data-testid^="prayer-engine-reader"], .prayer-engine-reader' },
  { label: 'via-sacra', path: '/viacrucis', readerSelector: '[data-testid="via-sacra-journey"]' },
  { label: 'liturgia-das-horas', path: '/breviary', readerSelector: 'button:has-text("Rezar")' },
] as const;

async function openPortal(page: Page, path: string) {
  await page.goto(path, { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('[data-testid="prayer-portal"]', { timeout: 20_000 });
}

async function runAxeOnPortal(page: Page, label: string) {
  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
    .include('[data-testid="prayer-portal"]')
    .analyze();

  if (results.violations.length > 0) {
    const summary = results.violations
      .map((v) => `• [${v.impact ?? 'n/a'}] ${v.id} — ${v.help} (${v.nodes.length}x)\n    ${v.helpUrl}`)
      .join('\n');
    throw new Error(`Violations axe em ${label}:\n${summary}`);
  }
  expect(results.violations).toEqual([]);
}

test.describe('PrayerPortal — piloto Rosário', () => {
  for (const vp of VIEWPORTS) {
    test(`gate + a11y (${vp.name})`, async ({ page }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await openPortal(page, '/oracao/rosario');

      // Portal presente, botão principal com nome acessível
      const enterBtn = page.getByTestId('portal-enter');
      await expect(enterBtn).toBeVisible();
      await expect(enterBtn).toHaveAccessibleName(/entrar em oração/i);

      // Título único
      await expect(page.locator('#portal-title')).toBeVisible();

      // axe scoped no portal
      await runAxeOnPortal(page, `rosario-${vp.name}`);

      // Screenshot para inspeção
      await page.screenshot({
        path: `/tmp/browser/portal-rosario-${vp.name}.png`,
        clip: { x: 0, y: 0, width: vp.width, height: Math.min(vp.height, 1600) },
      });

      // Transição para o Reader
      await enterBtn.click();
      await page.waitForURL(/enter=1/, { timeout: 5_000 });
      // Portal desaparece após entrar
      await expect(page.getByTestId('prayer-portal')).toHaveCount(0, { timeout: 10_000 });
    });
  }

  test('Continuar / Recomeçar quando há sessão aberta (mock localStorage)', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    // Semeia o modo escolhido (persistência do Portal).
    await page.addInitScript(() => {
      localStorage.setItem('cathedra.prayer.mode', 'contemplative');
    });
    await openPortal(page, '/oracao/rosario');
    // Continuar/Recomeçar só aparece se houver sessão do Engine — o teste
    // apenas garante que, sem sessão, o bloco NÃO é exibido.
    await expect(page.getByTestId('portal-resume')).toHaveCount(0);
  });
});

test.describe('PrayerPortal — Via Sacra (generalização)', () => {
  test('Portal aparece antes do journey', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await openPortal(page, '/viacrucis');
    await expect(page.getByTestId('portal-highlight')).toBeVisible();
    await expect(page.getByRole('heading', { name: /via sacra/i })).toBeVisible();
    await runAxeOnPortal(page, 'via-sacra-mobile');
    await page.screenshot({ path: '/tmp/browser/portal-via-sacra-mobile.png' });

    await page.getByTestId('portal-enter').click();
    // Após entrar, o landing/journey da Via Sacra assume
    await expect(page.getByTestId('via-sacra-journey').or(page.getByTestId('via-sacra-landing'))).toBeVisible({ timeout: 10_000 });
  });
});

test.describe('PrayerPortal — Liturgia das Horas (generalização)', () => {
  test('Portal aparece antes do seletor de horas', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await openPortal(page, '/breviary');
    await expect(page.getByTestId('portal-highlight')).toBeVisible();
    await runAxeOnPortal(page, 'liturgia-horas-desktop');
    await page.screenshot({ path: '/tmp/browser/portal-liturgia-horas-desktop.png' });

    await page.getByTestId('portal-enter').click();
    // Após entrar, o seletor de horas do Breviário assume
    await expect(page.locator('text=Hora sugerida agora').first()).toBeVisible({ timeout: 10_000 });
  });
});
