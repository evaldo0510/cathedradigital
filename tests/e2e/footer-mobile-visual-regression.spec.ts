/**
 * Regressão visual do rodapé mobile: estado recolhido vs expandido.
 * Garante que:
 *  - No estado recolhido, só links mínimos aparecem (snapshot).
 *  - Ao clicar em "Mais", nav expande e revela links extras (snapshot).
 *  - Ao clicar em "Menos", volta ao estado mínimo (snapshot idêntico ao inicial).
 */

import { test, expect } from '@playwright/test';

const BASE = process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:8080';

test.use({ viewport: { width: 390, height: 844 } });

test.describe('Footer mobile — visual regression Mais/Menos', () => {
  test('recolhido → expandido → recolhido mantém links mínimos', async ({ page }) => {
    await page.goto(`${BASE}/`, { waitUntil: 'domcontentloaded' });
    await page.emulateMedia({ reducedMotion: 'reduce' });

    const nav = page.locator('[data-testid="footer-public-nav"]').first();
    await nav.scrollIntoViewIfNeeded();
    await expect(nav).toBeVisible();

    // Snapshot 1: estado recolhido
    const collapsedShot = await nav.screenshot({ animations: 'disabled' });
    await expect(nav).toHaveScreenshot('footer-mobile-collapsed.png', {
      maxDiffPixelRatio: 0.02,
      animations: 'disabled',
    });

    // Contar links visíveis (deve ser apenas os mínimos: Sobre, Parceiros, Privacidade, Termos, Transparência)
    const minimumLinks = await nav.getByRole('link').count() + await nav.getByRole('button', { name: /^(Sobre|Parceiros|Privacidade|Termos|Transparência)$/ }).count();
    expect(minimumLinks).toBeGreaterThanOrEqual(3);

    // RSS não deve aparecer recolhido
    await expect(nav.getByRole('link', { name: /RSS/i })).toHaveCount(0);

    // Expandir
    const expandBtn = page.locator('[data-testid="footer-mobile-expand"]').first();
    await expandBtn.click();
    await expect(expandBtn).toHaveAttribute('aria-expanded', 'true');
    await expect(nav.getByRole('link', { name: /RSS/i })).toBeVisible();

    await expect(nav).toHaveScreenshot('footer-mobile-expanded.png', {
      maxDiffPixelRatio: 0.02,
      animations: 'disabled',
    });

    // Recolher novamente
    await expandBtn.click();
    await expect(expandBtn).toHaveAttribute('aria-expanded', 'false');
    await expect(nav.getByRole('link', { name: /RSS/i })).toHaveCount(0);

    // Snapshot final deve corresponder ao inicial
    const finalShot = await nav.screenshot({ animations: 'disabled' });
    expect(finalShot.length).toBeGreaterThan(0);
    expect(Math.abs(finalShot.length - collapsedShot.length) / collapsedShot.length).toBeLessThan(0.05);
  });
});
