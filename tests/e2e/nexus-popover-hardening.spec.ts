import { test, expect, type Page, type Locator } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

/**
 * "Hardening" do Popover Nexus:
 *   A) Snapshots com threshold explícito (Playwright grava diff em test-results/ no CI).
 *   B) Abrir/fechar rapidamente (Enter/Escape em sequência) não duplica DOM,
 *      não gera erro de console e o foco volta ao card correto.
 *   C) Popover NÃO prende foco (Radix Popover, ao contrário de Dialog, não é modal
 *      por padrão) — Tab tem que conseguir escapar do popover.
 *   D) axe-core não pode reportar violações críticas no popover aberto por
 *      teclado, nem depois de fechar com Escape.
 *   E) High Contrast (data-nexus-contrast="high" no <html>) — snapshot mobile/desktop
 *      aberto por clique e por teclado.
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

async function enableHighContrast(page: Page) {
  await page.evaluate(() => {
    document.documentElement.setAttribute('data-nexus-contrast', 'high');
    try {
      window.localStorage.setItem('cathedra:nexus-high-contrast', '1');
    } catch { /* ignore */ }
  });
  await page.waitForTimeout(150);
}

// ---------------------------------------------------------------------------
// A) Snapshots com threshold — os diffs saem em test-results/ no CI
// ---------------------------------------------------------------------------
test.describe('Nexus popover — snapshot CI (threshold + diffs)', () => {
  for (const preset of [
    { name: 'mobile', viewport: { width: 390, height: 844 } },
    { name: 'desktop', viewport: { width: 1280, height: 900 } },
  ] as const) {
    test.describe(preset.name, () => {
      test.use({ viewport: preset.viewport });
      test(`snapshot com threshold — ${preset.name}`, async ({ page }) => {
        const card = await findChapterWithCard(page);
        test.skip(!card, 'Nenhum capítulo candidato tinha conexões Nexus.');
        if (!card) return;
        await card.click();
        const popover = page.locator('[data-testid="nexus-connection-popover"]');
        await expect(popover).toBeVisible({ timeout: 3000 });
        await page.waitForTimeout(250);
        await expect(popover).toHaveScreenshot(`nexus-popover-ci-${preset.name}.png`, {
          maxDiffPixelRatio: 0.015,
          threshold: 0.2,
          animations: 'disabled',
        });
      });
    });
  }
});

// ---------------------------------------------------------------------------
// B) Abrir/fechar rapidamente
// ---------------------------------------------------------------------------
test.describe('Nexus popover — abrir/fechar rápido', () => {
  test.use({ viewport: { width: 1280, height: 900 } });

  test('10× Enter/Escape em sequência não duplica DOM, não gera erro e mantém foco no trigger', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (err) => errors.push(String(err)));
    page.on('console', (msg) => {
      if (msg.type() === 'error') errors.push(msg.text());
    });

    const card = await findChapterWithCard(page);
    test.skip(!card, 'Nenhum capítulo candidato tinha conexões Nexus.');
    if (!card) return;

    await card.focus();

    for (let i = 0; i < 10; i++) {
      await page.keyboard.press('Enter');
      const popover = page.locator('[data-testid="nexus-connection-popover"]');
      await expect(popover, `iteração ${i}: popover deve abrir`).toBeVisible({ timeout: 3000 });
      // Só um popover no DOM
      expect(await page.locator('[data-testid="nexus-connection-popover"]').count(), `iteração ${i}: sem duplicação`).toBe(1);
      await page.keyboard.press('Escape');
      await expect(popover, `iteração ${i}: popover deve fechar`).toBeHidden({ timeout: 2000 });
      // Foco volta ao card que abriu
      await expect(card, `iteração ${i}: foco deve retornar ao card`).toBeFocused();
    }

    // Nenhum popover residual e nenhum erro grave.
    expect(await page.locator('[data-testid="nexus-connection-popover"]').count()).toBe(0);
    const relevantErrors = errors.filter((e) => !/ResizeObserver|hydration|Warning/i.test(e));
    expect(relevantErrors, `erros de console/pageerror: ${relevantErrors.join(' | ')}`).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// C) Não há focus trap
// ---------------------------------------------------------------------------
test.describe('Nexus popover — sem focus trap', () => {
  test.use({ viewport: { width: 1280, height: 900 } });

  test('Tab dentro do popover eventualmente sai para o próximo elemento da página', async ({ page }) => {
    const card = await findChapterWithCard(page);
    test.skip(!card, 'Nenhum capítulo candidato tinha conexões Nexus.');
    if (!card) return;

    await card.click();
    const popover = page.locator('[data-testid="nexus-connection-popover"]');
    await expect(popover).toBeVisible({ timeout: 3000 });

    // Popover é ancorado, NÃO modal — Tab deve escapar em algum momento.
    let escaped = false;
    for (let i = 0; i < 20; i++) {
      await page.keyboard.press('Tab');
      const outside = await page.evaluate(() => {
        const pop = document.querySelector('[data-testid="nexus-connection-popover"]');
        const active = document.activeElement;
        if (!pop || !active) return true;
        return !pop.contains(active);
      });
      if (outside) { escaped = true; break; }
    }
    expect(escaped, 'Tab deve conseguir sair do popover (sem focus trap)').toBe(true);
  });
});

// ---------------------------------------------------------------------------
// D) axe-core
// ---------------------------------------------------------------------------
test.describe('Nexus popover — axe-core', () => {
  test.use({ viewport: { width: 1280, height: 900 } });

  test('sem violações críticas com popover aberto por teclado', async ({ page }) => {
    const card = await findChapterWithCard(page);
    test.skip(!card, 'Nenhum capítulo candidato tinha conexões Nexus.');
    if (!card) return;

    await card.focus();
    await page.keyboard.press('Enter');
    const popover = page.locator('[data-testid="nexus-connection-popover"]');
    await expect(popover).toBeVisible({ timeout: 3000 });

    const results = await new AxeBuilder({ page })
      .include('[data-testid="nexus-connection-popover"]')
      .withTags(['wcag2a', 'wcag2aa'])
      .analyze();

    const critical = results.violations.filter((v) => v.impact === 'critical' || v.impact === 'serious');
    expect(
      critical,
      `violações críticas/sérias no popover:\n${critical.map((v) => `- ${v.id}: ${v.description}`).join('\n')}`
    ).toHaveLength(0);
  });

  test('sem violações críticas após fechar com Escape', async ({ page }) => {
    const card = await findChapterWithCard(page);
    test.skip(!card, 'Nenhum capítulo candidato tinha conexões Nexus.');
    if (!card) return;

    await card.focus();
    await page.keyboard.press('Enter');
    await expect(page.locator('[data-testid="nexus-connection-popover"]')).toBeVisible({ timeout: 3000 });
    await page.keyboard.press('Escape');
    await expect(page.locator('[data-testid="nexus-connection-popover"]')).toBeHidden({ timeout: 2000 });

    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa'])
      .analyze();
    const critical = results.violations.filter((v) => v.impact === 'critical');
    expect(
      critical,
      `violações críticas pós-fechamento:\n${critical.map((v) => `- ${v.id}: ${v.description}`).join('\n')}`
    ).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// E) High Contrast — snapshots
// ---------------------------------------------------------------------------
for (const preset of [
  { name: 'mobile', viewport: { width: 390, height: 844 } },
  { name: 'desktop', viewport: { width: 1280, height: 900 } },
] as const) {
  test.describe(`Nexus popover — high contrast ${preset.name}`, () => {
    test.use({ viewport: preset.viewport });

    test(`snapshot (clique) — hc ${preset.name}`, async ({ page }) => {
      const card = await findChapterWithCard(page);
      test.skip(!card, 'Nenhum capítulo candidato tinha conexões Nexus.');
      if (!card) return;
      await enableHighContrast(page);
      await card.click();
      const popover = page.locator('[data-testid="nexus-connection-popover"]');
      await expect(popover).toBeVisible({ timeout: 3000 });
      await page.waitForTimeout(250);
      await expect(popover).toHaveScreenshot(`nexus-popover-hc-click-${preset.name}.png`, {
        maxDiffPixelRatio: 0.02,
        threshold: 0.2,
        animations: 'disabled',
      });
    });

    test(`snapshot (teclado) — hc ${preset.name}`, async ({ page }) => {
      const card = await findChapterWithCard(page);
      test.skip(!card, 'Nenhum capítulo candidato tinha conexões Nexus.');
      if (!card) return;
      await enableHighContrast(page);
      await card.focus();
      await page.keyboard.press('Enter');
      const popover = page.locator('[data-testid="nexus-connection-popover"]');
      await expect(popover).toBeVisible({ timeout: 3000 });
      await page.waitForTimeout(250);
      await expect(popover).toHaveScreenshot(`nexus-popover-hc-kbd-${preset.name}.png`, {
        maxDiffPixelRatio: 0.02,
        threshold: 0.2,
        animations: 'disabled',
      });
    });
  });
}
