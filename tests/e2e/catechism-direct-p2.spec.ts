import { test, expect } from '@playwright/test';
import { watchPopups, assertParagraphVisible } from './utils/bible-cic-helpers';

/**
 * Acesso direto a /catechism?p=2: parágrafo §2 selecionado, com heading e
 * landmarks corretos, na mesma aba, sem popup.
 */
test('/catechism?p=2 direto: §2 selecionado com landmarks corretos', async ({ context, page }) => {
  const popups = watchPopups(context, page);
  const pagesBefore = context.pages().length;

  await page.goto('/catechism?p=2');
  await page.waitForLoadState('domcontentloaded');

  await expect(page).toHaveURL(/\/catechism\?p=2\b/);

  // Landmarks
  await expect(page.locator('main')).toHaveCount(1);
  await expect(page.locator('main').first()).toBeVisible();
  await expect(page.locator('nav').first()).toBeVisible();

  // Heading contém referência ao Catecismo ou ao §2
  const headings = page.locator('h1, h2');
  await expect(headings.first()).toBeVisible();
  const headingText = (await headings.allInnerTexts()).join(' \n ');
  expect(headingText).toMatch(/(§\s*)?2\b|Catecismo/i);

  await assertParagraphVisible(page, '2');

  expect(popups).toEqual([]);
  expect(context.pages().length).toBe(pagesBefore);
});
