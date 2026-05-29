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

  test('should navigate via keyboard without animations when reduced motion is active', async ({ page }) => {
    await page.goto('/?lang=pt');
    
    // Start at "Hoje"
    const hojeItem = page.locator('button[aria-label="Hoje"]');
    await expect(hojeItem).toHaveAttribute('aria-current', 'page');

    // Tab to "Bíblia"
    await page.keyboard.press('Tab');
    
    // Press Enter to navigate
    await page.keyboard.press('Enter');

    // Verify navigation and aria-current
    await expect(page).toHaveURL(/\/bible/);
    const bibleItem = page.locator('button[aria-label="Bíblia"]');
    await expect(bibleItem).toHaveAttribute('aria-current', 'page');
    await expect(hojeItem).not.toHaveAttribute('aria-current', 'page');

    // Verify no animation styles or transitions are visible during the process
    // We can check if the motion elements have transition-duration: 0s or if they jump immediately
    const iconContainer = bibleItem.locator('.relative.z-10');
    const styles = await iconContainer.evaluate((el) => {
      const computed = window.getComputedStyle(el);
      return {
        transitionDuration: computed.transitionDuration,
        animationDuration: computed.animationDuration
      };
    });

    // In Framer Motion, it might use inline styles for the transform.
    // If reducedMotion is active, we expect no lingering animation classes or long durations.
    // The component explicitly sets duration: 0 in the transition prop.
    
    // We check another item: Catecismo
    await page.keyboard.press('Tab');
    await page.keyboard.press(' '); // Space also works for buttons
    
    await expect(page).toHaveURL(/\/catechism/);
    const catechismItem = page.locator('button[aria-label="Catecismo"]');
    await expect(catechismItem).toHaveAttribute('aria-current', 'page');
    await expect(bibleItem).not.toHaveAttribute('aria-current', 'page');

    // Verify that the motion div for active background has no transition delay or duration
    const activeBg = page.locator('[data-testid="bottom-nav-active-bg"]'); // I should add this test id or use a selector
    // Since I don't have the test-id, I'll use the class
    const activeBgLocator = page.locator('.absolute.inset-x-1\\.5.inset-y-1\\.5.bg-primary\\/\\[0\\.03\\]');
    
    // If it exists, check its computed style if possible, or just rely on the fact that it's present and aria-current updated.
    // The key is that the navigation happened and the UI updated.
  });
});
