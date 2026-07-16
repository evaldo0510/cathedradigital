import { test, expect } from '@playwright/test';

/**
 * STAB-002A — Regressão da navegação semântica do Magistério.
 *
 * Cobre:
 *  - Cards renderizam <a href="/magisterium/..."> reais (não onClick puro).
 *  - Slug canônico curto (`dce`) resolve.
 *  - Slug legível novo (`deus-caritas-est`) resolve via alias.
 *  - Slug inexistente cai em 404 amigável, sem crash.
 *  - Ctrl/⌘+Click e clique do botão do meio abrem em nova aba, preservando a
 *    aba original (comportamento nativo de <a>, quebrado quando se usa
 *    apenas onClick + navigate()).
 */

const NOT_FOUND_RE = /Documento não encontrado|não configurada/i;

test.describe('Magistério · navegação semântica (STAB-002A)', () => {
  test('índice renderiza <a href="/magisterium/..."> reais', async ({ page }) => {
    await page.goto('/magisterium');
    await page.waitForLoadState('networkidle');
    const hrefs = await page.$$eval("a[href^='/magisterium/']", els =>
      els.map(e => e.getAttribute('href')),
    );
    expect(hrefs.length).toBeGreaterThan(5);
    // Todos os hrefs devem ter a forma /magisterium/<slug>
    expect(hrefs.every(h => /^\/magisterium\/[a-z0-9-]+$/i.test(h ?? ''))).toBe(true);
  });

  test('slug canônico curto (/magisterium/dce) NÃO mostra 404', async ({ page }) => {
    await page.goto('/magisterium/dce');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(1500);
    await expect(page.locator('body')).not.toContainText(NOT_FOUND_RE);
  });

  test('alias legível (/magisterium/deus-caritas-est) resolve como canônico', async ({ page }) => {
    await page.goto('/magisterium/deus-caritas-est');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(1500);
    await expect(page.locator('body')).not.toContainText(NOT_FOUND_RE);
  });

  test('slug inexistente exibe 404 amigável sem crash', async ({ page }) => {
    const pageErrors: string[] = [];
    page.on('pageerror', e => pageErrors.push(String(e)));
    await page.goto('/magisterium/slug-que-nao-existe-xyz');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(1500);
    await expect(page.locator('body')).toContainText(NOT_FOUND_RE);
    expect(pageErrors).toEqual([]);
  });

  test('Ctrl/⌘+Click no card abre em nova aba e mantém a atual', async ({ page, context, browserName }) => {
    await page.goto('/magisterium');
    await page.waitForLoadState('networkidle');
    const firstLink = page.locator("a[href^='/magisterium/']").first();
    const href = await firstLink.getAttribute('href');
    expect(href).toBeTruthy();

    const modifier = process.platform === 'darwin' && browserName === 'webkit' ? 'Meta' : 'Control';
    const [popup] = await Promise.all([
      context.waitForEvent('page'),
      firstLink.click({ modifiers: [modifier as 'Control' | 'Meta'] }),
    ]);
    await popup.waitForLoadState('domcontentloaded');
    expect(new URL(popup.url()).pathname).toBe(href);
    // Aba original continua no índice
    expect(new URL(page.url()).pathname).toBe('/magisterium');
    await popup.close();
  });

  test('clique com botão do meio abre em nova aba', async ({ page, context }) => {
    await page.goto('/magisterium');
    await page.waitForLoadState('networkidle');
    const firstLink = page.locator("a[href^='/magisterium/']").first();
    const href = await firstLink.getAttribute('href');
    const [popup] = await Promise.all([
      context.waitForEvent('page'),
      firstLink.click({ button: 'middle' }),
    ]);
    await popup.waitForLoadState('domcontentloaded');
    expect(new URL(popup.url()).pathname).toBe(href);
    await popup.close();
  });
});
