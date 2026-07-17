import { test, expect } from '@playwright/test';
import { watchPopups, findCicLink, assertParagraphVisible } from './utils/bible-cic-helpers';

/**
 * Navega até "Abrir §N no Catecismo" via teclado (Tab) e aciona com Enter.
 * Confirma navegação SPA (mesma aba), sem popup, e §N correto renderizado.
 */
test('Tab + Enter em "Abrir §N no Catecismo" navega na mesma aba', async ({ context, page }) => {
  const popups = watchPopups(context, page);
  const pagesBefore = context.pages().length;

  await page.goto('/bible?book=Jo&ch=6');
  await page.waitForLoadState('domcontentloaded');

  const link = await findCicLink(page);
  const href = (await link.getAttribute('href'))!;
  const paragraph = href.match(/p=(\d+)/)![1];

  // Foca o link programaticamente e alcança-o via Tab a partir do elemento anterior,
  // garantindo que ele é realmente atingível pelo teclado.
  await link.evaluate((el) => {
    const prev = document.createElement('button');
    prev.textContent = 'pre-focus';
    prev.setAttribute('data-testid', 'kbd-pre-focus');
    el.parentElement?.insertBefore(prev, el);
    prev.focus();
  });
  await page.keyboard.press('Tab');

  const focused = await page.evaluate(() => {
    const a = document.activeElement as HTMLAnchorElement | null;
    return a ? { tag: a.tagName, href: a.getAttribute('href') } : null;
  });
  expect(focused?.href).toBe(href);

  await page.keyboard.press('Enter');
  await page.waitForURL(new RegExp(`/catechism\\?p=${paragraph}`), { timeout: 10_000 });
  await assertParagraphVisible(page, paragraph);

  expect(popups).toEqual([]);
  expect(context.pages().length).toBe(pagesBefore);
});
