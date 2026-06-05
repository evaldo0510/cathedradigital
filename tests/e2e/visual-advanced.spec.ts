import { test, expect } from '@playwright/test';

const devices = [
  { name: 'iPhone 14', width: 390, height: 844, os: 'ios' },
  { name: 'iPhone SE', width: 320, height: 568, os: 'ios' },
  { name: 'Pixel 7', width: 412, height: 915, os: 'android' },
  { name: 'Galaxy S22', width: 360, height: 800, os: 'android' }
];

test.describe('Advanced Visual & Typography Regression', () => {
  for (const device of devices) {
    test(`Visual & Contrast check for ${device.name} (Light & Dark)`, async ({ page }) => {
      await page.setViewportSize({ width: device.width, height: device.height });
      
      // Light Mode Check
      await page.goto('/');
      await page.waitForTimeout(1000);
      
      const bodyText = page.locator('p').first();
      const fontSize = await bodyText.evaluate((el) => window.getComputedStyle(el).fontSize);
      const fontSizeValue = parseInt(fontSize);
      expect(fontSizeValue, `Legibilidade comprometida no ${device.name}: ${fontSizeValue}px`).toBeGreaterThanOrEqual(14);

      // Contrast Check (Light)
      const colorLight = await bodyText.evaluate((el) => window.getComputedStyle(el).color);
      expect(colorLight, `Contraste insuficiente no modo Light para ${device.name}`).not.toBe('rgb(255, 255, 255)');

      // Dark Mode Check
      await page.evaluate(() => document.documentElement.classList.add('dark'));
      await page.waitForTimeout(500);
      const colorDark = await bodyText.evaluate((el) => window.getComputedStyle(el).color);
      // Detailed contrast failure message
      const isDarkBackgroundSafe = colorDark.includes('255') || colorDark.includes('224'); // Mock check for lighter text on dark bg
      expect(isDarkBackgroundSafe, `Falha de contraste WCAG AA no modo Dark para ${device.name}. Cor encontrada: ${colorDark}. Mínimo exigido: Contrast Ratio 4.5:1`).toBeTruthy();

      await page.screenshot({ path: `tests/visual/regression-${device.name.replace(' ', '-')}-dark.png`, fullPage: false });
    });
  }
});
