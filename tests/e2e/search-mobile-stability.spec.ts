import { test, expect } from '@playwright/test';

/**
 * E2E Regression Test: Search Mobile Stability
 * Focuses on layout stability (CLS), skeleton-to-content transitions,
 * and keyboard interaction UX.
 */
test.describe('Search Mobile Stability & Performance', () => {
  // Use iPhone 13 Pro viewport for mobile testing
  test.use({ viewport: { width: 390, height: 844 } });

  test('Layout stability during search typing and loading', async ({ page }) => {
    await page.goto('/buscar');
    await page.waitForLoadState('networkidle');

    const input = page.locator('input[placeholder*="dúvida espiritual"]');
    
    // 1. Initial State Screenshot
    await expect(page).toHaveScreenshot('search-initial-mobile.png');

    // 2. Typing triggers skeletons - check for visual jumps
    await input.type('Santo');
    
    // Wait for skeletons to appear
    await page.waitForSelector('.animate-pulse', { state: 'visible' });
    
    // Screenshot of skeleton state to ensure alignment with final content
    await expect(page.locator('#search-results-container')).toHaveScreenshot('search-skeleton-state.png', {
      maxDiffPixelRatio: 0.05
    });

    // 3. Results loading stability
    // Wait for real content (tabs and result cards)
    await page.waitForSelector('[role="tablist"]', { state: 'visible', timeout: 15000 });
    await page.waitForSelector('button[role="listitem"], .group.relative', { state: 'visible' });

    // Ensure results container didn't jump unexpectedly
    await expect(page.locator('#search-results-container')).toHaveScreenshot('search-results-final.png', {
      maxDiffPixelRatio: 0.02
    });

    // 4. Keyboard interaction: Focus and Scroll restoration
    // Simulate keyboard closing by resizing viewport back to full
    await page.setViewportSize({ width: 390, height: 400 }); // "Keyboard open"
    await page.waitForTimeout(300);
    
    const scrollBefore = await page.evaluate(() => window.scrollY);
    
    await page.setViewportSize({ width: 390, height: 844 }); // "Keyboard closed"
    await page.waitForTimeout(600); // Allow smooth scroll restoration
    
    const scrollAfter = await page.evaluate(() => window.scrollY);
    
    // If we were scrolled to results, we should be near that position after keyboard closes
    // depending on the restoration logic implemented in GlobalSearchPage.tsx
    expect(Math.abs(scrollBefore - scrollAfter)).toBeLessThan(100);
  });

  test('Accessibility: Touch target sizes for search elements', async ({ page }) => {
    await page.goto('/buscar');
    await page.locator('input[placeholder*="dúvida espiritual"]').fill('Santo');
    await page.waitForSelector('[role="tablist"]', { state: 'visible' });

    // Check Tabs height (Standardized to 48px on mobile in our update)
    const tabs = page.locator('[role="tab"]');
    const firstTabBox = await tabs.first().boundingBox();
    expect(firstTabBox?.height).toBeGreaterThanOrEqual(44);

    // Check Tags height (Standardized to 48px on mobile in our update)
    await page.click('[role="tab"]:has-text("Temas")');
    const tags = page.locator('button[role="listitem"]');
    const firstTagBox = await tags.first().boundingBox();
    expect(firstTagBox?.height).toBeGreaterThanOrEqual(44);
  });
});
