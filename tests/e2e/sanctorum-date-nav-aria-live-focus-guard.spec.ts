import { test, expect } from '@playwright/test';

/**
 * aria-live do SanctorumDateNav:
 *  1. Confirma atributos corretos na região (aria-live=polite, aria-atomic=true).
 *  2. Garante que anúncios só acontecem quando a data muda de fato —
 *     movimentar o foco (Tab/Shift+Tab/focus programático) NÃO deve gerar
 *     mutações no texto anunciado.
 */
test('SanctorumDateNav — aria-live só anuncia em mudança de data, não ao mover foco', async ({ page }) => {
  await page.goto('/santos?date=2026-07-20', { waitUntil: 'domcontentloaded' });

  const heading = page.getByRole('heading', { level: 2 }).first();
  await expect(heading).toHaveText(/^20 de julho$/i);

  // Atributos da região
  const region = page
    .locator('[aria-live="polite"][aria-atomic="true"]')
    .filter({ has: heading })
    .first();
  await expect(region).toHaveAttribute('aria-live', 'polite');
  await expect(region).toHaveAttribute('aria-atomic', 'true');
  // role explícito não é obrigatório em regiões aria-live; se existir, deve ser válido
  const role = await region.getAttribute('role');
  if (role !== null) {
    expect(['status', 'region', 'alert']).toContain(role);
  }

  // Instrumenta mutações de conteúdo textual da região
  await page.evaluate(() => {
    const region = document.querySelector(
      '[aria-live="polite"][aria-atomic="true"]',
    );
    (window as unknown as { __ann: string[] }).__ann = [];
    if (!region) return;
    new MutationObserver(() => {
      const text = (region.textContent ?? '').trim();
      if (text) (window as unknown as { __ann: string[] }).__ann.push(text);
    }).observe(region, { childList: true, subtree: true, characterData: true });
  });

  const snapshot = async () =>
    page.evaluate(() => (window as unknown as { __ann: string[] }).__ann.slice());

  // Baseline (após efeitos iniciais assentarem)
  await page.waitForTimeout(150);
  const baseline = (await snapshot()).length;

  // 1) Apenas mover o foco pelos controles — NÃO deve anunciar
  await page.getByRole('button', { name: /calendário/i }).focus();
  await page.keyboard.press('Tab');
  await page.keyboard.press('Tab');
  await page.keyboard.press('Tab');
  await page.keyboard.press('Shift+Tab');
  await page.getByRole('button', { name: /^hoje$/i }).focus();
  await page.getByRole('button', { name: /próximo dia/i }).focus();
  await page.waitForTimeout(200);

  const afterFocus = await snapshot();
  expect(afterFocus.length).toBe(baseline);
  // Heading permanece igual
  await expect(page.getByRole('heading', { level: 2 }).first()).toHaveText(/^20 de julho$/i);

  // 2) Focar um pill não selecionado sem ativar — também NÃO anuncia
  const otherPill = page
    .locator('[role="group"] button[aria-pressed="false"]')
    .first();
  await otherPill.focus();
  await page.waitForTimeout(200);
  expect((await snapshot()).length).toBe(baseline);
  await expect(page.getByRole('heading', { level: 2 }).first()).toHaveText(/^20 de julho$/i);

  // 3) Agora muda a data de fato — DEVE anunciar exatamente 1 vez
  await page.getByRole('button', { name: /próximo dia/i }).click();
  await expect(page.getByRole('heading', { level: 2 }).first()).toHaveText(/^21 de julho$/i);
  await page.waitForTimeout(200);
  const afterChange = await snapshot();
  expect(afterChange.length - baseline).toBe(1);
  expect(afterChange.at(-1)).toMatch(/21 de julho/i);

  // 4) Focar novamente sem mudar data — não incrementa
  await page.getByRole('button', { name: /calendário/i }).focus();
  await page.keyboard.press('Tab');
  await page.waitForTimeout(200);
  expect((await snapshot()).length).toBe(afterChange.length);
});
