/**
 * E2E — deep links do Breviário (?h=&d=)
 *
 * Garante que a URL é a fonte de verdade: navegação, refresh e reload
 * restauram exatamente a Hora + data selecionadas sem inconsistências
 * entre o canonical/og:url e a página renderizada.
 */
import { test, expect } from '@playwright/test';

const HOUR = 'laudes';
const DATE = '2026-07-21';

test.describe('Breviary deep links', () => {
  test('restaura h + d na primeira carga', async ({ page }) => {
    await page.goto(`/breviary?h=${HOUR}&d=${DATE}`);
    await expect(page).toHaveURL(new RegExp(`h=${HOUR}`));
    await expect(page).toHaveURL(new RegExp(`d=${DATE}`));

    const canonical = await page.locator('link[rel="canonical"]').first().getAttribute('href');
    expect(canonical).toContain(`h=${HOUR}`);
    expect(canonical).toContain(`d=${DATE}`);

    const ogUrl = await page.locator('meta[property="og:url"]').first().getAttribute('content');
    expect(ogUrl).toContain(`h=${HOUR}`);
    expect(ogUrl).toContain(`d=${DATE}`);
  });

  test('preserva estado após refresh', async ({ page }) => {
    await page.goto(`/breviary?h=${HOUR}&d=${DATE}`);
    await page.waitForLoadState('domcontentloaded');
    await page.reload();
    await expect(page).toHaveURL(new RegExp(`h=${HOUR}.*d=${DATE}|d=${DATE}.*h=${HOUR}`));
    const canonical = await page.locator('link[rel="canonical"]').first().getAttribute('href');
    expect(canonical).toContain(`h=${HOUR}`);
    expect(canonical).toContain(`d=${DATE}`);
  });

  test('OG e Twitter Card presentes com mesmo título/URL canônica', async ({ page }) => {
    await page.goto(`/breviary?h=${HOUR}&d=${DATE}`);
    const canonical = await page.locator('link[rel="canonical"]').first().getAttribute('href');
    const ogTitle = await page.locator('meta[property="og:title"]').first().getAttribute('content');
    const twTitle = await page.locator('meta[name="twitter:title"]').first().getAttribute('content');
    const twCard = await page.locator('meta[name="twitter:card"]').first().getAttribute('content');
    const ogUrl = await page.locator('meta[property="og:url"]').first().getAttribute('content');
    expect(ogTitle).toBeTruthy();
    expect(twTitle).toBe(ogTitle);
    expect(twCard).toBeTruthy();
    expect(ogUrl).toBe(canonical);
  });

  test('sem h volta ao seletor mantendo d', async ({ page }) => {
    await page.goto(`/breviary?d=${DATE}`);
    await expect(page.getByRole('heading', { name: 'Breviário' })).toBeVisible();
    await expect(page).toHaveURL(new RegExp(`d=${DATE}`));
  });
});
