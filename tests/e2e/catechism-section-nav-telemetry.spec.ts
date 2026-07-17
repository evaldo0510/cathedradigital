import { test, expect } from '@playwright/test';
import { watchPopups, openJo6AndPickCic } from './utils/bible-cic-helpers';

/**
 * Instrumentação: ao clicar em próximo/anterior de § no Catecismo, o app deve
 * emitir console.info('[CIC section nav]', {...}) com origem e destino p=N.
 * O teste chega em /catechism?p=N via Jo 6 e aciona "Próxima".
 */
test('próximo § emite [CIC section nav] com origem e destino', async ({ context, page }) => {
  const events: any[] = [];
  page.on('console', (msg) => {
    if (msg.type() !== 'info') return;
    if (!msg.text().includes('[CIC section nav]')) return;
    Promise.all(msg.args().map((a) => a.jsonValue().catch(() => null)))
      .then((vals) => events.push(vals[1] ?? vals[0]))
      .catch(() => {});
  });

  const popups = watchPopups(context, page);
  const pagesBefore = context.pages().length;

  await openJo6AndPickCic(page);

  const nextBtn = page.locator('[data-testid="catechism-section-next"]').first();
  if (!(await nextBtn.count())) test.skip(true, 'controle de seção não presente nesta rota');
  await expect(nextBtn).toBeVisible();
  const disabled = await nextBtn.isDisabled();
  if (disabled) test.skip(true, 'próximo indisponível na seção atual');

  await nextBtn.click();
  await page.waitForTimeout(200);

  expect(events.length, 'ao menos 1 evento [CIC section nav]').toBeGreaterThan(0);
  const ev = events[events.length - 1];
  expect(ev).toMatchObject({
    origin: 'Catechism.section-nav',
    direction: 'next',
    from: expect.objectContaining({ paragraph: expect.any(Number) }),
    to: expect.objectContaining({ paragraph: expect.any(Number) }),
  });
  expect(String(ev.href)).toMatch(/\/catechism\?p=\d+/);

  expect(popups).toEqual([]);
  expect(context.pages().length).toBe(pagesBefore);
});
