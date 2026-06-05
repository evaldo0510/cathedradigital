import { test, expect } from '@playwright/test';

test.describe('Bible Reader Visual Regressions & Accessibility', () => {
  const themes = ['paper', 'sepia', 'dark', 'night'];
  const viewports = [
    { width: 375, height: 812, name: 'mobile' },
    { width: 1024, height: 768, name: 'tablet' },
    { width: 1920, height: 1080, name: 'desktop' }
  ];
  const contrasts = ['normal', 'soft', 'high'];

  for (const viewport of viewports) {
    test.describe(`Viewport: ${viewport.name}`, () => {
      test.use({ viewport: { width: viewport.width, height: viewport.height } });

      for (const theme of themes) {
        test(`Theme: ${theme}`, async ({ page }) => {
          await page.goto('/bible?book=Jo&ch=1');
          await page.waitForSelector('.reader-text');
          
          // Inject settings into localStorage
          await page.evaluate(({ t }) => {
            localStorage.setItem('cathedra_reading_settings_desktop', JSON.stringify({
              theme: t,
              fontSize: 'medium',
              lineSpacing: 'normal',
              contrast: 'normal',
              showStudyMarginalia: true
            }));
            window.location.reload();
          }, { t: theme });

          await page.waitForSelector('.reader-text');
          await expect(page).toHaveScreenshot(`bible-${viewport.name}-${theme}.png`, {
            fullPage: false,
            mask: [page.locator('.logos-ai-widget')]
          });
        });
      }

      test(`Accessibility: High Contrast`, async ({ page }) => {
        await page.goto('/bible?book=Jo&ch=1');
        await page.evaluate(() => {
          localStorage.setItem('cathedra_reading_settings_desktop', JSON.stringify({
            theme: 'paper',
            contrast: 'high',
            showStudyMarginalia: true
          }));
          window.location.reload();
        });
        await page.waitForSelector('[data-contrast="high"]');
        await expect(page.locator('body')).toHaveCSS('background-color', 'rgb(255, 255, 255)');
        await expect(page.locator('.reader-text')).toHaveCSS('color', 'rgb(0, 0, 0)');
      });
    });
  }
});
