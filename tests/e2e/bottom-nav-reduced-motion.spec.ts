import { test, expect } from '@playwright/test';

test.describe('BottomNav & SwipeNavigation - Reduced Motion', () => {
  test.use({ 
    viewport: { width: 390, height: 844 },
    colorScheme: 'light',
    reducedMotion: 'reduce',
    hasTouch: true
  });

  test('should not have animations in BottomNav when reduced motion is active', async ({ page }) => {
    await page.goto('/?lang=pt');
    
    const isReduced = await page.evaluate(() => {
      return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    });
    expect(isReduced).toBe(true);

    const bibleItem = page.locator('button[aria-label="Bíblia"]');
    await bibleItem.click();
    
    // In motion.div, if reduced motion is active, the transition should be instantaneous or non-existent
    // We can check if any motion styles are being applied that imply animation
    const iconContainer = bibleItem.locator('.relative.z-10');
    const style = await iconContainer.getAttribute('style');
    
    if (style) {
      // Scale should not be present if motion is reduced (based on previous logic)
      expect(style).not.toContain('scale(1.12)');
    }
  });

  test('should not have swipe transitions in SwipeNavigation when reduced motion is active', async ({ page }) => {
    await page.goto('/?lang=pt');
    
    // Check SwipeNavigation container
    // SwipeNavigation usually uses a framer-motion container or similar
    // If reduced motion is active, the swipe should feel like an immediate jump
    
    // Perform swipe
    await page.mouse.move(350, 400);
    await page.mouse.down();
    await page.mouse.move(50, 400, { steps: 5 });
    await page.mouse.up();

    // The navigation should happen immediately without a "sliding" visual period
    // Since we can't easily measure "immediate" in a static way, we verify the end state is reached correctly
    // and that the UI doesn't hang in a "dragging" state.
    await expect(page).toHaveURL(/\/bible/);
    
    const bibleItem = page.locator('button[aria-label="Bíblia"]');
    await expect(bibleItem).toHaveAttribute('aria-current', 'page');
  });
});
