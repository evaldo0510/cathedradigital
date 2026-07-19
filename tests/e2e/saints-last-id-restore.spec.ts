import { test, expect } from '@playwright/test';

const SAINT_ID = 'nha-chica';
const VARIANT_KEY = 'cathedra:saints:reader-variant';
const LAST_ID_KEY = 'cathedra:saints:last-id';

test.describe('Santos - restauração do último santo aberto (last-id + variant)', () => {
  test.beforeEach(async ({ context }) => {
    await context.clearCookies();
  });

  test('salva last-id ao abrir /santos/:id e restaura em /santos após refresh', async ({ page }) => {
    await page.addInitScript(() => window.localStorage.clear());
    await page.goto(`/santos/${SAINT_ID}`);
    await page.waitForURL(new RegExp(`/santos/${SAINT_ID}`), { timeout: 15000 });

    const stored = await page.evaluate((k) => localStorage.getItem(k), LAST_ID_KEY);
    expect(stored).toBe(SAINT_ID);

    // Ir para a lista sem id e confirmar redirecionamento para o último santo
    await page.goto('/santos');
    await page.waitForURL(new RegExp(`/santos/${SAINT_ID}(?!.*saints-legacy)`), { timeout: 15000 });
    expect(page.url()).toContain(`/santos/${SAINT_ID}`);
    expect(page.url()).not.toContain('/saints-legacy/');
  });

  test('após refresh em /santos/:id mantém a mesma rota e last-id', async ({ page }) => {
    await page.addInitScript(() => window.localStorage.clear());
    await page.goto(`/santos/${SAINT_ID}`);
    await page.waitForURL(new RegExp(`/santos/${SAINT_ID}`), { timeout: 15000 });

    await page.reload();
    await page.waitForURL(new RegExp(`/santos/${SAINT_ID}`), { timeout: 15000 });
    expect(page.url()).toContain(`/santos/${SAINT_ID}`);
    expect(page.url()).not.toContain('/saints-legacy/');

    const stored = await page.evaluate((k) => localStorage.getItem(k), LAST_ID_KEY);
    expect(stored).toBe(SAINT_ID);
  });

  test('last-id + variant "legacy" restauram /saints-legacy/:id ao acessar /santos', async ({ page }) => {
    await page.addInitScript(
      ({ variantKey, lastKey, id }) => {
        window.localStorage.clear();
        window.localStorage.setItem(variantKey, 'legacy');
        window.localStorage.setItem(lastKey, id);
      },
      { variantKey: VARIANT_KEY, lastKey: LAST_ID_KEY, id: SAINT_ID },
    );

    await page.goto('/santos');
    await page.waitForURL(new RegExp(`/saints-legacy/${SAINT_ID}`), { timeout: 15000 });
    expect(page.url()).toContain(`/saints-legacy/${SAINT_ID}`);
  });

  test('após refresh em /saints-legacy/:id mantém rota legacy', async ({ page }) => {
    await page.addInitScript(
      ({ variantKey, id }) => {
        window.localStorage.clear();
        window.localStorage.setItem(variantKey, 'legacy');
      },
      { variantKey: VARIANT_KEY, id: SAINT_ID },
    );

    await page.goto(`/saints-legacy/${SAINT_ID}`);
    await page.waitForURL(new RegExp(`/saints-legacy/${SAINT_ID}`), { timeout: 15000 });

    await page.reload();
    await page.waitForURL(new RegExp(`/saints-legacy/${SAINT_ID}`), { timeout: 15000 });
    expect(page.url()).toContain(`/saints-legacy/${SAINT_ID}`);

    const lastId = await page.evaluate((k) => localStorage.getItem(k), LAST_ID_KEY);
    expect(lastId).toBe(SAINT_ID);
  });

  test('alternar variante via ?legacy=1 preserva last-id e restaura na variante nova', async ({ page }) => {
    // Abre inicialmente na versão nova
    await page.addInitScript(() => window.localStorage.clear());
    await page.goto(`/santos/${SAINT_ID}`);
    await page.waitForURL(new RegExp(`/santos/${SAINT_ID}`), { timeout: 15000 });

    // Alterna para legacy via query param
    await page.goto(`/santos/${SAINT_ID}?legacy=1`);
    await page.waitForURL(new RegExp(`/saints-legacy/${SAINT_ID}`), { timeout: 15000 });

    const lastId = await page.evaluate((k) => localStorage.getItem(k), LAST_ID_KEY);
    const variant = await page.evaluate((k) => localStorage.getItem(k), VARIANT_KEY);
    expect(lastId).toBe(SAINT_ID);
    expect(variant).toBe('legacy');

    // Ao acessar /santos sem id, deve restaurar na variante legacy
    await page.goto('/santos');
    await page.waitForURL(new RegExp(`/saints-legacy/${SAINT_ID}`), { timeout: 15000 });
    expect(page.url()).toContain(`/saints-legacy/${SAINT_ID}`);
  });
});
