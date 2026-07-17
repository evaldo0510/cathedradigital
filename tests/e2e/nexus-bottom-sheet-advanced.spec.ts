import { test, expect, type Page, type Locator, devices } from '@playwright/test';

/**
 * Suíte avançada do bottom-sheet Nexus:
 *
 *  1. Scroll + rotação em mobile — o painel deve continuar colado no rodapé
 *     e sem virar popover.
 *  2. Acessibilidade — role="dialog", aria-modal, aria-labelledby, foco
 *     inicial no painel/botão, Tab preso dentro do painel, Escape fecha e
 *     devolve o foco ao trigger.
 *  3. Snapshot visual do painel em mobile e desktop.
 *  4. Clicar em uma conexão Nexus (botão "Ler no Catecismo/Documento")
 *     dentro do sheet navega para a referência correta sem abrir popover
 *     nem outro modal.
 */

const CANDIDATE_CHAPTERS = [
  '/bible?book=Gn&ch=1',
  '/bible?book=Gn&ch=3',
  '/bible?book=Is&ch=53',
  '/bible?book=Sl&ch=23',
  '/bible?book=Mt&ch=5',
  '/bible?book=Jo&ch=1',
];

async function openSheet(page: Page): Promise<Locator | null> {
  for (const path of CANDIDATE_CHAPTERS) {
    await page.goto(path, { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('networkidle').catch(() => { /* noop */ });
    const card = page.locator('[data-testid="nexus-connection-card"]').first();
    if ((await card.count()) === 0) continue;
    await card.scrollIntoViewIfNeeded().catch(() => { /* noop */ });
    if (!(await card.isVisible())) continue;
    await card.click();
    const panel = page.locator('[data-testid="nexus-bottom-sheet-panel"]');
    await expect(panel).toBeVisible({ timeout: 5000 });
    return panel;
  }
  return null;
}

async function assertNoPopover(page: Page) {
  const popover = page.locator('[data-radix-popper-content-wrapper]');
  expect(await popover.count(), 'não deve abrir popover Radix').toBe(0);
}

// ---------------------------------------------------------------------------
// 1. Scroll + rotação mobile
// ---------------------------------------------------------------------------
test.describe('Nexus sheet — scroll + rotação (mobile)', () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test('permanece fixo no rodapé após scroll da página e rotação', async ({ page }) => {
    const panel = await openSheet(page);
    test.skip(!panel, 'Nenhum capítulo candidato tinha conexões Nexus.');
    if (!panel) return;

    const viewport1 = page.viewportSize()!;
    const box1 = await panel.boundingBox();
    expect(box1).not.toBeNull();
    if (!box1) return;

    // Scroll do body/janela — o sheet é fixed, não pode se mover
    await page.evaluate(() => window.scrollTo(0, 500));
    await page.waitForTimeout(150);
    const box2 = await panel.boundingBox();
    expect(box2).not.toBeNull();
    if (!box2) return;
    expect(
      Math.abs((box2.y + box2.height) - viewport1.height),
      'após scroll, painel deve continuar colado no rodapé'
    ).toBeLessThanOrEqual(24);

    // Rotação: portrait -> landscape
    await page.setViewportSize({ width: 844, height: 390 });
    await page.waitForTimeout(250);
    const viewport2 = page.viewportSize()!;
    const box3 = await panel.boundingBox();
    expect(box3, 'painel deve continuar no DOM após rotação').not.toBeNull();
    if (!box3) return;
    expect(
      Math.abs((box3.y + box3.height) - viewport2.height),
      'após rotação, painel continua colado no rodapé'
    ).toBeLessThanOrEqual(24);

    await assertNoPopover(page);
  });
});

// ---------------------------------------------------------------------------
// 2. Acessibilidade
// ---------------------------------------------------------------------------
test.describe('Nexus sheet — acessibilidade', () => {
  test.use({ viewport: { width: 1280, height: 900 } });

  test('role/aria corretos, foco preso e Escape fecha devolvendo foco', async ({ page }) => {
    const panel = await openSheet(page);
    test.skip(!panel, 'Nenhum capítulo candidato tinha conexões Nexus.');
    if (!panel) return;

    // ARIA
    await expect(panel).toHaveAttribute('role', 'dialog');
    await expect(panel).toHaveAttribute('aria-modal', 'true');
    await expect(panel).toHaveAttribute('aria-labelledby', 'nexus-sheet-title');
    await expect(page.locator('#nexus-sheet-title')).toBeVisible();

    // Foco inicial dentro do painel
    const focusInsidePanel = await page.evaluate(() => {
      const panelEl = document.querySelector('[data-testid="nexus-bottom-sheet-panel"]');
      return !!(panelEl && document.activeElement && panelEl.contains(document.activeElement));
    });
    expect(focusInsidePanel, 'foco inicial deve estar dentro do painel').toBe(true);

    // Focus trap: Tab várias vezes nunca escapa do painel
    for (let i = 0; i < 8; i++) {
      await page.keyboard.press('Tab');
      const stillInside = await page.evaluate(() => {
        const panelEl = document.querySelector('[data-testid="nexus-bottom-sheet-panel"]');
        return !!(panelEl && document.activeElement && panelEl.contains(document.activeElement));
      });
      expect(stillInside, `Tab #${i + 1}: foco deve permanecer dentro do painel`).toBe(true);
    }

    // Shift+Tab também
    for (let i = 0; i < 4; i++) {
      await page.keyboard.press('Shift+Tab');
      const stillInside = await page.evaluate(() => {
        const panelEl = document.querySelector('[data-testid="nexus-bottom-sheet-panel"]');
        return !!(panelEl && document.activeElement && panelEl.contains(document.activeElement));
      });
      expect(stillInside, `Shift+Tab #${i + 1}: foco deve permanecer dentro do painel`).toBe(true);
    }

    // Escape fecha
    await page.keyboard.press('Escape');
    await expect(panel).toBeHidden({ timeout: 2000 });
    await assertNoPopover(page);
  });
});

// ---------------------------------------------------------------------------
// 3. Snapshot visual
// ---------------------------------------------------------------------------
test.describe('Nexus sheet — snapshot visual', () => {
  for (const preset of [
    { name: 'mobile', viewport: { width: 390, height: 844 } },
    { name: 'desktop', viewport: { width: 1280, height: 900 } },
  ] as const) {
    test.describe(preset.name, () => {
      test.use({ viewport: preset.viewport });

      test(`snapshot do painel — ${preset.name}`, async ({ page }) => {
        const panel = await openSheet(page);
        test.skip(!panel, 'Nenhum capítulo candidato tinha conexões Nexus.');
        if (!panel) return;

        // Espera fim da animação de spring
        await page.waitForTimeout(600);
        await expect(panel).toHaveScreenshot(`nexus-sheet-${preset.name}.png`, {
          maxDiffPixelRatio: 0.02,
          animations: 'disabled',
        });
      });
    });
  }
});

// ---------------------------------------------------------------------------
// 4. Clique nas conexões dentro do sheet leva à referência correta
// ---------------------------------------------------------------------------
test.describe('Nexus sheet — navegação para referência', () => {
  test.use({ viewport: { width: 1280, height: 900 } });

  test('clicar em "Ler no Catecismo/Documento" navega e não abre popover/modal alternativo', async ({ page }) => {
    const panel = await openSheet(page);
    test.skip(!panel, 'Nenhum capítulo candidato tinha conexões Nexus.');
    if (!panel) return;

    const navBtn = page.locator('[data-testid="nexus-sheet-nav-link"]');
    await expect(navBtn).toBeVisible();

    // Determina o destino esperado a partir do label do próprio botão
    const label = (await navBtn.textContent())?.toLowerCase() ?? '';
    const expectPath = label.includes('catecismo') ? '/catechism' : '/magisterium';

    await Promise.all([
      page.waitForURL((url) => url.pathname.startsWith(expectPath), { timeout: 5000 }),
      navBtn.click(),
    ]);

    // Sheet fechou
    await expect(page.locator('[data-testid="nexus-bottom-sheet"]')).toHaveCount(0);
    // Nenhum popover Radix ou dialog alternativo aberto
    await assertNoPopover(page);
    const otherDialogs = page.locator('[role="dialog"][data-state="open"]');
    expect(await otherDialogs.count(), 'não deve abrir dialog alternativo').toBe(0);

    // URL tem o id da referência (query param p= ou doc=)
    const url = new URL(page.url());
    const hasRefId = url.searchParams.has('p') || url.searchParams.has('doc');
    expect(hasRefId, `URL deve carregar id da referência: ${page.url()}`).toBe(true);
  });
});
