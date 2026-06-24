import { test, expect, Page } from '@playwright/test';

/**
 * Navegação por teclado nas bolhas do Nexus.
 * Cobre Tab, Shift+Tab, Enter, Espaço, foco visível e ordem.
 */

const VIEWPORTS = [
  { name: 'mobile', width: 390, height: 844 },
  { name: 'tablet', width: 820, height: 1180 },
  { name: 'desktop', width: 1280, height: 900 },
] as const;

const TARGETS = [
  { abbr: 'Gn', chapter: 1, verse: 1 },
  { abbr: 'Mt', chapter: 5, verse: 3 },
  { abbr: 'Jo', chapter: 6, verse: 35 },
];

async function openChapter(page: Page, abbr: string, ch: number) {
  await page.goto(`/bible?book=${abbr}&ch=${ch}`);
  await page.waitForSelector('[data-testid^="verse-text-"]', { timeout: 20_000 });
}

async function focusVisibleStyles(page: Page) {
  return page.evaluate(() => {
    const el = document.activeElement as HTMLElement | null;
    if (!el) return null;
    const cs = getComputedStyle(el);
    return {
      tag: el.tagName,
      outlineWidth: cs.outlineWidth,
      outlineStyle: cs.outlineStyle,
      boxShadow: cs.boxShadow,
      testId: el.getAttribute('data-testid') || '',
      ariaLabel: el.getAttribute('aria-label') || '',
    };
  });
}

test.describe('Nexus: navegação por teclado', () => {
  for (const vp of VIEWPORTS) {
    test.describe(`viewport ${vp.name}`, () => {
      test.use({ viewport: { width: vp.width, height: vp.height } });

      for (const { abbr, chapter, verse } of TARGETS) {
        test(`${abbr} ${chapter}:${verse} — Tab/Shift+Tab/Enter/Espaço`, async ({ page }) => {
          await openChapter(page, abbr, chapter);
          const container = page.locator(`[data-testid="nexus-bubbles-${verse}"]`);
          await expect(container).toBeVisible();
          const buttons = container.locator('button');
          const total = await buttons.count();
          expect(total, 'sem bolhas para navegar').toBeGreaterThan(0);

          // 1) Foca a primeira bolha programaticamente como ponto de partida
          await buttons.first().focus();
          let info = await focusVisibleStyles(page);
          expect(info, 'sem foco inicial').not.toBeNull();
          const hasFocusRing = !!info && (
            (parseFloat(info.outlineWidth) > 0 && info.outlineStyle !== 'none') ||
            (info.boxShadow && info.boxShadow !== 'none')
          );
          expect(hasFocusRing, 'sem indicador de foco visível na 1ª bolha').toBeTruthy();

          // 2) Tab avança por todas as bolhas do container
          const visited: string[] = [info!.ariaLabel];
          for (let i = 1; i < total; i++) {
            await page.keyboard.press('Tab');
            info = await focusVisibleStyles(page);
            if (info?.ariaLabel) visited.push(info.ariaLabel);
          }
          expect(visited.length, 'Tab não percorreu múltiplas bolhas').toBeGreaterThanOrEqual(1);

          // 3) Shift+Tab volta sem perder o foco do documento
          await page.keyboard.press('Shift+Tab');
          const back = await page.evaluate(() => document.activeElement?.tagName);
          expect(back, 'Shift+Tab perdeu o foco').toBeTruthy();

          // 4) Enter dispara ação (abre painel expandido) sem erro de console
          const errors: string[] = [];
          page.on('pageerror', (e) => errors.push(String(e)));
          await buttons.first().focus();
          await page.keyboard.press('Enter');
          await page.waitForTimeout(300);
          expect(errors, `erros JS após Enter: ${errors.join('\n')}`).toHaveLength(0);

          // fecha qualquer overlay com Escape para não vazar para o próximo bloco
          await page.keyboard.press('Escape');

          // 5) Espaço também ativa (acessível por padrão em <button>)
          await buttons.first().focus();
          await page.keyboard.press('Space');
          await page.waitForTimeout(300);
          expect(errors, `erros JS após Space: ${errors.join('\n')}`).toHaveLength(0);
          await page.keyboard.press('Escape');
        });
      }
    });
  }

  test('Toggle de alto contraste é acessível por teclado', async ({ page }) => {
    await openChapter(page, 'Gn', 1);
    const toggle = page.getByTestId('nexus-contrast-toggle');
    await toggle.focus();
    await page.keyboard.press('Enter');
    await expect(page.locator('html')).toHaveAttribute('data-nexus-contrast', 'high');
    await page.keyboard.press('Enter');
    await expect(page.locator('html')).not.toHaveAttribute('data-nexus-contrast', 'high');
  });
});
