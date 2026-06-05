import { test, expect } from '@playwright/test';
import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

// --- CONFIGURAÇÃO DINÂMICA VIA DB ---
let CONTRAST_CONFIG = {
  thresholds: { normal: 4.5, large: 3.0 },
  overrides: {} as any
};

const devices = [
  { name: 'iPhone 14 (Webkit)', use: 'iPhone 14', width: 390, height: 844 },
  { name: 'iPhone SE (Webkit)', use: 'iPhone SE', width: 320, height: 568 },
  { name: 'iPad mini (Webkit)', use: 'iPad mini', width: 768, height: 1024 }
];

const getLuminance = (r: number, g: number, b: number) => {
  const [rs, gs, bs] = [r, g, b].map(c => {
    c = c / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
};

const getContrastRatio = (lum1: number, lum2: number) => {
  const brightest = Math.max(lum1, lum2);
  const darkest = Math.min(lum1, lum2);
  return (brightest + 0.05) / (darkest + 0.05);
};

test.describe('WebKit Mobile Layout & Color Regression (Light & Dark)', () => {
  
  test.beforeAll(async () => {
    const supabaseUrl = process.env.SUPABASE_URL!;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    const supabase = createClient(supabaseUrl, serviceKey);
    
    const { data } = await supabase.from('bible_audit_a11y_config').select('*').eq('id', 'default').single();
    if (data) {
      CONTRAST_CONFIG = {
        thresholds: { normal: data.threshold_normal, large: data.threshold_large },
        overrides: data.device_overrides || {}
      };
    }
  });

  for (const device of devices) {
    test(`Visual snapshot and WCAG check for ${device.name} - Light & Dark`, async ({ page }, testInfo) => {
      await page.setViewportSize({ width: device.width, height: device.height });

      const checkContrast = async (mode: 'light' | 'dark') => {
        if (mode === 'dark') {
          await page.evaluate(() => document.documentElement.classList.add('dark'));
        } else {
          await page.evaluate(() => document.documentElement.classList.remove('dark'));
        }
        await page.goto('/');
        await page.waitForTimeout(1000);
        
        const targets = page.locator('p, h1, h2, h3, button');
        const count = await targets.count();

        for (let i = 0; i < Math.min(count, 5); i++) {
          const target = targets.nth(i);
          const styles = await target.evaluate((el) => {
            const s = window.getComputedStyle(el);
            let bg = 'rgb(255, 255, 255)';
            let curr: any = el;
            while (curr && (bg === 'rgba(0, 0, 0, 0)' || bg === 'transparent' || bg.includes(' 0)'))) {
              bg = window.getComputedStyle(curr).backgroundColor;
              curr = curr.parentElement;
            }
            return { 
              color: s.color, 
              backgroundColor: bg, 
              fontSize: s.fontSize, 
              fontWeight: s.fontWeight,
              tagName: el.tagName.toLowerCase(),
              text: el.innerText.substring(0, 20) + '...'
            };
          });

          const rgbText = styles.color.match(/\d+/g)?.map(Number) || [0, 0, 0];
          const rgbBg = styles.backgroundColor.match(/\d+/g)?.map(Number) || [255, 255, 255];
          
          const lumText = getLuminance(rgbText[0], rgbText[1], rgbText[2]);
          const lumBg = getLuminance(rgbBg[0], rgbBg[1], rgbBg[2]);
          const ratio = getContrastRatio(lumText, lumBg);
          
          const fontSizePx = parseFloat(styles.fontSize);
          const isBold = parseInt(styles.fontWeight) >= 700 || styles.fontWeight === 'bold';
          const isLargeText = fontSizePx >= 24 || (fontSizePx >= 18.66 && isBold);
          
          // Buscar override pelo nome do dispositivo (ex.: "iPhone 14 (Webkit)") ou nome simplificado
          const deviceKey = device.name.replace(' (Webkit)', '');
          const deviceOverride = CONTRAST_CONFIG.overrides[deviceKey] || {};
          const offset = deviceOverride.offset || 0;
          
          const baseThreshold = isLargeText ? CONTRAST_CONFIG.thresholds.large : CONTRAST_CONFIG.thresholds.normal;
          const threshold = baseThreshold + offset;
          
          const criterion = isLargeText ? "WCAG 2.1 1.4.3 (Level AA - Large Text)" : "WCAG 2.1 1.4.3 (Level AA - Normal Text)";

          if (ratio < threshold) {
            const fileName = `${device.name.replace(/\s+/g, '-')}-${mode}-fail-${i}.png`;
            const filePath = path.join('tests/visual/failures', fileName);
            
            if (!fs.existsSync('tests/visual/failures')) fs.mkdirSync('tests/visual/failures', { recursive: true });
            
            await target.screenshot({ path: filePath });
            await testInfo.attach(`Evidence: ${styles.tagName} - ${mode}`, { path: filePath, contentType: 'image/png' });

            const fileUrl = `file://${path.resolve(filePath)}`;

            expect(ratio, 
              `🚨 FALHA DE CONFORMIDADE: ${criterion}\n` +
              `Elemento: <${styles.tagName}> "${styles.text}" (${device.name} ${mode})\n` +
              `Razão: Proporção ${ratio.toFixed(2)}:1 < Limiar ${threshold.toFixed(2)}:1 (Base: ${baseThreshold} + Offset: ${offset})\n` +
              `Cores: Texto ${styles.color} | Fundo ${styles.backgroundColor}\n` +
              `🔗 LINK: ${fileUrl}\n`
            ).toBeGreaterThanOrEqual(threshold);
          }
        }
      };

      await test.step('Check Light Mode', () => checkContrast('light'));
      await test.step('Check Dark Mode', () => checkContrast('dark'));
    });
  }
});
