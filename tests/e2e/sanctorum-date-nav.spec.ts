import { test, expect, Page } from '@playwright/test';

/**
 * Cobre o SanctorumDateNav em /papas e /santos:
 *  - Navegação por Hoje / Anterior / Próximo / Semana / tira de dias
 *  - Popover do Calendário: abre, seleciona, fecha, mantém value sincronizado
 *  - Troca de conteúdo (papa reinante muda ao mudar de ano)
 *  - Metatags/JSON-LD são atualizados após troca de data
 */

async function readJsonLd(page: Page, selector = 'script[type="application/ld+json"]'): Promise<any[]> {
  return page.$$eval(selector, (nodes) =>
    nodes.map((n) => {
      try {
        return JSON.parse(n.textContent || '{}');
      } catch {
        return null;
      }
    }),
  );
}

test.describe('SanctorumDateNav — /papas', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/papas', { waitUntil: 'domcontentloaded' });
    await expect(page.getByRole('button', { name: 'Ir para hoje' })).toBeVisible();
  });

  test('navegação Anterior/Próximo/Hoje atualiza o cabeçalho de data', async ({ page }) => {
    const heading = page.locator('h2').filter({ hasText: /de\s+\w+/i }).first();
    const initial = (await heading.textContent())?.trim();

    await page.getByRole('button', { name: 'Próximo dia' }).click();
    await expect(heading).not.toHaveText(initial ?? '');

    await page.getByRole('button', { name: 'Dia anterior' }).click();
    await expect(heading).toHaveText(initial ?? '');

    await page.getByRole('button', { name: 'Próxima semana' }).click();
    await expect(heading).not.toHaveText(initial ?? '');

    await page.getByRole('button', { name: 'Ir para hoje' }).click();
    await expect(heading).toHaveText(initial ?? '');
    await expect(page.getByRole('button', { name: 'Ir para hoje' })).toBeDisabled();
  });

  test('Popover do Calendário abre, seleciona, fecha e sincroniza value', async ({ page }) => {
    const trigger = page.getByRole('button', { name: 'Escolher data no calendário' });
    await expect(trigger).toHaveAttribute('aria-expanded', 'false');

    await trigger.click();
    await expect(trigger).toHaveAttribute('aria-expanded', 'true');
    const dialog = page.getByRole('dialog').first();
    await expect(dialog).toBeVisible();

    // O dia atual é destacado (modifier "today" com ring)
    const todayCell = dialog.locator('button[name="day"].ring-2, button.ring-2').first();
    await expect(todayCell).toBeVisible();

    // Seleciona um dia diferente (o dia 15 do mês exibido)
    const target = dialog.getByRole('gridcell', { name: /^15$/ }).first();
    await target.click();

    // Popover fecha ao selecionar
    await expect(dialog).toBeHidden();
    await expect(trigger).toHaveAttribute('aria-expanded', 'false');

    // Cabeçalho reflete a nova data (contém "15 de ...")
    await expect(page.locator('h2').filter({ hasText: /^15 de /i })).toBeVisible();

    // Reabre: selected está sincronizado com value (aria-selected=true no dia 15)
    await trigger.click();
    const dialog2 = page.getByRole('dialog').first();
    const selected = dialog2.locator('[aria-selected="true"]').first();
    await expect(selected).toHaveText('15');
  });

  test('painel do Papa Reinante troca ao alterar o ano no calendário', async ({ page }) => {
    const panel = page.getByTestId('reigning-pope-panel');
    await expect(panel).toBeVisible();
    const initialId = await panel.getAttribute('data-pope-id');

    // Navega o calendário para o passado até trocar de papa (limite: 12 cliques ≈ 12 anos)
    const trigger = page.getByRole('button', { name: 'Escolher data no calendário' });
    let changed = false;
    for (let i = 0; i < 12 && !changed; i++) {
      await trigger.click();
      const dialog = page.getByRole('dialog').first();
      await dialog.getByRole('button', { name: /previous|mês anterior/i }).click({ clickCount: 12 });
      const someDay = dialog.getByRole('gridcell', { name: /^15$/ }).first();
      await someDay.click();
      await expect(dialog).toBeHidden();
      const currentId = await panel.getAttribute('data-pope-id').catch(() => null);
      if (currentId && currentId !== initialId) changed = true;
    }
    expect(changed, 'papa reinante deveria mudar após retroceder no calendário').toBeTruthy();
  });

  test('JSON-LD do papa é atualizado quando a data muda', async ({ page }) => {
    const jsonld = page.locator('script[data-testid="pope-jsonld"]');
    await expect(jsonld).toHaveCount(1);
    const before = await jsonld.textContent();
    const parsedBefore = JSON.parse(before || '{}');
    expect(parsedBefore['@type']).toBe('Person');
    expect(parsedBefore.name).toBeTruthy();

    // Muda o ano pra trás via botão de dia anterior * muitas vezes seria lento;
    // use o calendário para saltar ~10 anos.
    const trigger = page.getByRole('button', { name: 'Escolher data no calendário' });
    await trigger.click();
    const dialog = page.getByRole('dialog').first();
    await dialog.getByRole('button', { name: /previous|mês anterior/i }).click({ clickCount: 120 });
    await dialog.getByRole('gridcell', { name: /^15$/ }).first().click();
    await expect(dialog).toBeHidden();

    // Força re-avaliação do JSON-LD emitido pelo Helmet
    await page.waitForFunction(
      (prev) => {
        const el = document.querySelector('script[data-testid="pope-jsonld"]');
        return el && el.textContent !== prev;
      },
      before,
      { timeout: 5000 },
    );
    const after = await jsonld.textContent();
    expect(after).not.toBe(before);

    // Meta og:title reflete o nome do papa atual
    const ogTitle = await page.locator('meta[property="og:title"]').first().getAttribute('content');
    expect(ogTitle).toContain('Os Papas');
  });
});

test.describe('SanctorumDateNav — /santos', () => {
  test('tira de dias seleciona a data e atualiza aria-pressed', async ({ page }) => {
    await page.goto('/santos', { waitUntil: 'domcontentloaded' });
    const strip = page.locator('button[aria-pressed]');
    await expect(strip.first()).toBeVisible();

    const selectedBefore = page.locator('button[aria-pressed="true"]');
    const labelBefore = await selectedBefore.first().getAttribute('aria-label');

    // Clica em outro dia da tira (o último)
    await strip.last().click();
    const labelAfter = await page.locator('button[aria-pressed="true"]').first().getAttribute('aria-label');
    expect(labelAfter).not.toBe(labelBefore);
  });
});
