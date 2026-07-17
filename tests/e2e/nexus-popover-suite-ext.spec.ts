import { test, expect, type Page, type Locator } from '@playwright/test';

/**
 * Extensões da suíte do Popover Nexus:
 *   A) Snapshots em dark mode (mobile/desktop × clique/teclado).
 *   B) Navegação por teclado dentro do popover (Tab + Enter) navega e fecha.
 *   C) Escape e clique fora devolvem o foco ao card/trigger.
 *   D) Scroll da página mantém o popover ancorado ao trigger e dentro do viewport.
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

async function enableDarkMode(page: Page) {
  await page.evaluate(() => {
    document.documentElement.classList.add('dark');
  });
  // Aguarda o repaint com a nova paleta.
  await page.waitForTimeout(150);
}

// ---------------------------------------------------------------------------
// A) Snapshot dark mode
// ---------------------------------------------------------------------------
for (const preset of [
  { name: 'mobile', viewport: { width: 390, height: 844 } },
  { name: 'desktop', viewport: { width: 1280, height: 900 } },
] as const) {
  test.describe(`Popover Nexus — dark mode ${preset.name}`, () => {
    test.use({ viewport: preset.viewport, colorScheme: 'dark' });

    test(`snapshot (clique) — dark ${preset.name}`, async ({ page }) => {
      const card = await findChapterWithCard(page);
      test.skip(!card, 'Nenhum capítulo candidato tinha conexões Nexus.');
      if (!card) return;
      await enableDarkMode(page);
      await card.click();
      const popover = page.locator('[data-testid="nexus-connection-popover"]');
      await expect(popover).toBeVisible({ timeout: 3000 });
      await page.waitForTimeout(250);
      await expect(popover).toHaveScreenshot(`nexus-popover-dark-click-${preset.name}.png`, {
        maxDiffPixelRatio: 0.02,
        animations: 'disabled',
      });
    });

    test(`snapshot (teclado) — dark ${preset.name}`, async ({ page }) => {
      const card = await findChapterWithCard(page);
      test.skip(!card, 'Nenhum capítulo candidato tinha conexões Nexus.');
      if (!card) return;
      await enableDarkMode(page);
      await card.focus();
      await page.keyboard.press('Enter');
      const popover = page.locator('[data-testid="nexus-connection-popover"]');
      await expect(popover).toBeVisible({ timeout: 3000 });
      await page.waitForTimeout(250);
      await expect(popover).toHaveScreenshot(`nexus-popover-dark-kbd-${preset.name}.png`, {
        maxDiffPixelRatio: 0.02,
        animations: 'disabled',
      });
    });
  });
}

// ---------------------------------------------------------------------------
// B) Navegação por teclado dentro do popover
// ---------------------------------------------------------------------------
test.describe('Popover Nexus — navegação só teclado', () => {
  test.use({ viewport: { width: 1280, height: 900 } });

  test('Tab até o botão de navegação + Enter fecha o popover e navega', async ({ page }) => {
    const card = await findChapterWithCard(page);
    test.skip(!card, 'Nenhum capítulo candidato tinha conexões Nexus.');
    if (!card) return;

    await card.focus();
    await page.keyboard.press('Enter');
    const popover = page.locator('[data-testid="nexus-connection-popover"]');
    await expect(popover).toBeVisible({ timeout: 3000 });

    // Tabula até chegar no botão "Abrir referência" dentro do popover, sem sair dele.
    const navBtn = popover.locator('[data-testid="nexus-popover-nav-link"]');
    let reached = false;
    for (let i = 0; i < 10; i++) {
      const focused = await page.evaluate(
        () => (document.activeElement as HTMLElement | null)?.getAttribute('data-testid') || ''
      );
      if (focused === 'nexus-popover-nav-link') { reached = true; break; }
      await page.keyboard.press('Tab');
    }
    expect(reached, 'Tab deve alcançar nexus-popover-nav-link em até 10 saltos').toBe(true);
    await expect(navBtn).toBeFocused();

    const beforeUrl = page.url();
    await Promise.all([
      page.waitForURL((u) => u.toString() !== beforeUrl, { timeout: 5000 }),
      page.keyboard.press('Enter'),
    ]);

    // Popover fechou e nenhum modal alternativo apareceu.
    await expect(page.locator('[data-testid="nexus-connection-popover"]')).toHaveCount(0);
    const otherDialogs = page.locator('[role="dialog"][data-state="open"]');
    expect(await otherDialogs.count()).toBe(0);
  });

  test('Space também ativa o botão de navegação dentro do popover', async ({ page }) => {
    const card = await findChapterWithCard(page);
    test.skip(!card, 'Nenhum capítulo candidato tinha conexões Nexus.');
    if (!card) return;

    await card.focus();
    await page.keyboard.press('Enter');
    const popover = page.locator('[data-testid="nexus-connection-popover"]');
    await expect(popover).toBeVisible({ timeout: 3000 });

    const navBtn = popover.locator('[data-testid="nexus-popover-nav-link"]');
    await navBtn.focus();
    await expect(navBtn).toBeFocused();

    const beforeUrl = page.url();
    await Promise.all([
      page.waitForURL((u) => u.toString() !== beforeUrl, { timeout: 5000 }),
      page.keyboard.press('Space'),
    ]);
    await expect(page.locator('[data-testid="nexus-connection-popover"]')).toHaveCount(0);
  });
});

// ---------------------------------------------------------------------------
// C) Foco volta ao trigger ao fechar
// ---------------------------------------------------------------------------
test.describe('Popover Nexus — retorno de foco', () => {
  test.use({ viewport: { width: 1280, height: 900 } });

  test('Escape devolve foco ao card que abriu o popover', async ({ page }) => {
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

  test('clique fora devolve foco ao card que abriu o popover', async ({ page }) => {
    const card = await findChapterWithCard(page);
    test.skip(!card, 'Nenhum capítulo candidato tinha conexões Nexus.');
    if (!card) return;

    await card.click();
    const popover = page.locator('[data-testid="nexus-connection-popover"]');
    await expect(popover).toBeVisible({ timeout: 3000 });

    // Clica num ponto fora do popover e fora do card (canto superior esquerdo).
    await page.mouse.click(4, 4);

    await expect(popover).toBeHidden({ timeout: 2000 });
    // Radix devolve o foco ao trigger que abriu o popover.
    await expect(card).toBeFocused();
  });
});

// ---------------------------------------------------------------------------
// D) Scroll da página mantém popover ancorado
// ---------------------------------------------------------------------------
test.describe('Popover Nexus — ancoragem sob scroll', () => {
  test.use({ viewport: { width: 1280, height: 900 } });

  test('rolar a página mantém popover próximo do trigger e dentro do viewport', async ({ page }) => {
    const card = await findChapterWithCard(page);
    test.skip(!card, 'Nenhum capítulo candidato tinha conexões Nexus.');
    if (!card) return;

    await card.click();
    const popover = page.locator('[data-testid="nexus-connection-popover"]');
    await expect(popover).toBeVisible({ timeout: 3000 });
    await page.waitForTimeout(200);

    const viewport = page.viewportSize()!;
    const MAX_DIST = 460;

    const measure = async () => {
      const cardBox = await card.boundingBox();
      const popBox = await popover.boundingBox();
      return { cardBox, popBox };
    };

    // Baseline: popover está ancorado ao card.
    const base = await measure();
    expect(base.cardBox && base.popBox).toBeTruthy();
    if (!base.cardBox || !base.popBox) return;

    for (const dy of [150, 300, 600]) {
      await page.evaluate((y) => window.scrollBy(0, y), dy);
      await page.waitForTimeout(200);

      // Se o scroll empurrou o card para fora, o popover pode ter fechado —
      // nesse caso o teste é considerado neutro para essa iteração.
      if (!(await popover.isVisible())) break;

      const { cardBox, popBox } = await measure();
      expect(popBox, 'popover mantém bounding box').not.toBeNull();
      if (!popBox || !cardBox) break;

      const cardCenter = { x: cardBox.x + cardBox.width / 2, y: cardBox.y + cardBox.height / 2 };
      const popCenter = { x: popBox.x + popBox.width / 2, y: popBox.y + popBox.height / 2 };

      expect(
        Math.abs(popCenter.x - cardCenter.x),
        `dx (scroll +${dy}) trigger vs popover`
      ).toBeLessThanOrEqual(MAX_DIST);
      expect(
        Math.abs(popCenter.y - cardCenter.y),
        `dy (scroll +${dy}) trigger vs popover`
      ).toBeLessThanOrEqual(MAX_DIST);

      // Continua dentro do viewport.
      expect(popBox.x, `popover não sai pela esquerda (scroll +${dy})`).toBeGreaterThanOrEqual(-2);
      expect(popBox.y, `popover não sai pelo topo (scroll +${dy})`).toBeGreaterThanOrEqual(-2);
      expect(popBox.x + popBox.width, `popover não sai pela direita (scroll +${dy})`).toBeLessThanOrEqual(viewport.width + 2);
      expect(popBox.y + popBox.height, `popover não sai pelo rodapé (scroll +${dy})`).toBeLessThanOrEqual(viewport.height + 2);
    }
  });
});
