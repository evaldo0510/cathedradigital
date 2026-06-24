import { test, Page } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

/**
 * Relatório de evidências do Nexus.
 * Captura screenshots por breakpoint, em modo padrão e em alto contraste,
 * cobrindo Gn 1, Mt 5 e Jo 6 + estados focus/hover de uma bolha.
 * Gera também um índice HTML para revisão rápida.
 */

const VIEWPORTS = [
  { name: 'mobile', width: 390, height: 844 },
  { name: 'tablet', width: 820, height: 1180 },
  { name: 'desktop', width: 1280, height: 900 },
] as const;

const SCENES = [
  { abbr: 'Gn', chapter: 1, focusVerse: 1 },
  { abbr: 'Mt', chapter: 5, focusVerse: 3 },
  { abbr: 'Jo', chapter: 6, focusVerse: 35 },
] as const;

const OUT_DIR = path.resolve('reports/nexus-evidence');

async function ensureDir() {
  fs.mkdirSync(OUT_DIR, { recursive: true });
}

async function openChapter(page: Page, abbr: string, ch: number) {
  await page.goto(`/bible?book=${abbr}&ch=${ch}`);
  await page.waitForSelector('[data-testid^="verse-text-"]', { timeout: 20_000 });
}

async function setHighContrast(page: Page, on: boolean) {
  const current = await page.locator('html').getAttribute('data-nexus-contrast');
  const isOn = current === 'high';
  if (isOn !== on) {
    await page.getByTestId('nexus-contrast-toggle').click();
  }
}

const captured: Array<{ file: string; label: string }> = [];

test.describe('Nexus: evidências por breakpoint', () => {
  test.beforeAll(async () => {
    await ensureDir();
  });

  for (const vp of VIEWPORTS) {
    test.describe(`viewport ${vp.name}`, () => {
      test.use({ viewport: { width: vp.width, height: vp.height } });

      for (const scene of SCENES) {
        test(`${scene.abbr} ${scene.chapter} — padrão + alto contraste + focus/hover`, async ({ page }) => {
          await openChapter(page, scene.abbr, scene.chapter);

          // padrão
          await setHighContrast(page, false);
          const a = `${vp.name}__${scene.abbr}${scene.chapter}__default.png`;
          await page.screenshot({ path: path.join(OUT_DIR, a) });
          captured.push({ file: a, label: `${vp.name} · ${scene.abbr} ${scene.chapter} · padrão` });

          // alto contraste
          await setHighContrast(page, true);
          const b = `${vp.name}__${scene.abbr}${scene.chapter}__high-contrast.png`;
          await page.screenshot({ path: path.join(OUT_DIR, b) });
          captured.push({ file: b, label: `${vp.name} · ${scene.abbr} ${scene.chapter} · alto contraste` });

          // hover na primeira bolha do versículo-foco
          const bubble = page
            .locator(`[data-testid="nexus-bubbles-${scene.focusVerse}"] button`)
            .first();
          if (await bubble.count()) {
            await bubble.scrollIntoViewIfNeeded();
            await bubble.hover();
            const c = `${vp.name}__${scene.abbr}${scene.chapter}__hover.png`;
            await page.screenshot({ path: path.join(OUT_DIR, c) });
            captured.push({ file: c, label: `${vp.name} · ${scene.abbr} ${scene.chapter}:${scene.focusVerse} · hover` });

            await bubble.focus();
            const d = `${vp.name}__${scene.abbr}${scene.chapter}__focus.png`;
            await page.screenshot({ path: path.join(OUT_DIR, d) });
            captured.push({ file: d, label: `${vp.name} · ${scene.abbr} ${scene.chapter}:${scene.focusVerse} · focus` });
          }

          // resetar para não afetar próximos
          await setHighContrast(page, false);
        });
      }
    });
  }

  test.afterAll(async () => {
    const rows = captured
      .map(
        ({ file, label }) => `
        <figure>
          <img src="./${file}" alt="${label}" loading="lazy" />
          <figcaption>${label}</figcaption>
        </figure>`,
      )
      .join('\n');
    const html = `<!doctype html><meta charset="utf-8" />
<title>Nexus — Evidências</title>
<style>
  body { font: 14px/1.5 system-ui, sans-serif; background:#0b1f3a; color:#f5f3ee; margin:0; padding:24px; }
  h1 { font-size: 20px; letter-spacing:.08em; text-transform:uppercase; color:#c8a96a; }
  .grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(320px,1fr)); gap:16px; }
  figure { margin:0; background:#111c33; border:1px solid #1f3458; border-radius:8px; overflow:hidden; }
  img { width:100%; display:block; }
  figcaption { padding:8px 10px; font-size:12px; color:#cbd5e1; }
</style>
<h1>Nexus — Relatório de Evidências</h1>
<p>Gerado em ${new Date().toISOString()} · ${captured.length} capturas</p>
<div class="grid">${rows}</div>`;
    fs.writeFileSync(path.join(OUT_DIR, 'index.html'), html, 'utf8');
    // eslint-disable-next-line no-console
    console.info(`[Nexus evidence] ${captured.length} screenshots → ${OUT_DIR}/index.html`);
  });
});
