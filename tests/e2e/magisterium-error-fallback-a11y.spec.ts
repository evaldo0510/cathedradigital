import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

/**
 * Magisterium · acessibilidade do fallback de erro
 *
 * Garante para o estado `magisterium-error-fallback`:
 * - Sem violações axe (wcag2a, wcag2aa, wcag21aa) — contraste incluso
 * - O botão "Tentar novamente" recebe foco inicial (autoFocus)
 * - Navegação por teclado (Tab) move o foco para o link externo
 *   e em seguida para o botão "Voltar", sem armadilhas de foco
 * - Enter no botão focado reinvoca a edge function
 */

const DOC_ID = 'ls';
const THIN = 'curto.';

test.describe('Magisterium · a11y do fallback', () => {
  test('axe + foco no retry + navegação por teclado', async ({ page }) => {
    let hits = 0;
    await page.route('**/functions/v1/vatican-document', async (route) => {
      hits += 1;
      await route.fulfill({
        status: 206,
        contentType: 'application/json',
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ title: 'thin', text: THIN, meta: { step: 'fetch_thin' } }),
      });
    });

    await page.goto(`/magisterium/${DOC_ID}`);
    const fallback = page.getByTestId('magisterium-error-fallback');
    await expect(fallback).toBeVisible({ timeout: 15_000 });

    // axe: WCAG 2.0/2.1 A + AA dentro do escopo do fallback
    const axe = await new AxeBuilder({ page })
      .include('[data-testid="magisterium-error-fallback"]')
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze();
    expect(axe.violations, JSON.stringify(axe.violations, null, 2)).toEqual([]);

    // Foco inicial: botão "Tentar novamente" (autoFocus)
    const retry = page.getByTestId('magisterium-retry');
    await expect(retry).toBeFocused();

    // Tab → link externo
    await page.keyboard.press('Tab');
    await expect(page.getByTestId('magisterium-external-fallback')).toBeFocused();

    // Tab → botão "Voltar" (escopado ao fallback)
    await page.keyboard.press('Tab');
    const voltar = fallback.getByRole('button', { name: /Voltar/i });
    await expect(voltar).toBeFocused();

    // Re-foca o retry e aciona com Enter — deve refazer fetch
    await retry.focus();
    const before = hits;
    await page.keyboard.press('Enter');
    await expect.poll(() => hits, { timeout: 8_000 }).toBeGreaterThan(before);
  });
});
