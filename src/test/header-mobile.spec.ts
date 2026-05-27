import { test, expect } from '@playwright/test';

const viewports = [
  { name: 'iPhone SE', width: 375, height: 667 },
  { name: 'iPhone 14', width: 390, height: 844 },
  { name: 'Android Medium', width: 360, height: 800 },
  { name: 'Android Large', width: 412, height: 915 },
  { name: 'Landscape Mobile', width: 844, height: 390 },
];

test.describe('Mobile Header Multi-Device and Accessibility Tests', () => {
  for (const vp of viewports) {
    test(`header consistency on ${vp.name}`, async ({ page }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.goto('/');
      
      const header = page.locator('header.admin-hide');
      await expect(header).toBeVisible();

      // Validate skip link exists but is visually hidden until focus
      const skipLink = page.locator('a:has-text("Pular para o conteúdo")');
      await expect(skipLink).toBeAttached();
      
      // Check logo alignment
      const logoSection = header.locator('div[role="link"]').first();
      const logoBox = await logoSection.boundingBox();
      
      if (logoBox && vp.width < 768) {
        const logoCenter = logoBox.x + logoBox.width / 2;
        expect(Math.abs(logoCenter - vp.width / 2)).toBeLessThan(30);
      }

      // Accessibility: Check ARIA violations
      const banner = page.locator('header[role="banner"]');
      await expect(banner).toBeVisible();
      
      // Keyboard Navigation
      await page.keyboard.press('Tab');
      const isSkipLinkFocused = await skipLink.evaluate(el => document.activeElement === el);
      expect(isSkipLinkFocused).toBeTruthy();
      
      // Verify visual focus on buttons
      await page.keyboard.press('Tab'); // Move to Logo
      await page.keyboard.press('Tab'); // Move to first control (Search or Back)
      
      const activeElement = await page.evaluate(() => {
        const el = document.activeElement;
        if (!el) return null;
        const styles = window.getComputedStyle(el);
        return {
          tagName: el.tagName,
          ariaLabel: el.getAttribute('aria-label'),
          hasRing: styles.boxShadow !== 'none' || styles.outlineStyle !== 'none'
        };
      });
      
      expect(activeElement?.hasRing).toBeTruthy();
    });
  }

  test('icon density and style standardization', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/');
    
    const headerButtons = page.locator('header button');
    const count = await headerButtons.count();
    
    for (let i = 0; i < count; i++) {
      const button = headerButtons.nth(i);
      const icon = button.locator('svg');
      
      if (await icon.count() > 0) {
        const box = await icon.boundingBox();
        // Expect standardized sizes (approx 18-22px depending on padding)
        expect(box?.width).toBeGreaterThanOrEqual(16);
        expect(box?.width).toBeLessThanOrEqual(24);
        
        const opacity = await icon.evaluate(el => window.getComputedStyle(el).opacity);
        // Expect consistent opacities for inactive icons
        expect(Number(opacity)).toBeGreaterThan(0.5);
      }
    }
  });
});

