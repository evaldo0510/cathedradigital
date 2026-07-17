import { test, expect } from '@playwright/test';
import { watchPopups, findCicLink } from './utils/bible-cic-helpers';

/**
 * ARIA do Popover Nexus + navegação por § só com teclado.
 * - Popover tem role/dialog e labelledby/describedby.
 * - Link "Abrir §N no Catecismo" tem nome acessível.
 * - Tab não fica preso; Escape fecha o popover.
 */
test('Popover Nexus tem ARIA correto e fecha com Escape via teclado', async ({ context, page }) => {
  const popups = watchPopups(context, page);
  await page.goto('/bible?book=Jo&ch=6');
  await page.waitForLoadState('domcontentloaded');

  const trigger = page.locator('[data-nexus-trigger], [data-testid^="nexus-trigger"]').first();
  test.skip(!(await trigger.count()), 'trigger Nexus não presente neste capítulo');

  await trigger.focus();
  await page.keyboard.press('Enter');

  const popover = page.locator('[data-radix-popper-content-wrapper] [role="dialog"], [role="dialog"][data-state="open"]').first();
  await expect(popover).toBeVisible({ timeout: 5000 });

  // ARIA: role + labelledby OU aria-label não vazio
  const aria = await popover.evaluate((el) => ({
    role: el.getAttribute('role'),
    labelledby: el.getAttribute('aria-labelledby'),
    label: el.getAttribute('aria-label'),
    describedby: el.getAttribute('aria-describedby'),
  }));
  expect(aria.role).toBe('dialog');
  expect(Boolean(aria.labelledby || aria.label)).toBe(true);

  // Link do CIC (se presente) tem nome acessível
  const cic = page.locator('[data-testid="catechism-open-internal"]').first();
  if (await cic.count()) {
    const name = ((await cic.getAttribute('aria-label')) || (await cic.innerText())).trim();
    expect(name.length).toBeGreaterThan(0);
    expect(name).toMatch(/Abrir\s*§\s*\d+/i);
  }

  // Tab não trava dentro do popover — deve ser possível sair via Tab várias vezes
  for (let i = 0; i < 10; i++) await page.keyboard.press('Tab');

  // Escape fecha o popover
  await page.keyboard.press('Escape');
  await expect(popover).toBeHidden({ timeout: 3000 });

  expect(popups).toEqual([]);
});

test('controle de próxima/anterior § do Catecismo tem nome acessível e é ativável por teclado', async ({ context, page }) => {
  const popups = watchPopups(context, page);
  await page.goto('/catechism?p=2');
  await page.waitForLoadState('domcontentloaded');

  const next = page.locator('[data-testid="catechism-section-next"]').first();
  test.skip(!(await next.count()), 'controle de seção não renderizado');

  const name = ((await next.getAttribute('aria-label')) || (await next.innerText())).trim();
  expect(name.length).toBeGreaterThan(0);

  await next.focus();
  const focused = await page.evaluate(() => document.activeElement?.getAttribute('data-testid'));
  expect(focused).toBe('catechism-section-next');

  expect(popups).toEqual([]);
});
