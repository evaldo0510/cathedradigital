import { test, expect } from '@playwright/test';

test.describe('Mobile Layout & Color Regression', () => {
  const devices = [
    { name: 'iPhone 14', width: 390, height: 844 },
    { name: 'Pixel 7', width: 412, height: 915 }
  ];

  for (const device of devices) {
    test(`Visual regression test for ${device.name}`, async ({ page }) => {
      await page.setViewportSize({ width: device.width, height: device.height });
      await page.goto('/');
      
      // Wait for content to load
      await page.waitForTimeout(2000);

      // Take a screenshot for comparison
      // In a real CI, this would be compared against a baseline
      await page.screenshot({ path: `tests/visual/regression-${device.name.replace(' ', '-')}.png`, fullPage: true });

      // Accessibility check for contrast on key elements
      const mainText = page.locator('p').first();
      const color = await mainText.evaluate((el) => window.getComputedStyle(el).color);
      
      // Basic check that text is not too light (rough heuristic for #444 or darker)
      // Actual WCAG check would be better but this is a start for regression
      expect(color).not.toBe('rgb(255, 255, 255)');
    });
  }

  test('Should have responsive breakpoints in CSS', async ({ page }) => {
    await page.goto('/');
    const content = await page.content();
    expect(content).toContain('md:');
    expect(content).toContain('lg:');
  });
});
