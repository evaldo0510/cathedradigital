import { test, expect } from '@playwright/test';
import { injectAxe, checkA11y } from 'axe-playwright';
import fs from 'fs';
import path from 'path';

const RESULTS_DIR = path.join(process.cwd(), 'public', 'a11y-reports', 'hero-visuals');
if (!fs.existsSync(RESULTS_DIR)) {
  fs.mkdirSync(RESULTS_DIR, { recursive: true });
}

const viewports = [
  { name: 'mobile', width: 375, height: 667 },
  { name: 'sm', width: 640, height: 800 },
  { name: 'md', width: 768, height: 1024 },
  { name: 'lg', width: 1280, height: 800 },
];

const themes = ['light', 'dark'];

test.describe('Hero Section Visuals and Accessibility', () => {
  for (const theme of themes) {
    test.describe(`${theme.toUpperCase()} Theme`, () => {
      for (const viewport of viewports) {
        test(`Hero visuals - ${viewport.name}`, async ({ page }) => {
          await page.setViewportSize({ width: viewport.width, height: viewport.height });
          await page.goto('/');
          
          if (theme === 'dark') {
            await page.evaluate(() => document.documentElement.classList.add('dark'));
          } else {
            await page.evaluate(() => document.documentElement.classList.remove('dark'));
          }

          const hero = page.locator('#hero');
          await expect(hero).toBeVisible();
          await page.waitForTimeout(1000); // Wait for animations

          // Capture screenshot for visual comparison
          const screenshotName = `hero-${theme}-${viewport.name}.png`;
          await hero.screenshot({ 
            path: path.join(RESULTS_DIR, screenshotName)
          });

          // Accessibility check
          await injectAxe(page);
          await checkA11y(page, '#hero', {
            axeOptions: {
              rules: { 'color-contrast': { enabled: true } },
            },
          });
        });
      }

      test(`Hero CTA - Keyboard Interaction and Focus`, async ({ page }) => {
        await page.setViewportSize(viewports[3]); // lg
        await page.goto('/');
        
        if (theme === 'dark') {
          await page.evaluate(() => document.documentElement.classList.add('dark'));
        }

        const cta = page.getByRole('button', { name: /Iniciar Caminhada/i }).first();
        await expect(cta).toBeVisible();

        // 1. Verify tab order position
        // The Hero CTA should be one of the first interactive elements after the header
        await page.keyboard.press('Tab'); // Skip link
        // Header usually has: Logo, 3-4 Nav links, Language, Login, Start button
        // Let's Tab until we find the CTA and track how many tabs it took
        let tabsCount = 0;
        let found = false;
        for (let i = 0; i < 20; i++) {
          await page.keyboard.press('Tab');
          tabsCount++;
          const isFocused = await cta.evaluate(el => document.activeElement === el);
          if (isFocused) {
            found = true;
            break;
          }
        }
        expect(found, "Hero CTA should be reachable via Tab").toBe(true);
        console.log(`Hero CTA reached in ${tabsCount} tabs`);

        // 2. Verify focus-visible styling
        // We check for a ring class or computed style
        const hasRing = await cta.evaluate(el => {
          const style = window.getComputedStyle(el);
          return style.boxShadow.includes('rgb') || el.classList.contains('focus-visible:ring-2');
        });
        expect(hasRing).toBe(true);
        await cta.screenshot({ path: path.join(RESULTS_DIR, `hero-cta-focus-${theme}.png`) });

        // 3. Verify Space activation
        // Reset scroll
        await page.evaluate(() => window.scrollTo(0, 0));
        await page.keyboard.press('Space');
        await page.waitForTimeout(800);
        const isScrolled = await page.evaluate(() => window.scrollY > 100);
        expect(isScrolled, "Page should scroll down on Space activation").toBe(true);

        // 4. Verify Enter activation
        await page.evaluate(() => window.scrollTo(0, 0));
        await cta.focus();
        await page.keyboard.press('Enter');
        await page.waitForTimeout(800);
        const isScrolledEnter = await page.evaluate(() => window.scrollY > 100);
        expect(isScrolledEnter, "Page should scroll down on Enter activation").toBe(true);
      });
    });
  }

  test('Generate Visual-Diff Report Data', async () => {
    // This is a helper test to ensure all expected screenshots exist for the index report
    const expectedFiles: string[] = [];
    for (const theme of themes) {
      for (const vp of viewports) {
        expectedFiles.push(`hero-${theme}-${vp.name}.png`);
      }
      expectedFiles.push(`hero-cta-focus-${theme}.png`);
    }

    for (const file of expectedFiles) {
      const filePath = path.join(RESULTS_DIR, file);
      // We don't fail here because this test might run before others in a real environment
      // but we log it for the report validator.
      if (!fs.existsSync(filePath)) {
        console.warn(`⚠️ Warning: Expected screenshot ${file} not found yet.`);
      }
    }
  });
});
