import { test, expect, type Page, type Locator } from '@playwright/test';

/**
 * Suíte completa do Popover Nexus (substituto do antigo bottom-sheet):
 *
 *  A) Scroll do body NÃO é bloqueado quando o popover está aberto.
 *  B) ARIA/role corretos (role=dialog + aria-labelledby/aria-describedby).
 *  C) Clique no link de navegação fecha o popover e navega para a rota certa.
 *  D) Snapshot visual (mobile + desktop, aberto via clique e via teclado).
 *  E) Âncora: PopoverContent fica próximo ao trigger e dentro da viewport.
 *  F) Abre ancorado (não é modal fullscreen) e fecha ao Escape.
 *  G) CIC sem conteúdo no banco → mensagem de indexação + link funciona.
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

async function findCatechismCard(page: Page): Promise<Locator | null> {
  for (const path of CANDIDATE_CHAPTERS) {
    await page.goto(path, { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('networkidle').catch(() => { /* noop */ });
    // O botão do card do CIC tem aria-label começando com "Catecismo:".
    const card = page.locator('[data-testid="nexus-connection-card"][aria-label^="Catecismo:"]').first();
    if ((await card.count()) === 0) continue;
    await card.scrollIntoViewIfNeeded().catch(() => { /* noop */ });
    if (await card.isVisible()) return card;
  }
  return null;
}

// ---------------------------------------------------------------------------
// A) Scroll do body
// ---------------------------------------------------------------------------
test.describe('Popover Nexus — scroll do body', () => {
  test.use({ viewport: { width: 1280, height: 900 } });

  test('body continua rolável quando o popover está aberto', async ({ page }) => {
    const card = await findChapterWithCard(page);
    test.skip(!card, 'Nenhum capítulo candidato tinha conexões Nexus.');
    if (!card) return;

    await card.click();
    await expect(page.locator('[data-testid="nexus-connection-popover"]')).toBeVisible({ timeout: 3000 });

    // Nenhuma classe de scroll-lock do Radix/shadcn deve estar aplicada.
    const bodyStyles = await page.evaluate(() => {
      const b = document.body;
      const h = document.documentElement;
      return {
        bodyOverflow: getComputedStyle(b).overflow,
        htmlOverflow: getComputedStyle(h).overflow,
        bodyPosition: getComputedStyle(b).position,
        dataScrollLocked: b.getAttribute('data-scroll-locked'),
      };
    });
    expect(bodyStyles.bodyOverflow, 'body.overflow não pode ser hidden').not.toBe('hidden');
    expect(bodyStyles.htmlOverflow, 'html.overflow não pode ser hidden').not.toBe('hidden');
    expect(bodyStyles.bodyPosition, 'body.position não pode ser fixed').not.toBe('fixed');
    expect(bodyStyles.dataScrollLocked, 'body não pode ter data-scroll-locked').toBeNull();

    // Scroll efetivo deve mover a página.
    const y1 = await page.evaluate(() => window.scrollY);
    await page.evaluate(() => window.scrollBy(0, 400));
    await page.waitForTimeout(120);
    const y2 = await page.evaluate(() => window.scrollY);
    expect(y2 - y1, 'window.scrollY deve avançar após scrollBy').toBeGreaterThan(100);
  });
});

// ---------------------------------------------------------------------------
// B) ARIA
// ---------------------------------------------------------------------------
test.describe('Popover Nexus — ARIA', () => {
  test.use({ viewport: { width: 1280, height: 900 } });

  test('role=dialog e aria-labelledby/describedby apontam para elementos existentes', async ({ page }) => {
    const card = await findChapterWithCard(page);
    test.skip(!card, 'Nenhum capítulo candidato tinha conexões Nexus.');
    if (!card) return;

    await card.click();
    const popover = page.locator('[data-testid="nexus-connection-popover"]');
    await expect(popover).toBeVisible({ timeout: 3000 });

    await expect(popover).toHaveAttribute('role', 'dialog');
    const labelledby = await popover.getAttribute('aria-labelledby');
    const describedby = await popover.getAttribute('aria-describedby');
    expect(labelledby, 'aria-labelledby definido').toBeTruthy();
    expect(describedby, 'aria-describedby definido').toBeTruthy();

    // Os ids devem existir e ter conteúdo textual não-vazio.
    const titleText = await page.locator(`#${labelledby}`).textContent();
    const descText = await page.locator(`#${describedby}`).textContent();
    expect(titleText?.trim().length ?? 0, 'título referenciado deve ter texto').toBeGreaterThan(0);
    expect(descText?.trim().length ?? 0, 'descrição referenciada deve ter texto').toBeGreaterThan(0);
  });
});

// ---------------------------------------------------------------------------
// C) Navegação
// ---------------------------------------------------------------------------
test.describe('Popover Nexus — navegação pela referência', () => {
  test.use({ viewport: { width: 1280, height: 900 } });

  test('clicar no botão "Abrir referência" navega e fecha popover, sem modal alternativo', async ({ page }) => {
    const card = await findChapterWithCard(page);
    test.skip(!card, 'Nenhum capítulo candidato tinha conexões Nexus.');
    if (!card) return;

    await card.click();
    const popover = page.locator('[data-testid="nexus-connection-popover"]');
    await expect(popover).toBeVisible({ timeout: 3000 });

    const navBtn = popover.locator('[data-testid="nexus-popover-nav-link"]');
    await expect(navBtn).toBeVisible();

    const beforeUrl = page.url();
    await Promise.all([
      page.waitForURL((u) => u.toString() !== beforeUrl, { timeout: 5000 }),
      navBtn.click(),
    ]);

    // Popover fechou
    await expect(page.locator('[data-testid="nexus-connection-popover"]')).toHaveCount(0);
    // URL mudou para uma rota de referência conhecida
    const url = new URL(page.url());
    const isKnownRef =
      url.pathname.startsWith('/catechism') ||
      url.pathname.startsWith('/magisterium') ||
      url.pathname.startsWith('/bible');
    expect(isKnownRef, `URL destino não reconhecido: ${page.url()}`).toBe(true);

    // Sem dialog ou popover alternativo aberto
    const otherDialogs = page.locator('[role="dialog"][data-state="open"]');
    expect(await otherDialogs.count()).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// D) Snapshot visual (clique + teclado, mobile + desktop)
// ---------------------------------------------------------------------------
for (const preset of [
  { name: 'mobile', viewport: { width: 390, height: 844 } },
  { name: 'desktop', viewport: { width: 1280, height: 900 } },
] as const) {
  test.describe(`Popover Nexus — snapshot ${preset.name}`, () => {
    test.use({ viewport: preset.viewport });

    test(`aberto por clique — ${preset.name}`, async ({ page }) => {
      const card = await findChapterWithCard(page);
      test.skip(!card, 'Nenhum capítulo candidato tinha conexões Nexus.');
      if (!card) return;
      await card.click();
      const popover = page.locator('[data-testid="nexus-connection-popover"]');
      await expect(popover).toBeVisible({ timeout: 3000 });
      await page.waitForTimeout(250);
      await expect(popover).toHaveScreenshot(`nexus-popover-click-${preset.name}.png`, {
        maxDiffPixelRatio: 0.02,
        animations: 'disabled',
      });
    });

    test(`aberto por teclado (Enter) — ${preset.name}`, async ({ page }) => {
      const card = await findChapterWithCard(page);
      test.skip(!card, 'Nenhum capítulo candidato tinha conexões Nexus.');
      if (!card) return;
      await card.focus();
      await page.keyboard.press('Enter');
      const popover = page.locator('[data-testid="nexus-connection-popover"]');
      await expect(popover).toBeVisible({ timeout: 3000 });
      await page.waitForTimeout(250);
      await expect(popover).toHaveScreenshot(`nexus-popover-kbd-${preset.name}.png`, {
        maxDiffPixelRatio: 0.02,
        animations: 'disabled',
      });
    });
  });
}

// ---------------------------------------------------------------------------
// E) Âncora (mobile + desktop)
// ---------------------------------------------------------------------------
const MAX_ANCHOR_DIST_PX = 420;
for (const preset of [
  { name: 'mobile-360', viewport: { width: 360, height: 780 } },
  { name: 'mobile-390', viewport: { width: 390, height: 844 } },
  { name: 'desktop-1280', viewport: { width: 1280, height: 900 } },
  { name: 'desktop-1920', viewport: { width: 1920, height: 1080 } },
] as const) {
  test.describe(`Popover Nexus — âncora ${preset.name}`, () => {
    test.use({ viewport: preset.viewport });

    test(`fica próximo do card e dentro do viewport — ${preset.name}`, async ({ page }) => {
      const card = await findChapterWithCard(page);
      test.skip(!card, 'Nenhum capítulo candidato tinha conexões Nexus.');
      if (!card) return;
      await card.click();
      const popover = page.locator('[data-testid="nexus-connection-popover"]');
      await expect(popover).toBeVisible({ timeout: 3000 });
      await page.waitForTimeout(200);

      const cardBox = await card.boundingBox();
      const popBox = await popover.boundingBox();
      const viewport = page.viewportSize()!;
      expect(cardBox && popBox).toBeTruthy();
      if (!cardBox || !popBox) return;

      const cardCenter = { x: cardBox.x + cardBox.width / 2, y: cardBox.y + cardBox.height / 2 };
      const popCenter = { x: popBox.x + popBox.width / 2, y: popBox.y + popBox.height / 2 };
      expect(Math.abs(popCenter.x - cardCenter.x), 'dx trigger vs popover').toBeLessThanOrEqual(MAX_ANCHOR_DIST_PX);
      expect(Math.abs(popCenter.y - cardCenter.y), 'dy trigger vs popover').toBeLessThanOrEqual(MAX_ANCHOR_DIST_PX);

      // Dentro do viewport (com pequena tolerância).
      expect(popBox.x, 'popover não pode sair pela esquerda').toBeGreaterThanOrEqual(-2);
      expect(popBox.y, 'popover não pode sair pelo topo').toBeGreaterThanOrEqual(-2);
      expect(popBox.x + popBox.width, 'popover não pode sair pela direita').toBeLessThanOrEqual(viewport.width + 2);
      expect(popBox.y + popBox.height, 'popover não pode sair pelo rodapé').toBeLessThanOrEqual(viewport.height + 2);

      // Não pode virar modal fullscreen.
      expect(popBox.width, 'popover não deve ocupar 100% da largura').toBeLessThanOrEqual(viewport.width * 0.95);
    });
  });
}

// ---------------------------------------------------------------------------
// F) Ancorado (não é modal) + Escape fecha
// ---------------------------------------------------------------------------
test.describe('Popover Nexus — ancorado + Escape', () => {
  test.use({ viewport: { width: 1280, height: 900 } });

  test('abre ancorado ao trigger (não modal) e Escape fecha', async ({ page }) => {
    const card = await findChapterWithCard(page);
    test.skip(!card, 'Nenhum capítulo candidato tinha conexões Nexus.');
    if (!card) return;

    await card.click();
    const popover = page.locator('[data-testid="nexus-connection-popover"]');
    await expect(popover).toBeVisible({ timeout: 3000 });

    // Não é modal fullscreen
    const viewport = page.viewportSize()!;
    const box = await popover.boundingBox();
    expect(box).not.toBeNull();
    if (!box) return;
    expect(box.width, 'não ocupa largura toda').toBeLessThanOrEqual(viewport.width * 0.95);
    expect(box.height, 'não ocupa altura toda').toBeLessThanOrEqual(viewport.height * 0.95);

    // Nenhum <dialog> aberto no lugar
    const nativeDialog = page.locator('dialog[open]');
    expect(await nativeDialog.count()).toBe(0);

    // Escape fecha
    await page.keyboard.press('Escape');
    await expect(popover).toBeHidden({ timeout: 2000 });
    await expect(popover).toHaveCount(0);
  });
});

// ---------------------------------------------------------------------------
// G) CIC sem conteúdo → fallback + link
// ---------------------------------------------------------------------------
test.describe('Popover Nexus — CIC sem conteúdo', () => {
  test.use({ viewport: { width: 1280, height: 900 } });

  test('mostra mensagem de indexação e link "Abrir §N no Catecismo" funciona', async ({ page }) => {
    const card = await findCatechismCard(page);
    test.skip(!card, 'Nenhum capítulo candidato tinha card do tipo catechism.');
    if (!card) return;

    await card.click();
    const popover = page.locator('[data-testid="nexus-connection-popover"]');
    await expect(popover).toBeVisible({ timeout: 3000 });

    // Aguarda a query do CIC resolver (loading skeleton some).
    await page.waitForTimeout(1500);

    const empty = popover.locator('[data-testid="catechism-preview-empty"]');
    // Só valida o fallback se o parágrafo mockado realmente estiver ausente do banco;
    // se estiver presente, o teste é neutro (skip).
    test.skip((await empty.count()) === 0, 'Parágrafo mockado já está indexado; fallback não é exercitado.');

    const message = popover.locator('[data-testid="catechism-preview-empty-message"]');
    await expect(message).toContainText(/não indexado/i);

    const link = popover.locator('[data-testid="catechism-preview-empty-link"]');
    await expect(link).toBeVisible();
    const href = await link.getAttribute('href');
    expect(href, 'link deve apontar para /catechism?p=').toMatch(/^\/catechism\?p=\d+$/);

    await Promise.all([
      page.waitForURL(/\/catechism\?p=\d+/, { timeout: 5000 }),
      link.click(),
    ]);
    expect(page.url()).toMatch(/\/catechism\?p=\d+/);
  });
});
