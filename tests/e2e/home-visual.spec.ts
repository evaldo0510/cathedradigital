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
      
      // Inject CSS to fix rendering for deterministic screenshots
      await page.addInitScript(() => {
        const style = document.createElement('style');
        style.innerHTML = `
          *, *::before, *::after {
            animation: none !important;
            transition: none !important;
            animation-duration: 0s !important;
            animation-delay: 0s !important;
          }
          /* Mask dynamic content like Ritual do Dia or progress bars */
          [data-testid="ritual-content"], 
          [data-testid="reading-progress"],
          .ritual-date-text,
          .dynamic-date,
          [data-testid="user-name"] {
             visibility: hidden !important;
          }
          /* Freeze fonts - ensure they don't jump */
          html {
            font-display: block !important;
          }
          /* Hide scrollbars for cleaner diffs */
          ::-webkit-scrollbar {
            display: none;
          }
        `;
        document.head.appendChild(style);
      });

      await page.goto('/');
      
      // Wait for everything to settle
      await page.waitForLoadState('networkidle');
      
      // Wait for fonts specifically
      await page.evaluate(() => document.fonts.ready);
      
      // Ensure the 8 blocks are visible before taking the screenshot
      await expect(page.locator('h1')).toBeVisible();
      await expect(page.locator('h2:has-text("Ritual do Dia")')).toBeVisible();
      await expect(page.locator('h2:has-text("Continuar Leitura")')).toBeVisible();
      await expect(page.locator('h2:has-text("Biblioteca")')).toBeVisible();
      await expect(page.locator('h2:has-text("Logos IA")')).toBeVisible();
      await expect(page.locator('h2:has-text("Em Breve")')).toBeVisible();

      // Take screenshot with masking of dynamic containers
      await expect(page).toHaveScreenshot(`home-${viewport.name}.png`, {
        fullPage: true,
        maxDiffPixelRatio: 0.01, 
        animations: 'disabled',
        mask: [
          page.locator('[data-testid="ritual-content"]'),
          page.locator('[data-testid="reading-progress"]'),
          page.locator('.ritual-date-text'),
          page.locator('.dynamic-date')
        ]
      });
    });
  }

  test('Structural Consistency: Ensure no duplicate containers', async ({ page }) => {
    await page.goto('/');
    
    // Check for exact section count in MainContent
    const mainSections = page.locator('#main-content section');
    // Hero is outside main-content in Index.tsx, or inside? 
    // In Index.tsx: HeroSection is above <main id="main-content">
    // HomeMainContent has 5 sections: Ritual, Continuar, Biblioteca, Logos, Em Breve.
    await expect(mainSections).toHaveCount(5);

    // Verify unique IDs/Landmarks
    const landmarks = ['navigation', 'main', 'contentinfo', 'banner'];
    for (const landmark of landmarks) {
      const count = await page.locator(`[role="${landmark}"]`).count();
      // banner (header) might be 1, navigation might be multiple but should be distinct
      if (landmark === 'main') expect(count).toBe(1);
    }
  });
});
