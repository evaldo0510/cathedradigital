import { test, expect } from '@playwright/test';

/**
 * Valida que /planos redireciona para /pricing (Navigate replace) e que
 * a página de destino carrega com canonical, title e robots corretos.
 */
test.describe('/planos → /pricing', () => {
  test('redireciona e expõe metatags do destino', async ({ page }) => {
    await page.goto('/planos');
    await page.waitForURL('**/pricing');
    await page.waitForLoadState('networkidle');

    expect(new URL(page.url()).pathname).toBe('/pricing');

    const canonical = await page.getAttribute('link[rel="canonical"]', 'href');
    expect(canonical).toContain('/pricing');
    expect(canonical).not.toContain('/planos');

    const robots = await page.getAttribute('meta[name="robots"]', 'content');
    expect(robots?.toLowerCase()).toContain('index');
    expect(robots?.toLowerCase()).not.toContain('noindex');

    const title = await page.title();
    expect(title.toLowerCase()).toMatch(/planos|pricing|cathedra/);
  });

  test('back button não volta para /planos (replace)', async ({ page }) => {
    await page.goto('/');
    await page.goto('/planos');
    await page.waitForURL('**/pricing');
    await page.goBack();
    await page.waitForLoadState('domcontentloaded');
    expect(new URL(page.url()).pathname).toBe('/');
  });
});
