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

    // OpenGraph: título e URL devem refletir o destino canônico (/pricing),
    // não a origem /planos.
    const ogTitle = await page.locator('head meta[property="og:title"]').first().getAttribute('content');
    expect(ogTitle, 'og:title ausente em /pricing').toBeTruthy();
    expect(ogTitle!.length).toBeGreaterThan(0);

    const ogUrl = await page.locator('head meta[property="og:url"]').first().getAttribute('content');
    expect(ogUrl, 'og:url ausente em /pricing').toBeTruthy();
    expect(ogUrl!).toContain('/pricing');
    expect(ogUrl!).not.toContain('/planos');

    // Twitter Card
    const twTitle = await page.locator('head meta[name="twitter:title"]').first().getAttribute('content');
    expect(twTitle, 'twitter:title ausente em /pricing').toBeTruthy();
    expect(twTitle!.length).toBeGreaterThan(0);
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
