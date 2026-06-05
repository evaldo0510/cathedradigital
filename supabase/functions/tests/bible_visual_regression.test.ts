import { test, expect } from '@playwright/test';

test.describe('Bible Reader E2E: Keyboard, Navigation & Persistence', () => {
  const themes = ['paper', 'sepia', 'dark', 'night'];

  test('Keyboard navigation (J/K) and theme switching', async ({ page }) => {
    await page.goto('/bible?book=Jo&ch=1');
    await page.waitForSelector('.reader-text');

    // Press 'J' to go to verse 2
    await page.keyboard.press('j');
    await expect(page.locator('#v2')).toBeInViewport();
    await expect(page.locator('#v2')).toHaveClass(/bg-primary/);

    // Press 'K' to go back to verse 1
    await page.keyboard.press('k');
    await expect(page.locator('#v1')).toBeInViewport();

    // Alt + T to switch theme
    const initialTheme = await page.evaluate(() => document.documentElement.getAttribute('data-theme') || 'paper');
    await page.keyboard.press('Alt+t');
    const newTheme = await page.evaluate(() => document.documentElement.getAttribute('data-theme'));
    expect(newTheme).not.toBe(initialTheme);
  });

  test('Note persistence and synchronization', async ({ page }) => {
    await page.goto('/bible?book=Jo&ch=1');
    await page.waitForSelector('.reader-text');

    // Add a note via keyboard Alt+N on verse 1
    await page.locator('#v1').focus();
    await page.keyboard.press('Alt+n');
    await page.waitForSelector('textarea');
    await page.keyboard.type('Minha meditação de teste');
    await page.keyboard.press('Control+Enter');

    // Verify toast and appearance
    await expect(page.getByText('Nota salva')).toBeVisible();
    
    // Reload and check persistence
    await page.reload();
    await page.waitForSelector('.reader-text');
    await page.keyboard.press('Alt+m'); // Open marginalia
    await expect(page.getByText('Minha meditação de teste')).toBeVisible();
  });

  test('Accessibility: ARIA labels and screen reader support', async ({ page }) => {
    await page.goto('/bible?book=Jo&ch=1');
    await page.waitForSelector('.reader-text');

    const verse1 = page.locator('#v1');
    await expect(verse1).toHaveAttribute('role', 'article');
    await expect(verse1).toHaveAttribute('aria-label', 'Versículo 1');
    
    // Check marginalia labels
    await page.keyboard.press('Alt+m');
    const marginalia = page.locator('[role="complementary"]').first();
    if (await marginalia.isVisible()) {
      await expect(marginalia).toHaveAttribute('aria-label', /Sua nota/);
    }
  });
});
