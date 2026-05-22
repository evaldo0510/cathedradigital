import { test, expect } from '@playwright/test';

const VIEWPORTS = [
  { name: 'desktop', width: 1280, height: 720 },
  { name: 'tablet', width: 768, height: 1024 },
  { name: 'mobile', width: 375, height: 667 },
];

test.describe('Home Page Visual Regression', () => {
  for (const viewport of VIEWPORTS) {
    test(`Visual baseline for Home on ${viewport.name}`, async ({ page }) => {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await page.goto('/');
      
      // Wait for everything to settle
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000); // Wait for animations
      
      // Ensure the 8 blocks are visible before taking the screenshot
      // This acts as a sanity check
      await expect(page.locator('h1')).toBeVisible();
      await expect(page.locator('h2:has-text("Ritual do Dia")')).toBeVisible();
      await expect(page.locator('h2:has-text("Continuar Leitura")')).toBeVisible();
      await expect(page.locator('h2:has-text("Biblioteca")')).toBeVisible();
      await expect(page.locator('h2:has-text("Logos IA")')).toBeVisible();
      await expect(page.locator('h2:has-text("Em Breve")')).toBeVisible();

      // Mask dynamic content if any (like dates or changing text)
      // The "Ritual do Dia" might have changing text. We mask it to avoid false positives.
      // But for "visual regression" of the layout, we might want to see it.
      // Let's assume we want to catch layout shifts.
      
      await expect(page).toHaveScreenshot(`home-${viewport.name}.png`, {
        fullPage: true,
        maxDiffPixelRatio: 0.05, // Allow small differences for font rendering in CI
        animations: 'disabled',
      });
    });
  }
});
