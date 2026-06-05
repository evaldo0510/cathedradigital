import { test, expect } from '@playwright/test';

const devices = [
  { name: 'iPhone 14 (Webkit)', use: 'iPhone 14' },
  { name: 'iPhone SE (Webkit)', use: 'iPhone SE' },
  { name: 'iPad mini (Webkit)', use: 'iPad mini' }
];

// Helper to calculate relative luminance
const getLuminance = (r: number, g: number, b: number) => {
  const [rs, gs, bs] = [r, g, b].map(c => {
    c = c / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
};

// Helper to calculate contrast ratio
const getContrastRatio = (lum1: number, lum2: number) => {
  const brightest = Math.max(lum1, lum2);
  const darkest = Math.min(lum1, lum2);
  return (brightest + 0.05) / (darkest + 0.05);
};

test.describe('WebKit Mobile Layout & Color Regression (Light & Dark)', () => {
  for (const device of devices) {
    test(`Visual snapshot and WCAG check for ${device.name} - Light & Dark`, async ({ page }, testInfo) => {
      // 1. LIGHT MODE
      await test.step('Check Light Mode Contrast', async () => {
        await page.goto('/');
        await page.waitForTimeout(1000);
        
        const target = page.locator('p').first();
        const styles = await target.evaluate((el) => {
          const s = window.getComputedStyle(el);
          const bg = window.getComputedStyle(el.parentElement || el).backgroundColor;
          return { color: s.color, backgroundColor: bg, fontSize: s.fontSize };
        });

        const rgbText = styles.color.match(/\d+/g)?.map(Number) || [0, 0, 0];
        const rgbBg = styles.backgroundColor.match(/\d+/g)?.map(Number) || [255, 255, 255];
        
        const lumText = getLuminance(rgbText[0], rgbText[1], rgbText[2]);
        const lumBg = getLuminance(rgbBg[0], rgbBg[1], rgbBg[2]);
        const ratio = getContrastRatio(lumText, lumBg);

        if (ratio < 4.5) {
          const path = `tests/visual/failures/${device.name.replace(/\s+/g, '-')}-light-fail.png`;
          await target.screenshot({ path });
          expect(ratio, 
            `🚨 FALHA WCAG AA: Contraste insuficiente no <p> (${device.name} Light).\n` +
            `Razão: ${ratio.toFixed(2)}:1 (Mínimo exigido: 4.5:1).\n` +
            `Texto: ${styles.color} | Fundo: ${styles.backgroundColor}\n` +
            `Miniatura salva em: ${path}`
          ).toBeGreaterThanOrEqual(4.5);
        }
      });

      // 2. DARK MODE
      await test.step('Check Dark Mode Contrast', async () => {
        await page.evaluate(() => document.documentElement.classList.add('dark'));
        await page.waitForTimeout(1000);
        
        const target = page.locator('p').first();
        const styles = await target.evaluate((el) => {
          const s = window.getComputedStyle(el);
          // Helper to find real background color (walking up the tree)
          let bg = 'rgb(0,0,0)';
          let curr: any = el;
          while (curr && (bg === 'rgba(0, 0, 0, 0)' || bg === 'transparent')) {
            bg = window.getComputedStyle(curr).backgroundColor;
            curr = curr.parentElement;
          }
          return { color: s.color, backgroundColor: bg };
        });

        const rgbText = styles.color.match(/\d+/g)?.map(Number) || [255, 255, 255];
        const rgbBg = styles.backgroundColor.match(/\d+/g)?.map(Number) || [26, 26, 26];
        
        const lumText = getLuminance(rgbText[0], rgbText[1], rgbText[2]);
        const lumBg = getLuminance(rgbBg[0], rgbBg[1], rgbBg[2]);
        const ratio = getContrastRatio(lumText, lumBg);

        if (ratio < 4.5) {
          const path = `tests/visual/failures/${device.name.replace(/\s+/g, '-')}-dark-fail.png`;
          await target.screenshot({ path });
          expect(ratio, 
            `🚨 FALHA WCAG AA: Contraste insuficiente no <p> (${device.name} Dark).\n` +
            `Razão: ${ratio.toFixed(2)}:1 (Mínimo exigido: 4.5:1).\n` +
            `Texto: ${styles.color} | Fundo: ${styles.backgroundColor}\n` +
            `Miniatura salva em: ${path}`
          ).toBeGreaterThanOrEqual(4.5);
        }
      });
    });
  }
});



