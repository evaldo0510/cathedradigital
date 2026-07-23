/**
 * A11y do botão "Mais/Menos" do rodapé mobile.
 * - Presença de aria-expanded, aria-controls
 * - Ativação via teclado (Enter e Espaço)
 * - Estado colapsado esconde Admin/RSS; expandido revela
 */

import { test, expect } from '@playwright/test';

const BASE = process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:8080';

test.use({ viewport: { width: 390, height: 800 } });

test.describe('Rodapé mobile — botão Mais/Menos (a11y + teclado)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`${BASE}/`, { waitUntil: 'domcontentloaded' });
    await page.locator('[data-testid="footer-public-nav"]').first().scrollIntoViewIfNeeded();
  });

  test('botão possui ARIA correto e nome acessível', async ({ page }) => {
    const btn = page.locator('[data-testid="footer-mobile-expand"]').first();
    await expect(btn).toBeVisible();
    await expect(btn).toHaveAttribute('aria-expanded', 'false');
    await expect(btn).toHaveAttribute('aria-controls', 'footer-public-nav');
    const name = (await btn.getAttribute('aria-label')) || (await btn.textContent()) || '';
    expect(name.trim().length).toBeGreaterThan(0);
  });

  test('Enter alterna expandido/colapsado', async ({ page }) => {
    const btn = page.locator('[data-testid="footer-mobile-expand"]').first();
    await btn.focus();
    await expect(btn).toBeFocused();

    await page.keyboard.press('Enter');
    await expect(btn).toHaveAttribute('aria-expanded', 'true');

    await page.keyboard.press('Enter');
    await expect(btn).toHaveAttribute('aria-expanded', 'false');
  });

  test('Space também alterna', async ({ page }) => {
    const btn = page.locator('[data-testid="footer-mobile-expand"]').first();
    await btn.focus();
    await page.keyboard.press('Space');
    await expect(btn).toHaveAttribute('aria-expanded', 'true');
  });

  test('estado colapsado esconde RSS; expandido revela', async ({ page }) => {
    const nav = page.locator('[data-testid="footer-public-nav"]').first();
    const rss = nav.getByRole('link', { name: /RSS/i });

    await expect(rss).toHaveCount(0);

    await page.locator('[data-testid="footer-mobile-expand"]').first().click();
    await expect(rss).toHaveCount(1);
    await expect(rss).toBeVisible();
  });
});
