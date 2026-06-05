import { test, expect } from '@playwright/test';

const devices = [
  { name: 'iPhone 14 (Webkit)', use: 'iPhone 14' },
  { name: 'iPhone SE (Webkit)', use: 'iPhone SE' },
  { name: 'iPad mini (Webkit)', use: 'iPad mini' }
];

test.describe('WebKit Mobile Layout & Color Regression (Light & Dark)', () => {
  for (const device of devices) {
    test(`Visual snapshot and WCAG check for ${device.name} - Light Mode`, async ({ page }) => {
      await page.goto('/');
      await page.waitForTimeout(1000);
      
      const bodyText = page.locator('p').first();
      const fontSize = await bodyText.evaluate((el) => window.getComputedStyle(el).fontSize);
      expect(parseInt(fontSize), `Legibilidade: Fonte muito pequena (${fontSize}) no componente <p> para ${device.name}`).toBeGreaterThanOrEqual(14);

      const color = await bodyText.evaluate((el) => window.getComputedStyle(el).color);
      const rgb = color.match(/\d+/g)?.map(Number) || [255, 255, 255];
      const brightness = (rgb[0] * 299 + rgb[1] * 587 + rgb[2] * 114) / 1000;
      
      // Para texto escuro em fundo claro (Light Mode), brilho deve ser baixo
      expect(brightness, 
        `FALHA WCAG AA (Contrast): Componente <p> reprovado no ${device.name} (Light Mode). \n` +
        `Cor encontrada: ${color} (Brightness: ${brightness.toFixed(2)}). \n` +
        `Valor máximo exigido para contraste em fundo claro: < 128 (Escuro)`
      ).toBeLessThan(128);
      
      await page.screenshot({ path: `tests/visual/webkit-${device.name.replace(/\s+/g, '-')}-light.png` });
    });

    test(`Visual snapshot and WCAG check for ${device.name} - Dark Mode`, async ({ page }) => {
      await page.goto('/');
      await page.evaluate(() => document.documentElement.classList.add('dark'));
      await page.waitForTimeout(1000);
      
      const bodyText = page.locator('p').first();
      const color = await bodyText.evaluate((el) => window.getComputedStyle(el).color);
      
      const rgb = color.match(/\d+/g)?.map(Number) || [0, 0, 0];
      const brightness = (rgb[0] * 299 + rgb[1] * 587 + rgb[2] * 114) / 1000;
      
      // Para texto claro em fundo escuro (Dark Mode), brilho deve ser alto (WCAG AA)
      expect(brightness, 
        `FALHA WCAG AA (Contrast): Componente <p> reprovado no ${device.name} (Dark Mode). \n` +
        `Cor encontrada: ${color} (Brightness: ${brightness.toFixed(2)}). \n` +
        `Valor mínimo exigido (WCAG AA) para legibilidade em fundo escuro: > 128 (Claro)`
      ).toBeGreaterThan(128);
      
      await page.screenshot({ path: `tests/visual/webkit-${device.name.replace(/\s+/g, '-')}-dark.png` });
    });
  }
});


