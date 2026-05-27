import { test, expect } from '@playwright/test';
import { injectAxe, checkA11y } from 'axe-playwright';

const viewports = [
  // Portrait
  { name: 'iPhone SE', width: 375, height: 667, orientation: 'portrait' },
  { name: 'iPhone 14', width: 390, height: 844, orientation: 'portrait' },
  { name: 'Android Medium', width: 360, height: 800, orientation: 'portrait' },
  { name: 'Android Large', width: 412, height: 915, orientation: 'portrait' },
  // Landscape
  { name: 'iPhone SE Landscape', width: 667, height: 375, orientation: 'landscape' },
  { name: 'iPhone 14 Landscape', width: 844, height: 390, orientation: 'landscape' },
  { name: 'Android Medium Landscape', width: 800, height: 360, orientation: 'landscape' },
];

test.describe('Mobile Header Comprehensive Tests', () => {
  for (const vp of viewports) {
    test(`Header on ${vp.name} (${vp.orientation})`, async ({ page }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      // Go to a page that has the header (e.g., /bible)
      await page.goto('/bible');
      
      const header = page.locator('header[role="banner"]');
      await expect(header).toBeVisible();

      // 1. Visual Regression Snapshot
      // We use a specific name for the snapshot to include viewport info
      await expect(header).toHaveScreenshot(`header-${vp.name.replace(/\s+/g, '-').toLowerCase()}.png`, {
        maxDiffPixelRatio: 0.05,
      });

      // 2. Accessibility Check (Axe)
      await injectAxe(page);
      await checkA11y(page, 'header[role="banner"]', {
        axeOptions: {
          runOnly: {
            type: 'tag',
            values: ['wcag2a', 'wcag2aa', 'best-practice'],
          },
        },
      });

      // 3. Skip Link Functionality
      const skipLink = page.locator('a[href="#main-content"]');
      await expect(skipLink).toBeAttached();
      
      // Reset focus
      await page.mouse.click(0, 0);
      await page.keyboard.press('Tab');
      
      // Skip link should be focused first
      const isSkipLinkFocused = await skipLink.evaluate(el => document.activeElement === el);
      expect(isSkipLinkFocused).toBeTruthy();
      
      // Press Enter to activate skip link
      await page.keyboard.press('Enter');
      
      // Main content should be focused (it should have tabIndex={-1})
      const mainContent = page.locator('#main-content');
      const isMainFocused = await mainContent.evaluate(el => document.activeElement === el);
      expect(isMainFocused).toBeTruthy();

      // 4. Focus Order
      // Order: Skip Link -> Logo -> Back Button (if present) -> Search -> Theme -> Profile/Login -> Menu
      // We already focused Skip Link. Let's continue.
      
      await page.keyboard.press('Tab'); // Move to Logo
      const logo = page.locator('div[role="link"][aria-label*="inicial"]');
      expect(await logo.evaluate(el => document.activeElement === el)).toBeTruthy();

      await page.keyboard.press('Tab'); // Move to Back Button (on /bible it should be there)
      const backBtn = page.locator('button[aria-label*="Voltar"]');
      expect(await backBtn.evaluate(el => document.activeElement === el)).toBeTruthy();

      await page.keyboard.press('Tab'); // Move to Search
      const searchBtn = page.locator('button[aria-label*="Buscar"]');
      expect(await searchBtn.evaluate(el => document.activeElement === el)).toBeTruthy();

      await page.keyboard.press('Tab'); // Move to Theme
      const themeBtn = page.locator('button[aria-label*="modo"]');
      expect(await themeBtn.evaluate(el => document.activeElement === el)).toBeTruthy();

      await page.keyboard.press('Tab'); // Move to Profile/Login
      const profileBtn = page.locator('button[aria-label*="Perfil"], button:has-text("Entrar")');
      expect(await profileBtn.evaluate(el => document.activeElement === el)).toBeTruthy();

      await page.keyboard.press('Tab'); // Move to Menu
      const menuBtn = page.locator('button[aria-label*="menu lateral"]');
      expect(await menuBtn.evaluate(el => document.activeElement === el)).toBeTruthy();
      
      // 5. Hierarchy and Safe Area Check
      const headerBox = await header.boundingBox();
      expect(headerBox?.height).toBeGreaterThan(60); // Minimum height to avoid collapse
      
      // Verify no horizontal overflow
      const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
      expect(bodyWidth).toBeLessThanOrEqual(vp.width);
    });
  }

  test('Icon Density Consistency across Viewports', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/bible');
    
    const icons = page.locator('header svg');
    const count = await icons.count();
    
    for (let i = 0; i < count; i++) {
      const icon = icons.nth(i);
      const box = await icon.boundingBox();
      
      // Standard icon size is 18-20px
      expect(box?.width).toBeGreaterThanOrEqual(16);
      expect(box?.width).toBeLessThanOrEqual(24);
      
      const strokeWidth = await icon.evaluate(el => window.getComputedStyle(el).strokeWidth);
      // We expect 1.2 as defined in constants
      expect(parseFloat(strokeWidth)).toBeCloseTo(1.2, 0.1);
    }
  });
});
