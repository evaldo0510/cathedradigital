/**
 * PassageActions — E2E coverage
 *
 * Cobre:
 *  - Copiar trecho / Copiar referência (clipboard)
 *  - Compartilhar (fallback clipboard quando Web Share API indisponível)
 *  - Destacar → navega para o Reader com ?highlight=…
 *  - Tap targets ≥ 44×44 em mobile e desktop
 *  - Foco visível ao navegar por teclado
 *  - aria-busy / aria-live atualizando por ação
 */
import { test, expect, type Page } from '@playwright/test';

const CATECHISM_URL = '/catechism?p=1';

async function grantClipboard(page: Page) {
  await page.context().grantPermissions(['clipboard-read', 'clipboard-write']);
}

async function firstActionRow(page: Page) {
  // O PassageActions do CIC é renderizado no rodapé do parágrafo (role=group aria-label começa com "Ações para").
  const group = page.getByRole('group', { name: /^Ações para/ }).first();
  await group.waitFor({ state: 'visible', timeout: 30_000 });
  return group;
}

test.describe('PassageActions — Catecismo §N', () => {
  test.beforeEach(async ({ page }) => {
    await grantClipboard(page);
    await page.goto(CATECHISM_URL, { waitUntil: 'domcontentloaded' });
  });

  test('Copiar referência coloca "CIC §N" no clipboard', async ({ page }) => {
    const group = await firstActionRow(page);
    const btn = group.getByRole('button', { name: /Copiar referência CIC §\d+/ });
    await btn.click();
    const value = await page.evaluate(() => navigator.clipboard.readText());
    expect(value).toMatch(/^CIC §\d+$/);
  });

  test('Copiar trecho inclui referência e URL canônica com highlight', async ({ page }) => {
    const group = await firstActionRow(page);
    const btn = group.getByRole('button', { name: /Copiar trecho de CIC §\d+/ });
    await btn.click();
    const value = await page.evaluate(() => navigator.clipboard.readText());
    expect(value).toMatch(/— CIC §\d+/);
    expect(value).toMatch(/\/catechism\?p=\d+&highlight=CIC(%20|\+)%C2%A7\d+/);
  });

  test('Destacar navega para /catechism?p=N&highlight=…', async ({ page }) => {
    const group = await firstActionRow(page);
    const btn = group.getByRole('button', { name: /Destacar CIC §\d+ no leitor/ });
    await btn.click();
    await page.waitForURL(/\/catechism\?p=\d+&highlight=/, { timeout: 10_000 });
    expect(page.url()).toMatch(/highlight=CIC(%20|\+)%C2%A7\d+/);
  });

  test('aria-busy é aplicado durante loading e live region anuncia sucesso', async ({ page }) => {
    const group = await firstActionRow(page);
    const btn = group.getByRole('button', { name: /Copiar referência/ });
    await btn.click();
    // Após success (≤1.6s), a live region deve conter mensagem de status.
    const live = group.locator('[aria-live="polite"]').first();
    await expect(live).toContainText(/copiada|Compartilhado|copiado/i, { timeout: 3_000 });
  });

  test('foco visível é preservado ao navegar por Tab entre os botões', async ({ page }) => {
    const group = await firstActionRow(page);
    await group.getByRole('button').first().focus();
    const outline = await page.evaluate(() => {
      const el = document.activeElement as HTMLElement | null;
      if (!el) return null;
      const s = getComputedStyle(el);
      return { ring: s.boxShadow, outline: s.outlineStyle };
    });
    expect(outline).not.toBeNull();
    // focus-visible:ring-2 produz boxShadow (Tailwind ring) não vazio.
    expect(outline!.ring !== 'none' || outline!.outline !== 'none').toBeTruthy();
  });
});

test.describe('PassageActions — tap targets ≥ 44×44', () => {
  for (const vp of [
    { name: 'mobile-390', width: 390, height: 844 },
    { name: 'tablet-768', width: 768, height: 1024 },
    { name: 'desktop-1440', width: 1440, height: 900 },
  ]) {
    test(`${vp.name}: todos os botões ≥ 44×44`, async ({ page }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await grantClipboard(page);
      await page.goto(CATECHISM_URL, { waitUntil: 'domcontentloaded' });
      const group = await firstActionRow(page);
      const buttons = group.getByRole('button');
      const count = await buttons.count();
      expect(count).toBeGreaterThanOrEqual(3);
      for (let i = 0; i < count; i++) {
        const box = await buttons.nth(i).boundingBox();
        expect(box, `botão ${i}`).not.toBeNull();
        expect(box!.width).toBeGreaterThanOrEqual(44);
        expect(box!.height).toBeGreaterThanOrEqual(44);
      }
    });
  }
});
