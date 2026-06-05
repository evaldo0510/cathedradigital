import { test, expect } from '@playwright/test';

const devices = [
  { name: 'iPhone 14 (Webkit)', use: 'iPhone 14' },
  { name: 'iPhone SE (Webkit)', use: 'iPhone SE' },
  { name: 'iPad mini (Webkit)', use: 'iPad mini' }
];

test.describe('WebKit Mobile Layout & Color Regression (Light & Dark)', () => {
  for (const device of devices) {
    test(`Visual snapshot for ${device.name} - Light Mode`, async ({ page }) => {
      await page.goto('/');
      await page.waitForTimeout(1000);
      
      const bodyText = page.locator('p').first();
      const fontSize = await bodyText.evaluate((el) => window.getComputedStyle(el).fontSize);
      expect(parseInt(fontSize)).toBeGreaterThanOrEqual(14);

      const color = await bodyText.evaluate((el) => window.getComputedStyle(el).color);
      expect(color).not.toContain('255, 255, 255');
      
      await page.screenshot({ path: `tests/visual/webkit-${device.name.replace(/\s+/g, '-')}-light.png` });
    });

    test(`Visual snapshot for ${device.name} - Dark Mode`, async ({ page }) => {
      await page.goto('/');
      await page.evaluate(() => document.documentElement.classList.add('dark'));
      await page.waitForTimeout(1000);
      
      const bodyText = page.locator('p').first();
      const color = await bodyText.evaluate((el) => window.getComputedStyle(el).color);
      
      // Validação de contraste para modo dark (espera-se texto claro/branco)
      // rgb(191, 191, 191) ou similar para WCAG AA em fundos escuros
      const rgb = color.match(/\d+/g)?.map(Number) || [0,0,0];
      const brightness = (rgb[0] * 299 + rgb[1] * 587 + rgb[2] * 114) / 1000;
      expect(brightness, `Contraste insuficiente no modo Dark (WebKit) para ${device.name}: ${color}`).toBeGreaterThan(128);
      
      await page.screenshot({ path: `tests/visual/webkit-${device.name.replace(/\s+/g, '-')}-dark.png` });
    });
  }
});

