import { test, expect } from '@playwright/test';

/**
 * E2E Regression Test: Search Mobile Stability
 * Focuses on layout stability (CLS), skeleton-to-content transitions,
 * and keyboard interaction UX across multiple scenarios.
 */
test.describe('Search Mobile Stability & Performance', () => {
  // Use iPhone 13 Pro viewport for mobile testing
  test.use({ viewport: { width: 390, height: 844 } });

  test('Layout stability during search typing and loading', async ({ page }) => {
    await page.goto('/buscar');
    await page.waitForLoadState('networkidle');

    const input = page.locator('input[placeholder*="dúvida espiritual"]');
    
    // 1. Initial State
    await expect(page).toHaveScreenshot('search-initial-mobile.png');

    // 2. Typing triggers skeletons
    await input.type('Santo');
    await page.waitForSelector('.animate-pulse', { state: 'visible' });
    await expect(page.locator('#search-results-container')).toHaveScreenshot('search-skeleton-state.png', {
      maxDiffPixelRatio: 0.05
    });

    // 3. Results loading stability
    await page.waitForSelector('[role="tablist"]', { state: 'visible', timeout: 15000 });
    await expect(page.locator('#search-results-container')).toHaveScreenshot('search-results-final.png', {
      maxDiffPixelRatio: 0.02
    });

    // 4. Keyboard interaction: Focus and Scroll restoration
    // Simulate keyboard opening
    await page.setViewportSize({ width: 390, height: 400 }); 
    await page.waitForTimeout(300);
    const scrollBefore = await page.evaluate(() => window.scrollY);
    
    // Simulate keyboard closing
    await page.setViewportSize({ width: 390, height: 844 });
    await page.waitForTimeout(600); 
    const scrollAfter = await page.evaluate(() => window.scrollY);
    
    expect(Math.abs(scrollBefore - scrollAfter)).toBeLessThan(100);
  });

  test('Stability during rapid keyboard toggle in search', async ({ page }) => {
    await page.goto('/buscar');
    const input = page.locator('input[placeholder*="dúvida espiritual"]');
    await input.fill('Virgem Maria');
    
    // Rapidly toggle viewport to simulate keyboard open/close stress
    for (let i = 0; i < 3; i++) {
      await page.setViewportSize({ width: 390, height: 400 });
      await page.waitForTimeout(100);
      await page.setViewportSize({ width: 390, height: 844 });
      await page.waitForTimeout(100);
    }

    // Verify no catastrophic layout failure or unexpected jumps
    const isInputVisible = await input.isVisible();
    expect(isInputVisible).toBe(true);
    
    // Final check for CLS stability after stress
    await expect(page).toHaveScreenshot('search-after-keyboard-stress.png', {
      maxDiffPixelRatio: 0.05
    });
  });

  test('Accessibility: Touch target sizes for search elements', async ({ page }) => {
    await page.goto('/buscar');
    await page.locator('input[placeholder*="dúvida espiritual"]').fill('Santo');
    await page.waitForSelector('[role="tablist"]', { state: 'visible' });

    const tabs = page.locator('[role="tab"]');
    const firstTabBox = await tabs.first().boundingBox();
    expect(firstTabBox?.height).toBeGreaterThanOrEqual(44);

    await page.click('[role="tab"]:has-text("Temas")');
    const tags = page.locator('button[role="listitem"]');
    const firstTagBox = await tags.first().boundingBox();
    expect(firstTagBox?.height).toBeGreaterThanOrEqual(44);
  });
});

