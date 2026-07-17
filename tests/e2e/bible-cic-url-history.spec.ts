import { test, expect } from '@playwright/test';
import { watchPopups, openJo6AndPickCic, assertParagraphVisible } from './utils/bible-cic-helpers';

/**
 * Back/forward entre Jo 6 e /catechism?p=N: URL (incluindo p=N) é atualizada
 * corretamente, tudo na mesma aba, sem popup.
 */
test('URL preserva p=N em back/forward entre Jo 6 e Catecismo', async ({ context, page }) => {
  const popups = watchPopups(context, page);
  const pagesBefore = context.pages().length;

  const { paragraph } = await openJo6AndPickCic(page);
  await expect(page).toHaveURL(new RegExp(`/catechism\\?p=${paragraph}`));

  await page.goBack();
  await expect(page).toHaveURL(/\/bible\?.*book=Jo.*ch=6/);

  await page.goForward();
  await expect(page).toHaveURL(new RegExp(`/catechism\\?p=${paragraph}`));
  await assertParagraphVisible(page, paragraph);

  expect(popups).toEqual([]);
  expect(context.pages().length).toBe(pagesBefore);
});
