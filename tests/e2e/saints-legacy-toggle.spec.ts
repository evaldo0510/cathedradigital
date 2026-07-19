import { test, expect } from '@playwright/test';

const SAINT_ID = 'nha-chica';
const STORAGE_KEY = 'cathedra:saints:reader-variant';

test.describe('Santos - toggle Reader (?legacy) e localStorage', () => {
  test.beforeEach(async ({ context }) => {
    await context.clearCookies();
  });

  test('?legacy=1 em /santos/:id redireciona para /saints-legacy e persiste "legacy"', async ({ page }) => {
    await page.addInitScript(() => window.localStorage.clear());
    await page.goto(`/santos/${SAINT_ID}?legacy=1`);
    await page.waitForURL(new RegExp(`/saints-legacy/${SAINT_ID}`), { timeout: 15000 });
    expect(page.url()).toContain(`/saints-legacy/${SAINT_ID}`);
    const pref = await page.evaluate((k) => localStorage.getItem(k), STORAGE_KEY);
    expect(pref).toBe('legacy');
  });

  test('?legacy=0 em /saints-legacy/:id redireciona para /santos e persiste "new"', async ({ page }) => {
    await page.addInitScript(() => window.localStorage.clear());
    await page.goto(`/saints-legacy/${SAINT_ID}?legacy=0`);
    await page.waitForURL(new RegExp(`/santos/${SAINT_ID}(?!.*saints-legacy)`), { timeout: 15000 });
    expect(page.url()).toContain(`/santos/${SAINT_ID}`);
    expect(page.url()).not.toContain('/saints-legacy/');
    const pref = await page.evaluate((k) => localStorage.getItem(k), STORAGE_KEY);
    expect(pref).toBe('new');
  });

  test('preferência "legacy" no localStorage redireciona /santos/:id → /saints-legacy/:id', async ({ page }) => {
    await page.addInitScript((k) => {
      window.localStorage.clear();
      window.localStorage.setItem(k, 'legacy');
    }, STORAGE_KEY);
    await page.goto(`/santos/${SAINT_ID}`);
    await page.waitForURL(new RegExp(`/saints-legacy/${SAINT_ID}`), { timeout: 15000 });
    expect(page.url()).toContain(`/saints-legacy/${SAINT_ID}`);
  });

  test('preferência "new" no localStorage redireciona /saints-legacy/:id → /santos/:id', async ({ page }) => {
    await page.addInitScript((k) => {
      window.localStorage.clear();
      window.localStorage.setItem(k, 'new');
    }, STORAGE_KEY);
    await page.goto(`/saints-legacy/${SAINT_ID}`);
    await page.waitForURL(new RegExp(`/santos/${SAINT_ID}(?!.*saints-legacy)`), { timeout: 15000 });
    expect(page.url()).not.toContain('/saints-legacy/');
  });

  test('?legacy=1 sobrescreve localStorage "new"', async ({ page }) => {
    await page.addInitScript((k) => {
      window.localStorage.clear();
      window.localStorage.setItem(k, 'new');
    }, STORAGE_KEY);
    await page.goto(`/santos/${SAINT_ID}?legacy=1`);
    await page.waitForURL(new RegExp(`/saints-legacy/${SAINT_ID}`), { timeout: 15000 });
    const pref = await page.evaluate((k) => localStorage.getItem(k), STORAGE_KEY);
    expect(pref).toBe('legacy');
  });
});
