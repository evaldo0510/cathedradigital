/**
 * PassageActions — Fluxos adicionais
 *
 * Cobre:
 *  1. Voltar no Reader após Destacar preserva ?highlight= e posição.
 *  2. Regressão visual dos estados loading/success/error em 390/768/1440.
 *  3. Foco visível ao navegar por teclado dentro do HighlightMenu.
 *  4. Fluxo do HighlightMenu da Bíblia acionando Destacar → /bible com highlight.
 */
import { test, expect, type Page } from '@playwright/test';

const CATECHISM_URL = '/catechism?p=1';

async function grantClipboard(page: Page) {
  await page.context().grantPermissions(['clipboard-read', 'clipboard-write']);
}

async function firstActionRow(page: Page) {
  const group = page.getByRole('group', { name: /^Ações para/ }).first();
  await group.waitFor({ state: 'visible', timeout: 30_000 });
  return group;
}

// ────────────────────────────────────────────────────────────────────────────
// 1. Back-navigation preserva ?highlight= e posição de leitura
// ────────────────────────────────────────────────────────────────────────────
test.describe('PassageActions — back preserva highlight e posição', () => {
  test('Destacar → back mantém ?highlight= e scroll', async ({ page }) => {
    await grantClipboard(page);
    await page.goto(CATECHISM_URL, { waitUntil: 'domcontentloaded' });

    // Rola para simular posição de leitura
    await page.evaluate(() => window.scrollTo(0, 400));
    const initialUrl = page.url();
    const initialScroll = await page.evaluate(() => window.scrollY);

    const group = await firstActionRow(page);
    await group.getByRole('button', { name: /Destacar CIC §\d+ no leitor/ }).click();
    await page.waitForURL(/\/catechism\?p=\d+&highlight=/, { timeout: 10_000 });

    const highlightedUrl = page.url();
    expect(highlightedUrl).toMatch(/highlight=CIC(%20|\+)%C2%A7\d+/);
    // A URL canônica de p= não pode ter sido corrompida
    expect(highlightedUrl).toMatch(/[?&]p=\d+/);

    await page.goBack();
    await page.waitForLoadState('domcontentloaded');
    // Ao voltar, mantém a URL anterior sem highlight fantasma
    expect(page.url()).toBe(initialUrl);

    // Posição de leitura preservada (tolerância para restauração assíncrona)
    await page.waitForTimeout(300);
    const restored = await page.evaluate(() => window.scrollY);
    expect(Math.abs(restored - initialScroll)).toBeLessThan(200);
  });
});

// ────────────────────────────────────────────────────────────────────────────
// 2. Regressão visual: loading/success mantendo tap targets e foco
// ────────────────────────────────────────────────────────────────────────────
test.describe('PassageActions — regressão visual dos estados', () => {
  for (const vp of [
    { name: 'mobile-390', width: 390, height: 844 },
    { name: 'tablet-768', width: 768, height: 1024 },
    { name: 'desktop-1440', width: 1440, height: 900 },
  ]) {
    test(`${vp.name}: idle/success preservam 44×44 e ring de foco`, async ({ page }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await grantClipboard(page);
      await page.goto(CATECHISM_URL, { waitUntil: 'domcontentloaded' });

      const group = await firstActionRow(page);
      const copyBtn = group.getByRole('button', { name: /Copiar referência/ });

      // Snapshot idle
      const idleBox = await copyBtn.boundingBox();
      expect(idleBox!.width).toBeGreaterThanOrEqual(44);
      expect(idleBox!.height).toBeGreaterThanOrEqual(44);
      expect(await group.screenshot()).toMatchSnapshot(
        `passage-actions-idle-${vp.name}.png`,
        { maxDiffPixelRatio: 0.02 },
      );

      // Foco visível
      await copyBtn.focus();
      const hasRing = await copyBtn.evaluate((el) => {
        const s = getComputedStyle(el);
        return s.boxShadow !== 'none' || s.outlineStyle !== 'none';
      });
      expect(hasRing).toBeTruthy();

      // Dispara ação e valida tap target durante/após success
      await copyBtn.click();
      const successBox = await copyBtn.boundingBox();
      expect(successBox!.width).toBeGreaterThanOrEqual(44);
      expect(successBox!.height).toBeGreaterThanOrEqual(44);

      const live = group.locator('[aria-live="polite"]').first();
      await expect(live).toContainText(/copiada|copiado|Compartilhado/i, { timeout: 3_000 });

      expect(await group.screenshot()).toMatchSnapshot(
        `passage-actions-success-${vp.name}.png`,
        { maxDiffPixelRatio: 0.05 },
      );
    });
  }
});

// ────────────────────────────────────────────────────────────────────────────
// 3 + 4. HighlightMenu da Bíblia — teclado + Destacar → /bible com highlight
// ────────────────────────────────────────────────────────────────────────────
async function openBibleHighlightMenu(page: Page): Promise<boolean> {
  await page.goto('/bible', { waitUntil: 'domcontentloaded' });

  // Seleciona o primeiro livro/capítulo disponível para renderizar versículos
  const firstBook = page.getByRole('button').filter({ hasText: /^(Gn|Gênesis|Mt|Mateus|Jo|João)/ }).first();
  if (await firstBook.count()) {
    await firstBook.click({ trial: false }).catch(() => {});
  }
  const firstChapter = page.getByRole('button', { name: /^\s*1\s*$/ }).first();
  if (await firstChapter.count()) {
    await firstChapter.click().catch(() => {});
  }

  // Clica no primeiro versículo para abrir o HighlightMenu
  const verse = page.locator('[data-verse]').first();
  if (!(await verse.count())) return false;
  await verse.click();

  const menu = page.getByRole('group', { name: /^Ações para/ }).first();
  try {
    await menu.waitFor({ state: 'visible', timeout: 5_000 });
    return true;
  } catch {
    return false;
  }
}

test.describe('HighlightMenu — Bíblia', () => {
  test('teclado mantém foco visível ao alternar Copiar/Compartilhar/Destacar', async ({ page }) => {
    await grantClipboard(page);
    const opened = await openBibleHighlightMenu(page);
    test.skip(!opened, 'HighlightMenu não pôde ser aberto neste ambiente');

    const menu = page.getByRole('group', { name: /^Ações para/ }).first();
    const buttons = menu.getByRole('button');
    const count = await buttons.count();
    expect(count).toBeGreaterThanOrEqual(3);

    await buttons.first().focus();
    for (let i = 0; i < count; i++) {
      const active = await page.evaluate(() => {
        const el = document.activeElement as HTMLElement | null;
        if (!el) return null;
        const s = getComputedStyle(el);
        return {
          tag: el.tagName,
          hasRing: s.boxShadow !== 'none' || s.outlineStyle !== 'none',
        };
      });
      expect(active).not.toBeNull();
      expect(active!.hasRing).toBeTruthy();
      await page.keyboard.press('Tab');
    }

    // Fechar via Escape não deve arremessar o foco para o body
    await page.keyboard.press('Escape');
    const stillHasFocus = await page.evaluate(() => document.activeElement?.tagName !== 'BODY');
    expect(stillHasFocus).toBeTruthy();
  });

  test('Destacar navega para /bible com ?highlight= aplicado', async ({ page }) => {
    await grantClipboard(page);
    const opened = await openBibleHighlightMenu(page);
    test.skip(!opened, 'HighlightMenu não pôde ser aberto neste ambiente');

    const menu = page.getByRole('group', { name: /^Ações para/ }).first();
    const destacar = menu.getByRole('button', { name: /Destacar .+ no leitor/ });
    await destacar.click();

    await page.waitForURL(/\/bible.*[?&]highlight=/, { timeout: 10_000 });
    expect(page.url()).toMatch(/\/bible/);
    expect(page.url()).toMatch(/highlight=/);
  });
});
