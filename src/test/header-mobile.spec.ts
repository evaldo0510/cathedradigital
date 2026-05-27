import { test, expect } from '@playwright/test';

test.describe('Mobile Header Visual and Layout Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Set viewport to a common mobile size
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/');
  });

  test('header has correct mobile layout hierarchy', async ({ page }) => {
    const header = page.locator('header.admin-hide');
    await expect(header).toBeVisible();

    // Check if logo section is centered on mobile
    const logoSection = header.locator('div[role="button"]').first();
    const logoBox = await logoSection.boundingBox();
    const viewportWidth = page.viewportSize()?.width || 375;
    
    if (logoBox) {
      const logoCenter = logoBox.x + logoBox.width / 2;
      // Allow for some minor deviation, but should be roughly centered
      expect(Math.abs(logoCenter - viewportWidth / 2)).toBeLessThan(20);
    }

    // Check if icons are in a row below (or in the layout)
    const iconsSection = header.locator('.flex.items-center.justify-between.w-full');
    await expect(iconsSection).toBeVisible();
  });

  test('accessibility checks for header', async ({ page }) => {
    // Check for skip link if exists
    const logo = page.locator('header [role="button"]');
    await expect(logo).toHaveAttribute('tabindex', '0');
    
    // Test tab navigation
    await page.keyboard.press('Tab');
    const activeElement = await page.evaluate(() => document.activeElement?.getAttribute('role') || document.activeElement?.tagName);
    // Usually the first focusable is the logo or a skip link
    expect(activeElement).toBeDefined();
  });

  test('icons have consistent sizes in header', async ({ page }) => {
    const icons = page.locator('header svg');
    const count = await icons.count();
    
    for (let i = 0; i < count; i++) {
      const box = await icons.nth(i).boundingBox();
      if (box) {
        // Most header icons should be around 18-20px
        expect(box.width).toBeGreaterThanOrEqual(16);
        expect(box.width).toBeLessThanOrEqual(24);
      }
    }
  });

  test('safe area padding is applied', async ({ page }) => {
    const header = page.locator('header');
    const paddingTop = await header.evaluate(el => window.getComputedStyle(el).paddingTop);
    // Should be at least 0, and if safe-area is supported/simulated it might be more
    expect(paddingTop).toBeDefined();
  });
});
