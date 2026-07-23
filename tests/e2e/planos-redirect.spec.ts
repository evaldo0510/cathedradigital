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

    const twCard = await page.locator('head meta[name="twitter:card"]').first().getAttribute('content');
    expect(twCard, 'twitter:card ausente em /pricing').toBeTruthy();
    expect(['summary', 'summary_large_image']).toContain(twCard!);

    // og:image (aceita imagem absoluta https). Se ausente, hosting injeta;
    // mas se presente, precisa ser URL válida e não apontar para /planos.
    const ogImage = await page.locator('head meta[property="og:image"]').first().getAttribute('content');
    if (ogImage) {
      expect(ogImage).toMatch(/^https?:\/\//);
      expect(ogImage).not.toContain('/planos');
    }
    const twImage = await page.locator('head meta[name="twitter:image"]').first().getAttribute('content');
    if (twImage) {
      expect(twImage).toMatch(/^https?:\/\//);
      expect(twImage).not.toContain('/planos');
    }

    // JSON-LD: nenhum nó pode referenciar /planos; URLs devem apontar /pricing.
    const jsonLdBlocks = await page.locator('head script[type="application/ld+json"]').allTextContents();
    expect(jsonLdBlocks.length, 'JSON-LD ausente em /pricing').toBeGreaterThan(0);
    for (const raw of jsonLdBlocks) {
      expect(raw, 'JSON-LD não pode referenciar /planos').not.toContain('/planos');
      let parsed: unknown;
      expect(() => { parsed = JSON.parse(raw); }, 'JSON-LD inválido em /pricing').not.toThrow();
      const nodes = Array.isArray(parsed) ? parsed : [parsed];
      for (const node of nodes as Array<Record<string, any>>) {
        const type = node?.['@type'];
        if (type === 'WebPage' || type === 'WebSite' || type === 'Organization') {
          if (node.url) {
            expect(String(node.url)).not.toContain('/planos');
          }
        }
      }
    }
  });

  test('back/forward não entra em loop e preserva canonical', async ({ page }) => {
    await page.goto('/');
    await page.goto('/planos');
    await page.waitForURL('**/pricing');

    // Voltar deve ir para / (replace pulou /planos)
    await page.goBack();
    await page.waitForLoadState('domcontentloaded');
    expect(new URL(page.url()).pathname).toBe('/');

    // Avançar deve retornar a /pricing (não a /planos)
    await page.goForward();
    await page.waitForLoadState('domcontentloaded');
    expect(new URL(page.url()).pathname).toBe('/pricing');

    const canonical = await page.getAttribute('link[rel="canonical"]', 'href');
    expect(canonical).toContain('/pricing');
    expect(canonical).not.toContain('/planos');

    // Ciclo back/forward adicional não deve criar loop
    await page.goBack();
    await page.waitForLoadState('domcontentloaded');
    expect(new URL(page.url()).pathname).toBe('/');
    await page.goForward();
    await page.waitForLoadState('domcontentloaded');
    expect(new URL(page.url()).pathname).toBe('/pricing');
  });
});
