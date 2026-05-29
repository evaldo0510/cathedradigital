import { test, expect } from '@playwright/test';

test.describe('Mobile Spacing Rhythm Consistency', () => {
  test.beforeEach(async ({ page }) => {
    // Set viewport to mobile
    await page.setViewportSize({ width: 375, height: 812 });
  });

  test('Index page uses rhythm tokens', async ({ page }) => {
    await page.goto('/');
    
    // Check for section-rhythm
    const sections = page.locator('.section-rhythm');
    const sectionCount = await sections.count();
    expect(sectionCount).toBeGreaterThan(0);

    // Verify padding on a section
    if (sectionCount > 0) {
      const padding = await sections.first().evaluate((el) => {
        const style = window.getComputedStyle(el);
        return style.paddingTop;
      });
      // --space-mobile-section is 2.5rem = 40px
      expect(padding).toBe('40px');
    }
  });

  test('Logos AI (integrated) uses correct mobile padding', async ({ page }) => {
    await page.goto('/logos');
    
    // Wait for the integrated LogosAI to be visible
    const logosCard = page.locator('.premium-card').first();
    await expect(logosCard).toBeVisible();

    const padding = await logosCard.evaluate((el) => {
      const style = window.getComputedStyle(el);
      return style.padding;
    });
    
    // Most premium cards in mobile should have 16px (1rem) or 24px (1.5rem)
    // index.css: --space-mobile-padding: 1rem;
    // index.css: .padding-rhythm { @apply p-[var(--space-mobile-padding)] ... }
    
    // Some components might have specific overrides, but we check for general rhythm
    const paddingValue = parseInt(padding);
    expect(paddingValue).toBeGreaterThanOrEqual(16);
  });

  test('Headings follow vertical rhythm line-heights', async ({ page }) => {
    await page.goto('/');
    
    const h1 = page.locator('h1').first();
    if (await h1.isVisible()) {
      const lineHeight = await h1.evaluate((el) => window.getComputedStyle(el).lineHeight);
      // clamp(2.25rem, 8vw, 6rem) * 1.1 line-height
      // At 375px, 2.25rem = 36px. 36 * 1.1 = 39.6px
      expect(parseFloat(lineHeight)).toBeCloseTo(39.6, 0);
    }

    const p = page.locator('p').first();
    if (await p.isVisible()) {
      const lineHeight = await p.evaluate((el) => window.getComputedStyle(el).lineHeight);
      // clamp(1rem, 1.2vw, 1.2rem) * 1.6
      // At 375px, 1rem = 16px. 16 * 1.6 = 25.6px
      expect(parseFloat(lineHeight)).toBeCloseTo(25.6, 0);
    }
  });
});
