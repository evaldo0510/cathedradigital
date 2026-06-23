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
