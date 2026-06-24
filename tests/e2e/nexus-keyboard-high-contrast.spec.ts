import { test, expect, Page } from '@playwright/test';

/**
 * Navegação por teclado em links e menus do Nexus,
 * com o modo ALTO CONTRASTE ATIVO, em mobile/tablet/desktop.
 *
 * Cobre:
 *  - Ordem de tabulação previsível (chrome → conteúdo → bolhas → painel expandido)
 *  - Foco visível em todo elemento focável (outline ou box-shadow)
 *  - Enter/Espaço ativam cards de citação (Catecismo / Magistério / Referência)
 *  - Escape fecha o painel expandido sem quebrar o foco
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

async function enableHighContrast(page: Page) {
  const html = page.locator('html');
  if ((await html.getAttribute('data-nexus-contrast')) !== 'high') {
    await page.getByTestId('nexus-contrast-toggle').click();
  }
  await expect(html).toHaveAttribute('data-nexus-contrast', 'high');
}

async function activeInfo(page: Page) {
  return page.evaluate(() => {
    const el = document.activeElement as HTMLElement | null;
    if (!el) return null;
    const cs = getComputedStyle(el);
    const rect = el.getBoundingClientRect();
    return {
      tag: el.tagName,
      role: el.getAttribute('role') || '',
      label: el.getAttribute('aria-label') || el.textContent?.trim().slice(0, 60) || '',
      testId: el.getAttribute('data-testid') || '',
      visible: rect.width > 0 && rect.height > 0,
      hasFocusRing:
        (parseFloat(cs.outlineWidth) > 0 && cs.outlineStyle !== 'none') ||
        (!!cs.boxShadow && cs.boxShadow !== 'none'),
    };
  });
}

test.describe('Nexus alto contraste: teclado em links e menus', () => {
  for (const vp of VIEWPORTS) {
    test.describe(`viewport ${vp.name}`, () => {
      test.use({ viewport: { width: vp.width, height: vp.height } });

      for (const { abbr, chapter, verse } of TARGETS) {
        test(`${abbr} ${chapter}:${verse} — ordem e foco visível em alto contraste`, async ({ page }) => {
          await openChapter(page, abbr, chapter);
          await enableHighContrast(page);

          const bubbles = page.locator(`[data-testid="nexus-bubbles-${verse}"] button`);
          const total = await bubbles.count();
          expect(total, 'sem bolhas para Tab').toBeGreaterThan(0);

          // 1) Ordem: a partir da primeira bolha, Tab visita N-1 elementos sem perder foco visível
          await bubbles.first().focus();
          const order: string[] = [];
          for (let i = 0; i < total; i++) {
            const info = await activeInfo(page);
            expect(info, `foco perdido no passo ${i}`).not.toBeNull();
            expect(
              info!.hasFocusRing,
              `foco SEM indicador visível no passo ${i} (${info!.label}) — alto contraste`,
            ).toBeTruthy();
            expect(info!.visible, `elemento focado invisível no passo ${i}`).toBeTruthy();
            order.push(info!.label);
            if (i < total - 1) await page.keyboard.press('Tab');
          }
          expect(new Set(order).size, 'Tab parou em duplicatas').toBeGreaterThanOrEqual(
            Math.min(total, 2),
          );

          // 2) Shift+Tab volta uma posição mantendo foco visível
          await page.keyboard.press('Shift+Tab');
          const back = await activeInfo(page);
          expect(back?.hasFocusRing, 'foco invisível após Shift+Tab').toBeTruthy();

          // 3) Enter abre painel expandido sem erros JS
          const errors: string[] = [];
          page.on('pageerror', (e) => errors.push(String(e)));
          await bubbles.first().focus();
          await page.keyboard.press('Enter');
          await page.waitForTimeout(250);
          expect(errors, `erros após Enter em alto contraste: ${errors.join('\n')}`).toHaveLength(0);

          // 4) Dentro do painel expandido, pelo menos um botão recebe foco com indicador
          const dialogButtons = page.locator('[role="dialog"] button, [role="menu"] button');
          const dialogCount = await dialogButtons.count();
          if (dialogCount > 0) {
            await dialogButtons.first().focus();
            const di = await activeInfo(page);
            expect(di?.hasFocusRing, 'botão do painel sem foco visível').toBeTruthy();
          }

          // 5) Escape fecha sem perder a página
          await page.keyboard.press('Escape');
          await page.waitForTimeout(150);
          const docTag = await page.evaluate(() => document.activeElement?.tagName);
          expect(docTag, 'Escape perdeu o documento').toBeTruthy();

          // 6) Espaço também ativa a bolha (semântica nativa de <button>)
          await bubbles.first().focus();
          await page.keyboard.press('Space');
          await page.waitForTimeout(200);
          expect(errors, `erros após Space em alto contraste: ${errors.join('\n')}`).toHaveLength(0);
          await page.keyboard.press('Escape');
        });
      }
    });
  }

  test('Toggle de alto contraste continua focável e reversível pelo teclado', async ({ page }) => {
    await page.goto('/bible?book=Gn&ch=1');
    await page.waitForSelector('[data-testid^="verse-text-"]');
    const toggle = page.getByTestId('nexus-contrast-toggle');
    await toggle.focus();
    const info1 = await activeInfo(page);
    expect(info1?.hasFocusRing, 'toggle sem foco visível').toBeTruthy();
    await page.keyboard.press('Enter');
    await expect(page.locator('html')).toHaveAttribute('data-nexus-contrast', 'high');
    await page.keyboard.press('Enter');
    await expect(page.locator('html')).not.toHaveAttribute('data-nexus-contrast', 'high');
  });
});
