import { test, expect } from '@playwright/test';
import { watchPopups, openJo6AndPickCic, assertParagraphVisible } from './utils/bible-cic-helpers';

/**
 * Ao alternar entre Jo 6 e /catechism?p=N via back/forward, a posição de scroll
 * e o parágrafo selecionado devem permanecer consistentes.
 */
test('scroll e parágrafo consistentes em back/forward Jo 6 ↔ Catecismo', async ({ context, page }) => {
  const popups = watchPopups(context, page);
  const pagesBefore = context.pages().length;

  await page.goto('/bible?book=Jo&ch=6');
  await page.waitForLoadState('domcontentloaded');

  // Scroll na Bíblia antes de abrir o CIC
  await page.evaluate(() => window.scrollTo(0, 600));
  const bibleScroll = await page.evaluate(() => window.scrollY);
  expect(bibleScroll).toBeGreaterThan(100);

  const { paragraph } = await openJo6AndPickCic(page);
  await assertParagraphVisible(page, paragraph);

  // Scroll no Catecismo
  await page.evaluate(() => window.scrollTo(0, 400));
  const cicScroll = await page.evaluate(() => window.scrollY);

  // Voltar → Bíblia com scroll restaurado (tolerância)
  await page.goBack();
  await expect(page).toHaveURL(/\/bible\?.*book=Jo.*ch=6/);
  await page.waitForLoadState('domcontentloaded');
  const bibleScrollAfter = await page.evaluate(() => window.scrollY);
  expect(Math.abs(bibleScrollAfter - bibleScroll)).toBeLessThanOrEqual(150);

  // Avançar → Catecismo com parágrafo N e scroll aproximado
  await page.goForward();
  await expect(page).toHaveURL(new RegExp(`/catechism\\?p=${paragraph}`));
  await assertParagraphVisible(page, paragraph);
  const cicScrollAfter = await page.evaluate(() => window.scrollY);
  expect(Math.abs(cicScrollAfter - cicScroll)).toBeLessThanOrEqual(200);

  expect(popups).toEqual([]);
  expect(context.pages().length).toBe(pagesBefore);
});
