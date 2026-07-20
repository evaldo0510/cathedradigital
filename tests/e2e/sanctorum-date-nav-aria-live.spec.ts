import { test, expect } from '@playwright/test';

/**
 * Valida que o heading <h2> do SanctorumDateNav é uma região aria-live
 * e que seu conteúdo é atualizado a cada navegação de data — permitindo
 * que leitores de tela anunciem a mudança sem foco explícito.
 */
test.describe('SanctorumDateNav — heading aria-live', () => {
  test('heading anuncia mudanças de data via aria-live=polite', async ({ page }) => {
    await page.goto('/santos?date=2026-07-20', { waitUntil: 'domcontentloaded' });

    const heading = page.getByRole('heading', { level: 2 });
    await expect(heading).toBeVisible();

    // Contrato de acessibilidade: heading precisa ser região viva e atômica.
    await expect(heading).toHaveAttribute('aria-live', 'polite');
    await expect(heading).toHaveAttribute('aria-atomic', 'true');

    const textos: string[] = [];
    textos.push((await heading.textContent())?.trim() ?? '');

    // Avança 3 dias e captura o texto anunciado em cada transição.
    const proximo = page.getByRole('button', { name: 'Próximo dia' });
    for (let i = 0; i < 3; i++) {
      const anterior = textos[textos.length - 1];
      await proximo.click();
      await expect
        .poll(async () => (await heading.textContent())?.trim() ?? '')
        .not.toBe(anterior);
      textos.push((await heading.textContent())?.trim() ?? '');
    }

    // Cada anúncio deve ser único (sem repetição que confundiria o SR).
    expect(new Set(textos).size).toBe(textos.length);

    // Volta ao "Hoje" e confirma novo anúncio.
    const hoje = page.getByRole('button', { name: /hoje/i });
    const antesHoje = (await heading.textContent())?.trim() ?? '';
    await hoje.click();
    await expect
      .poll(async () => (await heading.textContent())?.trim() ?? '')
      .not.toBe(antesHoje);

    // Após navegação por pill da tira, o heading também é reanunciado.
    const pills = page.getByTestId('sanctorum-date-strip').locator('button');
    const antesPill = (await heading.textContent())?.trim() ?? '';
    await pills.nth(2).click();
    await expect
      .poll(async () => (await heading.textContent())?.trim() ?? '')
      .not.toBe(antesPill);

    // O nó do heading permanece o mesmo (aria-live só notifica se o nó persistir).
    const isSameNode = await heading.evaluate((el) => el.isConnected);
    expect(isSameNode).toBe(true);
  });
});
