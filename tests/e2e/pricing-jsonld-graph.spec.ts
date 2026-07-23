import { test, expect } from '@playwright/test';

/**
 * Varredura profunda de JSON-LD em /pricing: percorre todos os grafos
 * (@graph, arrays aninhados) e valida que qualquer campo url/@id/canonical
 * aponte para /pricing e nunca /planos.
 */
type Json = Record<string, unknown> | Json[] | string | number | boolean | null;

function walk(node: Json, offenders: string[], path = '$') {
  if (Array.isArray(node)) {
    node.forEach((n, i) => walk(n as Json, offenders, `${path}[${i}]`));
    return;
  }
  if (!node || typeof node !== 'object') return;

  for (const [key, value] of Object.entries(node)) {
    const p = `${path}.${key}`;
    if (typeof value === 'string') {
      if (value.includes('/planos')) {
        offenders.push(`${p} = ${value}`);
      }
      if (['url', '@id', 'canonical', 'mainEntityOfPage', 'sameAs'].includes(key) && value.startsWith('http')) {
        try {
          const u = new URL(value);
          if (u.pathname.startsWith('/planos')) {
            offenders.push(`${p} (URL) = ${value}`);
          }
        } catch {
          /* ignora URL inválida */
        }
      }
    } else if (value && typeof value === 'object') {
      walk(value as Json, offenders, p);
    }
  }
}

test.describe('JSON-LD /pricing — sem /planos em nenhum grafo', () => {
  test('todos os nós @graph mencionam apenas /pricing', async ({ page }) => {
    await page.goto('/pricing');
    await page.waitForLoadState('networkidle');

    const blocks = await page.locator('head script[type="application/ld+json"]').allTextContents();
    expect(blocks.length, 'nenhum JSON-LD em /pricing').toBeGreaterThan(0);

    const offenders: string[] = [];
    let foundPricingUrl = false;

    for (const raw of blocks) {
      let parsed: Json;
      try {
        parsed = JSON.parse(raw);
      } catch (err) {
        throw new Error(`JSON-LD inválido em /pricing: ${(err as Error).message}`);
      }
      walk(parsed, offenders);

      const flat = JSON.stringify(parsed);
      if (/"(url|@id|mainEntityOfPage)"\s*:\s*"[^"]*\/pricing[^"]*"/.test(flat)) {
        foundPricingUrl = true;
      }
    }

    expect(offenders, `JSON-LD referencia /planos:\n${offenders.join('\n')}`).toEqual([]);
    expect(foundPricingUrl, 'nenhum campo url/@id do JSON-LD aponta para /pricing').toBeTruthy();
  });
});
