import { test, expect, type Page, type Locator } from '@playwright/test';

/**
 * Valida que o texto do heading do SanctorumDateNav muda corretamente
 * (data "dd de MMMM" + dia da semana em pt-BR) a cada navegação:
 *  - Setas "Dia anterior" / "Próximo dia"
 *  - Botão "Ir para hoje"
 *  - Pills da tira de dias
 *
 * Também confirma que a região aria-live permanece ativa (polite + atomic)
 * durante toda a jornada, garantindo o anúncio para leitores de tela.
 */

const MESES = [
  'janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho',
  'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro',
];
const DIAS_SEMANA = [
  'domingo', 'segunda-feira', 'terça-feira', 'quarta-feira',
  'quinta-feira', 'sexta-feira', 'sábado',
];

function expectedHeadingParts(d: Date) {
  return {
    data: `${String(d.getDate()).padStart(2, '0')} de ${MESES[d.getMonth()]}`,
    diaSemana: DIAS_SEMANA[d.getDay()],
  };
}

async function readHeadingBlock(page: Page): Promise<{ heading: Locator; region: Locator; data: string; diaSemana: string }> {
  const heading = page.getByRole('heading', { level: 2 }).first();
  await expect(heading).toBeVisible();
  const region = page.locator('[aria-live="polite"][aria-atomic="true"]').filter({ has: heading }).first();
  await expect(region).toHaveAttribute('aria-live', 'polite');
  await expect(region).toHaveAttribute('aria-atomic', 'true');
  const data = (await heading.textContent())?.trim() ?? '';
  const diaSemana = (await region.textContent())?.trim().replace(data, '').trim() ?? '';
  return { heading, region, data, diaSemana };
}

test.describe('SanctorumDateNav — heading text pt-BR', () => {
  test('setas, Hoje e pills atualizam o heading com data + dia da semana', async ({ page }) => {
    // Ancoramos numa data conhecida (segunda, 20 de julho de 2026)
    await page.goto('/santos?date=2026-07-20', { waitUntil: 'domcontentloaded' });

    const inicial = await readHeadingBlock(page);
    const esperadoInicial = expectedHeadingParts(new Date(2026, 6, 20));
    expect(inicial.data.toLowerCase()).toBe(esperadoInicial.data);
    expect(inicial.diaSemana.toLowerCase()).toBe(esperadoInicial.diaSemana);

    // Próximo dia → 21/07 (terça-feira)
    await page.getByRole('button', { name: 'Próximo dia' }).click();
    const esperadoProx = expectedHeadingParts(new Date(2026, 6, 21));
    await expect(inicial.heading).toHaveText(new RegExp(`^21 de julho$`, 'i'));
    const proximo = await readHeadingBlock(page);
    expect(proximo.diaSemana.toLowerCase()).toBe(esperadoProx.diaSemana);
    // Região aria-live intacta após transição
    await expect(proximo.region).toHaveAttribute('aria-live', 'polite');

    // Dia anterior → volta a 20/07 (segunda-feira)
    await page.getByRole('button', { name: 'Dia anterior' }).click();
    await expect(inicial.heading).toHaveText(new RegExp(`^20 de julho$`, 'i'));
    const volta = await readHeadingBlock(page);
    expect(volta.diaSemana.toLowerCase()).toBe(esperadoInicial.diaSemana);

    // Ir para hoje → heading reflete a data atual do relógio do navegador
    await page.getByRole('button', { name: 'Ir para hoje' }).click();
    const hoje = new Date();
    const esperadoHoje = expectedHeadingParts(hoje);
    const apósHoje = await readHeadingBlock(page);
    expect(apósHoje.data.toLowerCase()).toBe(esperadoHoje.data);
    expect(apósHoje.diaSemana.toLowerCase()).toBe(esperadoHoje.diaSemana);
    await expect(apósHoje.region).toHaveAttribute('aria-live', 'polite');

    // Pill da tira: seleciona um dia diferente do atual e confirma o heading
    const pills = page.getByTestId('sanctorum-date-strip').locator('button');
    const antesPill = (await apósHoje.heading.textContent())?.trim() ?? '';
    // Escolhe uma pill cujo aria-label difere do heading atual
    const total = await pills.count();
    let picked = -1;
    for (let i = 0; i < total; i++) {
      const label = (await pills.nth(i).getAttribute('aria-label')) ?? '';
      if (label && !antesPill.toLowerCase().includes(label.toLowerCase())) {
        picked = i;
        break;
      }
    }
    expect(picked, 'esperava uma pill com data distinta da atual').toBeGreaterThanOrEqual(0);
    const pillLabel = (await pills.nth(picked).getAttribute('aria-label')) ?? '';
    await pills.nth(picked).click();

    // O heading deve espelhar o aria-label da pill (mesmo formato "dd de MMMM")
    await expect
      .poll(async () => (await apósHoje.heading.textContent())?.trim().toLowerCase() ?? '')
      .toBe(pillLabel.toLowerCase());

    const finalBlock = await readHeadingBlock(page);
    // Dia da semana ainda é um dos 7 válidos em pt-BR
    expect(DIAS_SEMANA).toContain(finalBlock.diaSemana.toLowerCase());
    // Região aria-live continua ativa ao final
    await expect(finalBlock.region).toHaveAttribute('aria-live', 'polite');
    await expect(finalBlock.region).toHaveAttribute('aria-atomic', 'true');
  });
});
