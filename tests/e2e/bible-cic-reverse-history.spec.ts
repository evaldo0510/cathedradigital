import { test, expect } from '@playwright/test';
import { watchPopups, openJo6AndPickCic, assertParagraphVisible } from './utils/bible-cic-helpers';

/**
 * Fluxo inverso: partindo de /catechism?p=N (após chegar via Jo 6), navega
 * para Jo 6 e usa voltar/avançar. O parágrafo N precisa continuar selecionado
 * nas duas visitas ao Catecismo, sem popup e sem nova aba.
 */
test('CIC → Jo 6: back/forward mantém §N e não abre popup', async ({ context, page }) => {
  const popups = watchPopups(context, page);
  const pagesBefore = context.pages().length;

  const { paragraph } = await openJo6AndPickCic(page);
  await assertParagraphVisible(page, paragraph);

  // Sai do Catecismo para Jo 6 via navegação SPA
  await page.goto('/bible?book=Jo&ch=6');
  await page.waitForLoadState('domcontentloaded');
  await expect(page).toHaveURL(/\/bible\?.*book=Jo.*ch=6/);

  // Voltar → Catecismo com §N ainda selecionado
  await page.goBack();
  await expect(page).toHaveURL(new RegExp(`/catechism\\?p=${paragraph}`));
  await assertParagraphVisible(page, paragraph);

  // Avançar → Jo 6 novamente
  await page.goForward();
  await expect(page).toHaveURL(/\/bible\?.*book=Jo.*ch=6/);

  // Voltar mais uma vez → §N intacto
  await page.goBack();
  await expect(page).toHaveURL(new RegExp(`/catechism\\?p=${paragraph}`));
  await assertParagraphVisible(page, paragraph);

  expect(popups).toEqual([]);
  expect(context.pages().length).toBe(pagesBefore);
});
