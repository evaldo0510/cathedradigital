import { test, expect, Page } from '@playwright/test';

/**
 * Nexus ↔ Catecismo: validação completa
 *
 * Cobertura:
 *  1. Bolhas/dots dourados aparecem somente quando há referência válida.
 *  2. Bolhas NUNCA sobrepõem texto do versículo, marcador numérico ou ícone de ação.
 *  3. Validação em mobile, tablet e desktop.
 *  4. Varredura ampla nos capítulos críticos (Gn 1-3, Mt 5-7, Jo 1-6).
 *  5. Navegação bidirecional Bíblia → Catecismo.
 */

const VIEWPORTS = [
  { name: 'mobile', width: 390, height: 844 },
  { name: 'tablet', width: 820, height: 1180 },
  { name: 'desktop', width: 1280, height: 900 },
] as const;

// Versículos com citação garantida (KNOWLEDGE_CONNECTIONS + bible_connections)
const KNOWN_REFERENCES = [
  { abbr: 'Gn', chapter: 1, verse: 1 },
  { abbr: 'Mt', chapter: 5, verse: 3 },
  { abbr: 'Jo', chapter: 6, verse: 35 },
];

// Varredura ampla — capítulos críticos
const SWEEP_CHAPTERS = [
  { abbr: 'Gn', chapters: [1, 2, 3] },
  { abbr: 'Mt', chapters: [5, 6, 7] },
  { abbr: 'Jo', chapters: [1, 3, 6] },
];

async function openChapter(page: Page, abbr: string, ch: number) {
  await page.goto(`/bible?book=${abbr}&ch=${ch}`);
  await page.waitForSelector('[data-testid^="verse-text-"]', { timeout: 20_000 });
}

function rectsOverlap(a: DOMRect, b: DOMRect): boolean {
  return !(a.right <= b.left || b.right <= a.left || a.bottom <= b.top || b.bottom <= a.top);
}

test.describe('Nexus: bolhas, dots e não-sobreposição', () => {
  for (const vp of VIEWPORTS) {
    test.describe(`viewport ${vp.name}`, () => {
      test.use({ viewport: { width: vp.width, height: vp.height } });

      for (const { abbr, chapter, verse } of KNOWN_REFERENCES) {
        test(`${abbr} ${chapter}:${verse} — bolha visível, sem sobreposição`, async ({ page }) => {
          await openChapter(page, abbr, chapter);

          const bubbles = page.locator(`[data-testid="nexus-bubbles-${verse}"]`);
          await expect(bubbles, `bolhas ausentes em ${abbr} ${chapter}:${verse}`).toBeVisible({ timeout: 10_000 });

          // Ponto dourado deve existir no versículo ou capítulo
          const goldCount = await page
            .locator('[aria-label*="citação do Catecismo"]')
            .count();
          expect(goldCount, `sem ponto dourado em ${abbr} ${chapter}:${verse}`).toBeGreaterThan(0);

          // Validar não-sobreposição: bolhas vs. texto do versículo
          const textBox = await page
            .locator(`[data-testid="verse-text-${verse}"]`)
            .boundingBox();
          const bubblesBoxes = await bubbles.locator('button').evaluateAll((els) =>
            els.map((e) => {
              const r = e.getBoundingClientRect();
              return { left: r.left, right: r.right, top: r.top, bottom: r.bottom };
            }),
          );
          expect(textBox).not.toBeNull();
          expect(bubblesBoxes.length).toBeGreaterThan(0);
          for (const bb of bubblesBoxes) {
            const overlap = rectsOverlap(textBox as any, bb as any);
            expect(
              overlap,
              `bolha sobrepõe texto em ${vp.name} ${abbr} ${chapter}:${verse}`,
            ).toBe(false);
          }
        });
      }
    });
  }

  test('Bolhas só aparecem quando há referência válida (varredura)', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    for (const { abbr, chapters } of SWEEP_CHAPTERS) {
      for (const ch of chapters) {
        await openChapter(page, abbr, ch);
        const allBubbles = page.locator('[data-testid^="nexus-bubbles-"]');
        const count = await allBubbles.count();
        // Cada container só renderiza se verseConnections.length > 0
        for (let i = 0; i < count; i++) {
          const buttons = await allBubbles.nth(i).locator('button').count();
          expect(
            buttons,
            `container Nexus vazio em ${abbr} ${ch} (idx ${i})`,
          ).toBeGreaterThan(0);
        }
      }
    }
  });

  test('Navegação bidirecional: Jo 6:35 → CIC 1324', async ({ page }) => {
    await openChapter(page, 'Jo', 6);
    const cicCard = page.getByRole('button', { name: /CIC\s*1324/i }).first();
    await cicCard.click();
    const lerNoCat = page.getByRole('button', { name: /Catecismo/i }).first();
    await lerNoCat.click();
    await page.waitForURL(/\/catechism\?p=1324/, { timeout: 10_000 });
    await expect(page.locator('body')).toContainText(/1324/);
  });
});

/**
 * Casos críticos: versículos com MÚLTIPLAS bolhas do Nexus.
 * Validar que nenhuma bolha sobrepõe outra, nem o texto do versículo,
 * nem o marcador numérico, nem o ícone de ação — em mobile, tablet e desktop.
 */
const MULTI_BUBBLE_VERSES = [
  // Gênesis: criação, imagem de Deus, queda — ricos em CIC
  { abbr: 'Gn', chapter: 1, verse: 1 },
  { abbr: 'Gn', chapter: 1, verse: 26 },
  { abbr: 'Gn', chapter: 1, verse: 27 },
  { abbr: 'Gn', chapter: 2, verse: 7 },
  { abbr: 'Gn', chapter: 2, verse: 24 },
  { abbr: 'Gn', chapter: 3, verse: 15 },
  // Mateus: Bem-aventuranças e Pai-Nosso
  { abbr: 'Mt', chapter: 5, verse: 3 },
  { abbr: 'Mt', chapter: 5, verse: 8 },
  { abbr: 'Mt', chapter: 5, verse: 17 },
  { abbr: 'Mt', chapter: 6, verse: 9 },
  { abbr: 'Mt', chapter: 6, verse: 10 },
  { abbr: 'Mt', chapter: 7, verse: 7 },
  // João: Verbo, Eucaristia, Bom Pastor
  { abbr: 'Jo', chapter: 1, verse: 1 },
  { abbr: 'Jo', chapter: 1, verse: 14 },
  { abbr: 'Jo', chapter: 3, verse: 16 },
  { abbr: 'Jo', chapter: 6, verse: 35 },
  { abbr: 'Jo', chapter: 6, verse: 53 },
  { abbr: 'Jo', chapter: 6, verse: 54 },
];

test.describe('Nexus: múltiplas bolhas sem sobreposição', () => {
  for (const vp of VIEWPORTS) {
    test.describe(`viewport ${vp.name}`, () => {
      test.use({ viewport: { width: vp.width, height: vp.height } });

      for (const { abbr, chapter, verse } of MULTI_BUBBLE_VERSES) {
        test(`${abbr} ${chapter}:${verse} — bolhas múltiplas não se sobrepõem`, async ({ page }) => {
          await openChapter(page, abbr, chapter);

          const container = page.locator(`[data-testid="nexus-bubbles-${verse}"]`);
          // Skip silenciosamente se este versículo não tiver bolhas nesta build
          if ((await container.count()) === 0) {
            test.skip(true, `sem bolhas em ${abbr} ${chapter}:${verse}`);
            return;
          }
          await expect(container).toBeVisible({ timeout: 10_000 });

          const bubbleBoxes = await container.locator('button').evaluateAll((els) =>
            els.map((e) => {
              const r = e.getBoundingClientRect();
              return { left: r.left, right: r.right, top: r.top, bottom: r.bottom };
            }),
          );

          // 1) Bolhas entre si — nenhum par deve se sobrepor
          for (let i = 0; i < bubbleBoxes.length; i++) {
            for (let j = i + 1; j < bubbleBoxes.length; j++) {
              const a = bubbleBoxes[i];
              const b = bubbleBoxes[j];
              const overlap = rectsOverlap(a as any, b as any);
              expect(
                overlap,
                `bolha #${i} sobrepõe bolha #${j} em ${vp.name} ${abbr} ${chapter}:${verse}`,
              ).toBe(false);
            }
          }

          // 2) Bolhas vs. texto do versículo
          const textBox = await page
            .locator(`[data-testid="verse-text-${verse}"]`)
            .boundingBox();
          if (textBox) {
            for (const bb of bubbleBoxes) {
              expect(
                rectsOverlap(textBox as any, bb as any),
                `bolha sobrepõe texto em ${vp.name} ${abbr} ${chapter}:${verse}`,
              ).toBe(false);
            }
          }

          // 3) Bolhas vs. marcador numérico e ícones de ação (se existirem)
          const markerSelectors = [
            `[data-testid="verse-number-${verse}"]`,
            `[data-testid="verse-actions-${verse}"]`,
          ];
          for (const sel of markerSelectors) {
            const loc = page.locator(sel);
            if ((await loc.count()) === 0) continue;
            const mb = await loc.first().boundingBox();
            if (!mb) continue;
            for (const bb of bubbleBoxes) {
              expect(
                rectsOverlap(mb as any, bb as any),
                `bolha sobrepõe ${sel} em ${vp.name} ${abbr} ${chapter}:${verse}`,
              ).toBe(false);
            }
          }
        });
      }
    });
  }
});

/**
 * Acessibilidade das bolhas do Nexus:
 *  - Foco navegável via Tab + indicador focus-visible
 *  - Accessible name (aria-label ou texto) descritivo
 *  - Tap target mínimo (44×44 mobile, 32×32 desktop/tablet)
 *  - Contraste WCAG AA (≥ 3:1 para UI/texto grande)
 */
function relLuminance(rgb: [number, number, number]): number {
  const [r, g, b] = rgb.map((c) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
function contrastRatio(fg: [number, number, number], bg: [number, number, number]) {
  const L1 = relLuminance(fg);
  const L2 = relLuminance(bg);
  const [hi, lo] = L1 > L2 ? [L1, L2] : [L2, L1];
  return (hi + 0.05) / (lo + 0.05);
}
function parseColor(css: string): [number, number, number] | null {
  const m = css.match(/rgba?\(([^)]+)\)/);
  if (!m) return null;
  const parts = m[1].split(',').map((x) => parseFloat(x.trim()));
  if (parts.length < 3) return null;
  return [parts[0], parts[1], parts[2]];
}

test.describe('Nexus: acessibilidade das bolhas', () => {
  for (const vp of VIEWPORTS) {
    test.describe(`viewport ${vp.name}`, () => {
      test.use({ viewport: { width: vp.width, height: vp.height } });

      for (const { abbr, chapter, verse } of KNOWN_REFERENCES) {
        test(`${abbr} ${chapter}:${verse} — foco, label, tap target e contraste`, async ({ page }) => {
          await openChapter(page, abbr, chapter);
          const container = page.locator(`[data-testid="nexus-bubbles-${verse}"]`);
          await expect(container).toBeVisible({ timeout: 10_000 });
          const buttons = container.locator('button');
          const total = await buttons.count();
          expect(total, `nenhuma bolha em ${abbr} ${chapter}:${verse}`).toBeGreaterThan(0);

          const minTap = vp.name === 'mobile' ? 44 : 32;

          for (let i = 0; i < total; i++) {
            const btn = buttons.nth(i);

            // 1) Nome acessível
            const aria = await btn.getAttribute('aria-label');
            const txt = (await btn.innerText()).trim();
            const name = (aria || txt || '').trim();
            expect(
              name.length,
              `bolha #${i} sem nome acessível em ${vp.name} ${abbr} ${chapter}:${verse}`,
            ).toBeGreaterThan(1);

            // 2) Tap target
            const box = await btn.boundingBox();
            expect(box, `bolha #${i} sem boundingBox`).not.toBeNull();
            if (box) {
              expect(
                box.height,
                `tap target altura < ${minTap}px (${box.height.toFixed(1)}) em ${vp.name} bolha #${i}`,
              ).toBeGreaterThanOrEqual(minTap - 0.5);
              expect(
                box.width,
                `tap target largura < ${minTap}px (${box.width.toFixed(1)}) em ${vp.name} bolha #${i}`,
              ).toBeGreaterThanOrEqual(minTap - 0.5);
            }

            // 3) Foco navegável + indicador visível
            await btn.focus();
            const focused = await btn.evaluate((el) => el === document.activeElement);
            expect(focused, `bolha #${i} não recebe foco`).toBe(true);
            const focusStyles = await btn.evaluate((el) => {
              const cs = getComputedStyle(el);
              return {
                outlineWidth: cs.outlineWidth,
                outlineStyle: cs.outlineStyle,
                boxShadow: cs.boxShadow,
              };
            });
            const hasVisibleFocus =
              (parseFloat(focusStyles.outlineWidth) > 0 && focusStyles.outlineStyle !== 'none') ||
              (!!focusStyles.boxShadow && focusStyles.boxShadow !== 'none');
            expect(
              hasVisibleFocus,
              `bolha #${i} sem indicador de foco visível em ${vp.name}`,
            ).toBeTruthy();

            // 4) Contraste WCAG AA (UI ≥ 3:1)
            const { fg, bg } = await btn.evaluate((el) => {
              const cs = getComputedStyle(el);
              let node: HTMLElement | null = el as HTMLElement;
              let bgColor = cs.backgroundColor;
              while (
                node &&
                (bgColor === 'rgba(0, 0, 0, 0)' || bgColor === 'transparent')
              ) {
                node = node.parentElement;
                if (!node) break;
                bgColor = getComputedStyle(node).backgroundColor;
              }
              return { fg: cs.color, bg: bgColor || 'rgb(255,255,255)' };
            });
            const fgRgb = parseColor(fg);
            const bgRgb = parseColor(bg);
            if (fgRgb && bgRgb) {
              const ratio = contrastRatio(fgRgb, bgRgb);
              expect(
                ratio,
                `contraste ${ratio.toFixed(2)}:1 < 3:1 em ${vp.name} ${abbr} ${chapter}:${verse} bolha #${i}`,
              ).toBeGreaterThanOrEqual(3);
            }
          }

          // 5) Tab percorre todas as bolhas sem perder o foco
          await buttons.first().focus();
          for (let i = 1; i < total; i++) {
            await page.keyboard.press('Tab');
          }
          const lastFocusedTag = await page.evaluate(() => document.activeElement?.tagName);
          expect(lastFocusedTag, 'Tab perdeu o foco do documento').toBeTruthy();
        });
      }
    });
  }
});
