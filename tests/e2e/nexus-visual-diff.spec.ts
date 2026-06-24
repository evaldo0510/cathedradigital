import { test, expect, Page } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';
import { PNG } from 'pngjs';
import pixelmatch from 'pixelmatch';

/**
 * Diff visual: modo padrão vs. alto contraste.
 * O alto contraste DEVE alterar visivelmente as bolhas (mín. 0,3% de pixels),
 * mas NÃO deve causar mudanças catastróficas (máx. 35%) que indiquem regressão.
 * O diff é salvo em reports/nexus-visual-diff/ para revisão.
 */

const VIEWPORTS = [
  { name: 'mobile', width: 390, height: 844 },
  { name: 'desktop', width: 1280, height: 900 },
] as const;

const SCENES = [
  { abbr: 'Gn', chapter: 1, verse: 1 },
  { abbr: 'Mt', chapter: 5, verse: 3 },
  { abbr: 'Jo', chapter: 6, verse: 35 },
] as const;

const OUT_DIR = path.resolve('reports/nexus-visual-diff');

async function openChapter(page: Page, abbr: string, ch: number) {
  await page.goto(`/bible?book=${abbr}&ch=${ch}`);
  await page.waitForSelector('[data-testid^="verse-text-"]', { timeout: 20_000 });
}

async function setContrast(page: Page, on: boolean) {
  const current = await page.locator('html').getAttribute('data-nexus-contrast');
  const isOn = current === 'high';
  if (isOn !== on) await page.getByTestId('nexus-contrast-toggle').click();
}

test.describe('Nexus: diff visual padrão × alto contraste', () => {
  test.beforeAll(() => fs.mkdirSync(OUT_DIR, { recursive: true }));

  for (const vp of VIEWPORTS) {
    test.describe(`viewport ${vp.name}`, () => {
      test.use({ viewport: { width: vp.width, height: vp.height } });

      for (const { abbr, chapter, verse } of SCENES) {
        test(`${abbr} ${chapter}:${verse} — alto contraste altera de forma controlada`, async ({ page }) => {
          await openChapter(page, abbr, chapter);
          const bubble = page.locator(`[data-testid="nexus-bubbles-${verse}"]`);
          await expect(bubble).toBeVisible();
          await bubble.scrollIntoViewIfNeeded();

          await setContrast(page, false);
          const aBuf = await bubble.screenshot();
          await setContrast(page, true);
          const bBuf = await bubble.screenshot();
          await setContrast(page, false);

          const a = PNG.sync.read(aBuf);
          const b = PNG.sync.read(bBuf);

          // alinhar dimensões caso layout reflua 1px
          const width = Math.min(a.width, b.width);
          const height = Math.min(a.height, b.height);
          const aCrop = cropPng(a, width, height);
          const bCrop = cropPng(b, width, height);
          const diff = new PNG({ width, height });
          const mismatched = pixelmatch(aCrop.data, bCrop.data, diff.data, width, height, {
            threshold: 0.18,
          });
          const total = width * height;
          const ratio = mismatched / total;

          const base = `${vp.name}__${abbr}${chapter}-${verse}`;
          fs.writeFileSync(path.join(OUT_DIR, `${base}__default.png`), PNG.sync.write(aCrop));
          fs.writeFileSync(path.join(OUT_DIR, `${base}__high.png`), PNG.sync.write(bCrop));
          fs.writeFileSync(path.join(OUT_DIR, `${base}__diff.png`), PNG.sync.write(diff));

          // Banda esperada: alto contraste deve mudar 0,3%..35%
          expect(
            ratio,
            `alto contraste teve impacto visual nulo (${(ratio * 100).toFixed(2)}%) em ${vp.name} ${abbr} ${chapter}:${verse} — verifique CSS [data-nexus-contrast="high"]`,
          ).toBeGreaterThanOrEqual(0.003);
          expect(
            ratio,
            `regressão visual: alto contraste mudou ${(ratio * 100).toFixed(2)}% (> 35%) — diff em reports/nexus-visual-diff/${base}__diff.png`,
          ).toBeLessThanOrEqual(0.35);
        });
      }
    });
  }
});

function cropPng(src: PNG, w: number, h: number): PNG {
  if (src.width === w && src.height === h) return src;
  const out = new PNG({ width: w, height: h });
  for (let y = 0; y < h; y++) {
    src.data.copy(out.data, y * w * 4, y * src.width * 4, y * src.width * 4 + w * 4);
  }
  return out;
}
