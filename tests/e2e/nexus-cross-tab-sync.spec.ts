/**
 * CAT-030 — Sincronização Nexus entre abas via evento `storage`.
 *
 * Abre a mesma rota em duas páginas do mesmo BrowserContext (compartilham
 * localStorage). Aciona uma mudança de estado na aba A e valida que a aba B
 * reflete a atualização em "tempo real" via evento `storage`.
 */
import { test, expect, type Page } from '@playwright/test';

const NEXUS_STATE_KEY = 'nexus:state:v1';
const ROUTE = '/catechism?p=1817';

async function openNexus(page: Page) {
  await page.goto(ROUTE, { waitUntil: 'domcontentloaded' });
  await page.waitForLoadState('networkidle', { timeout: 15_000 }).catch(() => {});
  const trigger = page
    .locator('[data-nexus-trigger], [data-tag-slug], button:has-text("Nexus")')
    .first();
  await expect(trigger, 'trigger do Nexus visível').toBeVisible({ timeout: 10_000 });
  await trigger.click();
  const dialog = page.locator('[role="dialog"][data-focus-mode]').first();
  await expect(dialog).toBeVisible({ timeout: 10_000 });
  return dialog;
}

test.describe('CAT-030 — Nexus cross-tab sync', () => {
  test('atualização de seção/focusMode em uma aba propaga para a outra', async ({ context }) => {
    const pageA = await context.newPage();
    const pageB = await context.newPage();

    const dialogA = await openNexus(pageA);
    const dialogB = await openNexus(pageB);

    // Snapshot do estado inicial persistido pela aba A.
    const initialRaw = await pageA.evaluate((k) => window.localStorage.getItem(k), NEXUS_STATE_KEY);
    expect(initialRaw, 'estado persistido em localStorage após abrir Nexus').not.toBeNull();
    const initial = JSON.parse(initialRaw!);

    // Aba A: alterna focus mode via atalho `f`.
    await dialogA.focus();
    await pageA.keyboard.press('f');
    await expect(dialogA).toHaveAttribute('data-focus-mode', 'true', { timeout: 5000 });

    // Simula o evento `storage` na aba B escrevendo em localStorage a partir dela
    // (o handler do NexusBubbles ouve `window.addEventListener('storage', ...)`,
    // que só dispara em OUTRAS abas quando a origem escreve). Como as duas abas
    // são páginas Playwright separadas, o setItem em A já dispara o evento em B.
    await pageB.waitForFunction(
      (attr) => {
        const el = document.querySelector('[role="dialog"][data-focus-mode]');
        return el?.getAttribute('data-focus-mode') === attr;
      },
      'true',
      { timeout: 5000 },
    );
    await expect(dialogB, 'aba B reflete focus mode ligado').toHaveAttribute('data-focus-mode', 'true');

    // Aba A: navega para a próxima seção via atalho `]`.
    const sectionsA = await pageA.locator('[data-testid="nexus-active-section"]').count();
    if (sectionsA > 0) {
      const initialKindA = await pageA
        .locator('[data-testid="nexus-active-section"]')
        .first()
        .getAttribute('data-section-kind');

      await pageA.keyboard.press(']');
      await pageA.waitForTimeout(400);

      await pageB.waitForFunction(
        (prev) => {
          const el = document.querySelector('[data-testid="nexus-active-section"]');
          const kind = el?.getAttribute('data-section-kind');
          return !!kind && kind !== prev;
        },
        initialKindA,
        { timeout: 5000 },
      );

      const kindA = await pageA
        .locator('[data-testid="nexus-active-section"]')
        .first()
        .getAttribute('data-section-kind');
      const kindB = await pageB
        .locator('[data-testid="nexus-active-section"]')
        .first()
        .getAttribute('data-section-kind');
      expect(kindB, 'aba B espelha seção ativa da aba A').toBe(kindA);
    }

    // Estado final persistido tem tag atual e reflete focus mode.
    const finalRaw = await pageA.evaluate((k) => window.localStorage.getItem(k), NEXUS_STATE_KEY);
    const finalState = JSON.parse(finalRaw!);
    expect(finalState.focusMode).toBe(true);
    expect(finalState.tagId ?? finalState.tagSlug).toBeTruthy();
    expect(initial.focusMode ?? false).toBe(false);
  });
});
