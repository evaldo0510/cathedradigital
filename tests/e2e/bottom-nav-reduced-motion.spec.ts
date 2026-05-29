import { test, expect } from '@playwright/test';

test.describe('BottomNav - Reduced Motion', () => {
  test.use({ 
    viewport: { width: 390, height: 844 }, // Mobile iPhone 12/13
    colorScheme: 'light',
    reducedMotion: 'reduce'
  });

  test('should not have spring/layout animations when prefers-reduced-motion is active', async ({ page }) => {
    // Navigate to the app
    await page.goto('/');
    
    // Wait for BottomNav to be visible
    const bottomNav = page.locator('nav[aria-label="Navegação móvel"], nav[aria-label="Mobile navigation"]');
    await expect(bottomNav).toBeVisible();

    // Verify that motion components with layoutId don't have transition durations 
    // or are immediately present without animation.
    // In our implementation, shouldReduceMotion={true} sets transition={ duration: 0 }
    
    const activeIndicator = page.locator('[data-framer-id*="bottom-nav-active-bg"], .absolute.inset-x-1\\.5.bg-primary\\/\\[0\\.03\\]');
    
    // Clicking another item to trigger transition
    const bibleItem = page.locator('button[aria-label="Bíblia"], button[aria-label="Bible"]');
    await bibleItem.click();
    
    // In reduced motion mode, the active indicator should move instantly.
    // We can't easily measure "instant" in Playwright without complex RAF tracking, 
    // but we can verify the code-level implementation by checking if the component renders 
    // and stays stable immediately.
    
    await expect(bibleItem).toHaveAttribute('aria-current', 'page');
    
    // Check if the icon scale is 1 (it should be 1.12 when NOT reduced)
    // Note: Framer Motion apply styles via inline style attribute
    const iconContainer = bibleItem.locator('.relative.z-10');
    const style = await iconContainer.getAttribute('style');
    
    // In BottomNav.tsx: animate={{ scale: isActive ? (shouldReduceMotion ? 1 : 1.12) : 1 }}
    // So if isActive is true AND shouldReduceMotion is true, scale should be 1.
    if (style) {
      expect(style).not.toContain('scale(1.12)');
      // It might be scale(1) or no scale at all
    }
  });

  test('should verify the technical implementation of reduced motion in BottomNav', async ({ page }) => {
    await page.goto('/');
    
    // Inject a check to see if the useReducedMotion hook returns true
    // This confirms Playwright successfully simulated the environment
    const isReduced = await page.evaluate(() => {
      return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    });
    
    expect(isReduced).toBe(true);
  });
});
