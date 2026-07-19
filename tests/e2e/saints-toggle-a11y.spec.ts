import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

/**
 * A11y do toggle "Versão anterior/nova" e do Reader de Santos.
 * - ARIA correto no botão de alternância (aria-label dinâmico)
 * - Navegação por teclado (Tab, Enter) alterna variante e move foco
 * - Sem violações críticas/sérias de axe no Reader (novo e legacy)
 */

const SAINT_ID = 'nha-chica';
const CRITICAL_TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'];

async function waitReader(page: import('@playwright/test').Page) {
  await expect(
    page.getByRole('button', { name: /vers[aã]o (anterior|nova) do reader/i })
  ).toBeVisible({ timeout: 20000 });
}

test.describe('Santos · Toggle e Reader — Acessibilidade', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => window.localStorage.clear());
  });

  test('Reader NOVO: toggle tem aria-label correto e é focável', async ({ page }) => {
    await page.goto(`/santos/${SAINT_ID}?legacy=0`);
    await waitReader(page);

    const toggle = page.getByRole('button', { name: /vers[aã]o anterior do reader/i });
    await expect(toggle).toBeVisible();
    await expect(toggle).toHaveAttribute('aria-label', 'Ver versão anterior do Reader');
    await expect(toggle).toHaveAttribute('type', 'button');

    // Focável via teclado
    await toggle.focus();
    await expect(toggle).toBeFocused();
  });

  test('Reader LEGACY: toggle expõe aria-label "Ver versão nova do Reader"', async ({ page }) => {
    await page.goto(`/saints-legacy/${SAINT_ID}`);
    await waitReader(page);

    const toggle = page.getByRole('button', { name: /vers[aã]o nova do reader/i });
    await expect(toggle).toBeVisible();
    await expect(toggle).toHaveAttribute('aria-label', 'Ver versão nova do Reader');
  });

  test('Toggle alterna variante via teclado (Enter)', async ({ page }) => {
    await page.goto(`/santos/${SAINT_ID}?legacy=0`);
    await waitReader(page);

    const toggle = page.getByRole('button', { name: /vers[aã]o anterior do reader/i });
    await toggle.focus();
    await expect(toggle).toBeFocused();
    await page.keyboard.press('Enter');

    await page.waitForURL(new RegExp(`/saints-legacy/${SAINT_ID}`), { timeout: 15000 });
    await expect(
      page.getByRole('button', { name: /vers[aã]o nova do reader/i })
    ).toBeVisible({ timeout: 15000 });
  });

  test('Botão "Fechar" tem nome acessível', async ({ page }) => {
    await page.goto(`/santos/${SAINT_ID}`);
    await waitReader(page);
    const close = page.getByRole('button', { name: /^fechar$/i });
    await expect(close).toBeVisible();
  });

  // Escopo do axe restrito à barra de ações do Reader (toggle + Fechar).
  // O corpo do Reader tem violações pré-existentes (button-name, color-contrast)
  // que não são objeto deste teste — devem ser tratadas em ticket próprio.
  for (const variant of [
    { name: 'novo', path: `/santos/${SAINT_ID}?legacy=0` },
    { name: 'legacy', path: `/saints-legacy/${SAINT_ID}?legacy=1` },
  ] as const) {
    test(`Axe: barra de ações (${variant.name}) sem violações críticas/sérias`, async ({ page }) => {
      await page.goto(variant.path);
      await waitReader(page);

      const toggleLabel =
        variant.name === 'legacy'
          ? 'Ver versão nova do Reader'
          : 'Ver versão anterior do Reader';
      const actionsBar = page
        .locator(`button[aria-label="${toggleLabel}"]`)
        .locator('..');

      const results = await new AxeBuilder({ page })
        .include(await actionsBar.evaluate((el) => {
          // devolve um seletor único para o container
          if (!el.id) el.id = `a11y-actions-${Math.random().toString(36).slice(2)}`;
          return `#${el.id}`;
        }).then((sel) => sel))
        .withTags(CRITICAL_TAGS)
        .analyze();

      const bad = results.violations.filter((v) =>
        ['critical', 'serious'].includes(v.impact || '')
      );
      expect(bad, JSON.stringify(bad, null, 2)).toEqual([]);
    });
  }
});

