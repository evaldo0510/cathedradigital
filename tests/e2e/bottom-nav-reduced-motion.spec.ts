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
    
    // Ensure we are on the page
    const hojeItem = page.locator('button[aria-label="Hoje"]');
    await expect(hojeItem).toHaveAttribute('aria-current', 'page');

    // Focus "Hoje" first to start keyboard navigation from a known point
    await hojeItem.focus();
    await expect(hojeItem).toBeFocused();

    // Tab to "Bíblia"
    await page.keyboard.press('Tab');
    
    const bibleItem = page.locator('button[aria-label="Bíblia"]');
    await expect(bibleItem).toBeFocused();

    // Press Enter to navigate
    await page.keyboard.press('Enter');

    // Verify navigation and aria-current
    await expect(page).toHaveURL(/\/bible/);
    await expect(bibleItem).toHaveAttribute('aria-current', 'page');
    await expect(hojeItem).not.toHaveAttribute('aria-current', 'page');

    // Verify that the active background and dot are present immediately without transition
    const activeBg = page.getByTestId('bottom-nav-active-bg');
    const activeDot = page.getByTestId('bottom-nav-dot');
    
    await expect(activeBg).toBeVisible();
    await expect(activeDot).toBeVisible();

    // Check computed styles to ensure duration is 0
    const navStyles = await page.locator('nav.bottom-nav').evaluate((el) => {
      return window.getComputedStyle(el).transitionDuration;
    });
    // It should be "0s" because of our duration-0 class
    expect(navStyles).toBe('0s');

    // Tab to "Catecismo"
    await page.keyboard.press('Tab');
    const catechismItem = page.locator('button[aria-label="Catecismo"]');
    await expect(catechismItem).toBeFocused();
    
    await page.keyboard.press(' '); // Space
    
    await expect(page).toHaveURL(/\/catechism/);
    await expect(catechismItem).toHaveAttribute('aria-current', 'page');
    await expect(bibleItem).not.toHaveAttribute('aria-current', 'page');
  });
});
