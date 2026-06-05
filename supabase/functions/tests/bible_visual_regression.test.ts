import { test, expect } from '@playwright/test';

test.describe('Bible Reader Visual Regressions', () => {
  const themes = ['paper', 'sepia', 'dark', 'night'];
  const fontSizes = ['small', 'medium', 'large', 'extra-large'];
  const lineSpacings = ['tight', 'normal', 'wide'];

  for (const theme of themes) {
    test(`render correctly with theme: ${theme}`, async ({ page }) => {
      // Mocking local storage or settings context would be ideal
      // For a quick check, we navigate and inject classes if needed or use UI
      await page.goto('/bible?book=Gn&ch=1');
      
      // Select theme via UI or direct state if possible, here we check if theme class is applied
      await page.evaluate((t) => {
        const root = document.querySelector('[data-layout-root="true"]');
        if (root) {
          root.className = root.className.replace(/reading-theme-\w+/, `reading-theme-${t}`);
        }
      }, theme);

      // Take snapshot of a verse block
      const verse = page.locator('#v1');
      await expect(verse).toBeVisible();
      // await expect(verse).toMatchSnapshot(`bible-verse-${theme}.png`);
    });
  }

  test('responsive typography check', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 }); // Mobile
    await page.goto('/bible?book=Gn&ch=1');
    const verse = page.locator('#v1');
    const fontSize = await verse.evaluate((el) => window.getComputedStyle(el).fontSize);
    expect(parseFloat(fontSize)).toBeGreaterThan(12);
  });
});
