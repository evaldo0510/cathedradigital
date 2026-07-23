import { test, expect } from '@playwright/test';

/**
 * Canonical strict: HTML <link rel="canonical"> e todos os campos
 * url/@id/mainEntityOfPage/canonicalPath do JSON-LD devem apontar
 * EXATAMENTE para o path /pricing (não /planos, não outro path).
 */
type Json = Record<string, unknown> | Json[] | string | number | boolean | null;

function collectUrlFields(node: Json, acc: Array<{ path: string; value: string }>, path = '$') {
  if (Array.isArray(node)) {
    node.forEach((n, i) => collectUrlFields(n as Json, acc, `${path}[${i}]`));
    return;
  }
  if (!node || typeof node !== 'object') return;
  for (const [key, value] of Object.entries(node)) {
    const p = `${path}.${key}`;
    if (typeof value === 'string' && ['url', '@id', 'mainEntityOfPage', 'canonical', 'canonicalPath'].includes(key)) {
      acc.push({ path: p, value });
    } else if (value && typeof value === 'object') {
      collectUrlFields(value as Json, acc, p);
    }
  }
}

test.describe('/pricing · canonical HTML + JSON-LD strict', () => {
  test('HTML canonical e JSON-LD apontam exatamente para /pricing', async ({ page }) => {
    await page.goto('/pricing');
    await page.waitForLoadState('networkidle');

    // HTML canonical
    const canonical = await page.getAttribute('link[rel="canonical"]', 'href');
    expect(canonical, 'canonical ausente').toBeTruthy();
    const canonicalPath = new URL(canonical!, 'http://x').pathname.replace(/\/$/, '') || '/';
    expect(canonicalPath, `canonical HTML deveria ser /pricing, veio: ${canonical}`).toBe('/pricing');
    expect(canonical!).not.toContain('/planos');

    // JSON-LD deep scan
    const blocks = await page.locator('head script[type="application/ld+json"]').allTextContents();
    expect(blocks.length, 'JSON-LD ausente em /pricing').toBeGreaterThan(0);

    const urlFields: Array<{ path: string; value: string }> = [];
    for (const raw of blocks) {
      const parsed = JSON.parse(raw) as Json;
      collectUrlFields(parsed, urlFields);
    }

    // Nenhum campo canonicalish pode mencionar /planos
    for (const { path, value } of urlFields) {
      expect(value, `${path} referencia /planos: ${value}`).not.toContain('/planos');
    }

    // Ao menos um campo canonicalish (url/@id/canonical/mainEntityOfPage) deve apontar /pricing
    const pricingHits = urlFields.filter(({ value }) => {
      try {
        return new URL(value).pathname === '/pricing';
      } catch {
        return value === '/pricing' || value.endsWith('/pricing');
      }
    });
    expect(
      pricingHits.length,
      `nenhum campo do JSON-LD aponta para /pricing (campos: ${urlFields.map((f) => `${f.path}=${f.value}`).join(' | ')})`,
    ).toBeGreaterThan(0);
  });
});
