import { test, expect } from '@playwright/test';
import { watchPopups, assertParagraphVisible } from './utils/bible-cic-helpers';

/**
 * Acesso direto a /catechism?p=2&ref=Jo 6 deve renderizar §2, sem popup/nova aba.
 * O parâmetro `ref` é tolerado (contexto de origem), mas não altera o parágrafo.
 */
test('/catechism?p=2&ref=Jo 6 renderiza §2 corretamente', async ({ context, page }) => {
  const popups = watchPopups(context, page);
  const pagesBefore = context.pages().length;

  await page.goto('/catechism?p=2&ref=' + encodeURIComponent('Jo 6'));
  await page.waitForLoadState('domcontentloaded');

  await expect(page).toHaveURL(/\/catechism\?.*p=2/);
  await expect(page).toHaveURL(/ref=Jo(%20|\+)6/);

  await expect(page.locator('main').first()).toBeVisible();
  const mainText = (await page.locator('main').first().innerText()).trim();
  expect(mainText.length).toBeGreaterThan(20);

  await assertParagraphVisible(page, '2');

  expect(popups).toEqual([]);
  expect(context.pages().length).toBe(pagesBefore);
});
