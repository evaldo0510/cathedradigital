import { test, expect, type Page, type Locator } from '@playwright/test';

/**
 * Regressão do Popover Nexus (substituiu o antigo bottom-sheet):
 *
 *  1. Abertura por teclado (Tab até o card + Enter) move o foco para dentro
 *     do PopoverContent — o Radix não pode entregar foco para o body.
 *  2. Clique fora do popover fecha o popover, sem abrir dialog/modal/outro
 *     popover alternativo.
 *  3. Escape fecha o popover (comportamento nativo Radix), sem deixar
 *     resíduo de wrapper no DOM.
 *
 * NÃO validamos scroll-lock do body: Popover é ancorado, não modal — travar
 * o scroll seria regressão de UX.
 */

const CANDIDATE_CHAPTERS = [
  '/bible?book=Gn&ch=1',
  '/bible?book=Gn&ch=3',
  '/bible?book=Is&ch=53',
  '/bible?book=Sl&ch=23',
  '/bible?book=Mt&ch=5',
  '/bible?book=Jo&ch=1',
];

async function findChapterWithCard(page: Page): Promise<Locator | null> {
  for (const path of CANDIDATE_CHAPTERS) {
    await page.goto(path, { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('networkidle').catch(() => { /* noop */ });
    const card = page.locator('[data-testid="nexus-connection-card"]').first();
    if ((await card.count()) === 0) continue;
    await card.scrollIntoViewIfNeeded().catch(() => { /* noop */ });
    if (await card.isVisible()) return card;
  }
  return null;
}

test.describe('Nexus popover — abertura por teclado / backdrop / Escape', () => {
  test.use({ viewport: { width: 1280, height: 900 } });

  test('Enter no card com foco abre o popover e move o foco para dentro dele', async ({ page }) => {
    const card = await findChapterWithCard(page);
    test.skip(!card, 'Nenhum capítulo candidato tinha conexões Nexus.');
    if (!card) return;

    // Foca o card via API (equivalente a chegar com Tab) — assim o teste
    // não fica frágil quanto ao número de tabulações para alcançá-lo.
    await card.focus();
    await expect(card).toBeFocused();

    // Enter dispara o clique nativo do <button>.
    await page.keyboard.press('Enter');

    const popover = page.locator('[data-testid="nexus-connection-popover"]');
    await expect(popover).toBeVisible({ timeout: 3000 });

    // Foco deve estar dentro do popover (Radix move o foco automaticamente).
    const focusInside = await page.evaluate(() => {
      const el = document.querySelector('[data-testid="nexus-connection-popover"]');
      return !!(el && document.activeElement && (el === document.activeElement || el.contains(document.activeElement)));
    });
    expect(focusInside, 'foco inicial deve estar dentro do PopoverContent').toBe(true);
  });

  test('Espaço no card com foco também abre o popover', async ({ page }) => {
    const card = await findChapterWithCard(page);
    test.skip(!card, 'Nenhum capítulo candidato tinha conexões Nexus.');
    if (!card) return;

    await card.focus();
    await page.keyboard.press('Space');

    const popover = page.locator('[data-testid="nexus-connection-popover"]');
    await expect(popover).toBeVisible({ timeout: 3000 });
  });

  test('clicar fora do popover fecha sem abrir dialog/modal alternativo', async ({ page }) => {
    const card = await findChapterWithCard(page);
    test.skip(!card, 'Nenhum capítulo candidato tinha conexões Nexus.');
    if (!card) return;

    await card.click();
    const popover = page.locator('[data-testid="nexus-connection-popover"]');
    await expect(popover).toBeVisible({ timeout: 3000 });

    // Clica num ponto "seguro" do body (canto superior esquerdo) — fora do popover e fora do card.
    await page.mouse.click(4, 4);

    await expect(popover).toBeHidden({ timeout: 2000 });
    await expect(popover).toHaveCount(0);

    // Nenhum dialog ou popover alternativo pôde ter sido aberto no processo.
    const otherDialogs = page.locator('[role="dialog"][data-state="open"]');
    expect(await otherDialogs.count(), 'não deve abrir dialog alternativo').toBe(0);
    const otherPopovers = page.locator('[data-radix-popper-content-wrapper]');
    expect(await otherPopovers.count(), 'não deve deixar outro popover aberto').toBe(0);
  });

  test('Escape fecha o popover e devolve foco ao card', async ({ page }) => {
    const card = await findChapterWithCard(page);
    test.skip(!card, 'Nenhum capítulo candidato tinha conexões Nexus.');
    if (!card) return;

    await card.focus();
    await page.keyboard.press('Enter');
    const popover = page.locator('[data-testid="nexus-connection-popover"]');
    await expect(popover).toBeVisible({ timeout: 3000 });

    await page.keyboard.press('Escape');
    await expect(popover).toBeHidden({ timeout: 2000 });
    await expect(card).toBeFocused();
  });
});
