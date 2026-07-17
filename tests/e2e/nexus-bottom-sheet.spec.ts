import { test, expect, type Page, type Locator } from '@playwright/test';

/**
 * Regressão: os cards de "conexões Nexus" (abaixo de cada versículo) devem
 * SEMPRE abrir o bottom-sheet fixo no rodapé (mobile: colado no bottom;
 * desktop lg: centralizado). Não podem virar popover ancorado nem modal
 * inline dentro do fluxo do texto.
 *
 * Critérios verificados:
 *   1. O wrapper [data-testid="nexus-bottom-sheet"] aparece no DOM e é fixed
 *      cobrindo toda a viewport (inset-0).
 *   2. O painel interno encosta na borda inferior em mobile (bottom da
 *      viewport) ou está centralizado em desktop.
 *   3. Não abre nenhum popover Radix ([data-radix-popper-content-wrapper]).
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
    if (await card.count() > 0) {
      await card.scrollIntoViewIfNeeded().catch(() => { /* noop */ });
      if (await card.isVisible()) return card;
    }
  }
  return null;
}

test.describe('Nexus — cards de conexão abrem bottom-sheet fixo', () => {
  test('clique no card abre bottom-sheet ancorado no rodapé, sem popover', async ({ page }, testInfo) => {
    const card = await findChapterWithCard(page);
    test.skip(
      !card,
      'Nenhum capítulo candidato tinha conexões Nexus renderizadas — adicione um em CANDIDATE_CHAPTERS.'
    );
    if (!card) return;

    await card.click();

    // 1. Bottom-sheet apareceu
    const sheet = page.locator('[data-testid="nexus-bottom-sheet"]');
    await expect(sheet).toBeVisible({ timeout: 5000 });

    const panel = page.locator('[data-testid="nexus-bottom-sheet-panel"]');
    await expect(panel).toBeVisible();

    // 2. Wrapper cobre a viewport toda (fixed inset-0)
    const viewport = page.viewportSize();
    expect(viewport).not.toBeNull();
    if (!viewport) return;

    const sheetBox = await sheet.boundingBox();
    expect(sheetBox, 'bottom-sheet deve ter bounding box').not.toBeNull();
    if (!sheetBox) return;
    expect(sheetBox.width, 'wrapper deve cobrir a largura da viewport').toBeGreaterThanOrEqual(viewport.width - 2);
    expect(sheetBox.height, 'wrapper deve cobrir a altura da viewport').toBeGreaterThanOrEqual(viewport.height - 2);

    // 3. Painel fica no rodapé (mobile) OU centralizado vertical (desktop lg ≥ 1024px)
    const panelBox = await panel.boundingBox();
    expect(panelBox, 'painel deve ter bounding box').not.toBeNull();
    if (!panelBox) return;

    const panelBottom = panelBox.y + panelBox.height;
    if (viewport.width < 1024) {
      // Mobile: encosta no rodapé (tolerância pra safe-area/animação)
      expect(
        Math.abs(panelBottom - viewport.height),
        `mobile: painel deve encostar no rodapé (bottom=${panelBottom.toFixed(0)}, viewport=${viewport.height})`
      ).toBeLessThanOrEqual(24);
    } else {
      // Desktop: centralizado — top deve ser > 0 e não colado no topo
      expect(panelBox.y, 'desktop: painel deve estar afastado do topo').toBeGreaterThan(20);
    }

    // 4. Nenhum popover Radix foi aberto (garante que não virou popover)
    const popover = page.locator('[data-radix-popper-content-wrapper]');
    expect(await popover.count(), 'não deve abrir popover Radix').toBe(0);

    testInfo.annotations.push({
      type: 'nexus-sheet-metrics',
      description: `viewport=${viewport.width}x${viewport.height} panel=${panelBox.width.toFixed(0)}x${panelBox.height.toFixed(0)} bottom=${panelBottom.toFixed(0)}`,
    });
  });
});
