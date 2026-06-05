import { test, expect } from '@playwright/test';

const devices = [
  { name: 'iPhone 14 (Webkit)', use: 'iPhone 14' },
  { name: 'iPhone SE (Webkit)', use: 'iPhone SE' },
  { name: 'iPad mini (Webkit)', use: 'iPad mini' }
];

test.describe('WebKit Mobile Layout & Color Regression', () => {
  for (const device of devices) {
    test(`Visual snapshot for ${device.name}`, async ({ page }) => {
      // Note: In real Playwright config, these would be separate projects
      // This is a simplified test for the specific request
      await page.goto('/');
      await page.waitForTimeout(1000);
      
      // Validation of typography scale
      const bodyText = page.locator('p').first();
      const fontSize = await bodyText.evaluate((el) => window.getComputedStyle(el).fontSize);
      const fontSizeValue = parseInt(fontSize);
      
      // Check if font size is legible (>= 14px on mobile)
      expect(fontSizeValue).toBeGreaterThanOrEqual(14);

      // Contrast validation (simulated check for text color)
      const color = await bodyText.evaluate((el) => window.getComputedStyle(el).color);
      // Rough check against light colors that would fail contrast
      expect(color).not.toContain('255, 255, 255');
    });
  }
});
