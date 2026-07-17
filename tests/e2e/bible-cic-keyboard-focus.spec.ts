import { test, expect } from '@playwright/test';
import { watchPopups, findCicLink, assertParagraphVisible } from './utils/bible-cic-helpers';

/**
 * Após Tab+Enter em "Abrir §N no Catecismo", o foco em /catechism?p=N deve
 * ir para o heading do § correspondente. Sem nova aba e sem popup.
 */
test('Tab+Enter no CIC leva o foco ao heading do § em /catechism?p=N', async ({ context, page }) => {
  const popups = watchPopups(context, page);
  const pagesBefore = context.pages().length;

  await page.goto('/bible?book=Jo&ch=6');
  await page.waitForLoadState('domcontentloaded');

  const link = await findCicLink(page);
  const href = (await link.getAttribute('href'))!;
  const paragraph = href.match(/p=(\d+)/)![1];

  await link.evaluate((el) => {
    const prev = document.createElement('button');
    prev.textContent = 'pre-focus';
    prev.setAttribute('data-testid', 'kbd-pre-focus');
    el.parentElement?.insertBefore(prev, el);
    prev.focus();
  });
  await page.keyboard.press('Tab');
  await page.keyboard.press('Enter');

  await page.waitForURL(new RegExp(`/catechism\\?p=${paragraph}`), { timeout: 10_000 });
  await assertParagraphVisible(page, paragraph);

  // Aguarda o foco assentar (o app pode mover o foco de forma assíncrona após navegar).
  await expect
    .poll(
      async () =>
        await page.evaluate((p) => {
          const el = document.activeElement as HTMLElement | null;
          if (!el) return null;
          const tag = el.tagName.toLowerCase();
          const isHeading = /^h[1-6]$/.test(tag);
          const text = (el.innerText || el.textContent || '').trim();
          const matchesP =
            text.includes(`§${p}`) ||
            text.includes(`§ ${p}`) ||
            el.getAttribute('data-paragraph') === p ||
            el.getAttribute('data-cic-paragraph') === p ||
            el.id === `p-${p}` ||
            el.id === `paragraph-${p}`;
          return { isHeading, matchesP };
        }, paragraph),
      { timeout: 5_000, message: 'foco deveria ir para heading do § correto' },
    )
    .toMatchObject({ isHeading: true, matchesP: true });

  expect(popups).toEqual([]);
  expect(context.pages().length).toBe(pagesBefore);
});
