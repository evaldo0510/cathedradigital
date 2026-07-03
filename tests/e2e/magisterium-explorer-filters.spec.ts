import { test, expect, type Page } from '@playwright/test';

/**
 * E2E do Explorer de Magistério — valida filtros interativos,
 * persistência dos filtros na URL (link compartilhável) e
 * hidratação do estado a partir dos query params.
 *
 * Rota: /magisterium
 * Parâmetros persistidos: q, cat, theme (repetível), sort
 * Parâmetros preservados (não geridos aqui): topic, doc
 */

const ROUTE = '/magisterium';

async function openExplorer(page: Page, query = ''): Promise<void> {
  await page.goto(`${ROUTE}${query}`);
  // A área de filtros é renderizada síncrona; espera o input de busca.
  await page.getByPlaceholder('Buscar documento, autor ou tema...').waitFor();
}

const countLabel = (page: Page) =>
  page.locator('text=/^\\d+\\s+(documento|documentos)$/i').first();

async function readCount(page: Page): Promise<number> {
  const raw = await countLabel(page).innerText();
  return Number(raw.trim().split(/\s+/)[0]);
}

test.describe('Magistério Explorer — filtros + URL', () => {
  test('deep-link com ?cat= hidrata categoria e filtra somente ela', async ({ page }) => {
    await openExplorer(page, '?cat=Enc%C3%ADclicas');

    // Chip removível "Encíclicas" está presente
    await expect(
      page.getByRole('button', { name: 'Remover categoria: Encíclicas' }),
    ).toBeVisible();

    // Documento tipicamente de Encíclicas visível; documento de Concílio não
    await expect(page.getByRole('heading', { name: 'Rerum Novarum' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Lumen Gentium' })).toHaveCount(0);

    expect(await readCount(page)).toBeGreaterThan(0);
  });

  test('deep-link com múltiplos ?theme= aplica AND e mostra os chips', async ({ page }) => {
    await openExplorer(page, '?theme=Maria&theme=Ros%C3%A1rio');

    await expect(page.getByRole('button', { name: 'Remover tema: Maria' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Remover tema: Rosário' })).toBeVisible();

    // Rosarium Virginis Mariae tem ambos os temas
    await expect(page.getByRole('heading', { name: 'Rosarium Virginis Mariae' })).toBeVisible();
    // Ineffabilis Deus tem Maria mas não Rosário — filtrado pelo AND
    await expect(page.getByRole('heading', { name: 'Ineffabilis Deus' })).toHaveCount(0);
  });

  test('deep-link com ?sort=chronological-desc ordena do mais recente ao mais antigo', async ({ page }) => {
    await openExplorer(page, '?sort=chronological-desc');

    const years = await page
      .locator('article, [data-slot="card"]')
      .locator('span.text-secondary\\/30, span.tracking-widest')
      .allInnerTexts();
    const parsed = years.map(Number).filter(y => Number.isFinite(y));
    expect(parsed.length).toBeGreaterThan(3);
    for (let i = 0; i < parsed.length - 1; i++) {
      expect(parsed[i]).toBeGreaterThanOrEqual(parsed[i + 1]);
    }
  });

  test('clicar em categoria persiste ?cat= na URL e renderiza chip removível', async ({ page }) => {
    await openExplorer(page);
    await page.getByRole('button', { name: 'Encíclicas', exact: true }).first().click();

    await expect(page).toHaveURL(/[?&]cat=Enc%C3%ADclicas/);
    await expect(
      page.getByRole('button', { name: 'Remover categoria: Encíclicas' }),
    ).toBeVisible();
  });

  test('remover chip limpa o parâmetro correspondente da URL', async ({ page }) => {
    await openExplorer(page, '?cat=Enc%C3%ADclicas&theme=F%C3%A9');

    await page.getByRole('button', { name: 'Remover tema: Fé' }).click();
    await expect(page).not.toHaveURL(/[?&]theme=/);
    await expect(page).toHaveURL(/[?&]cat=Enc%C3%ADclicas/);

    await page.getByRole('button', { name: 'Remover categoria: Encíclicas' }).click();
    await expect(page).not.toHaveURL(/[?&]cat=/);
  });

  test('“Limpar tudo” remove q, cat, theme e sort — preservando outros params', async ({ page }) => {
    await openExplorer(page, '?q=vida&cat=Enc%C3%ADclicas&theme=Vida&sort=chronological-asc&topic=medo');

    await expect(page.getByRole('button', { name: /Limpar tudo/i })).toBeVisible();
    await page.getByRole('button', { name: /Limpar tudo/i }).click();

    await expect(page).not.toHaveURL(/[?&](q|cat|theme|sort)=/);
    // topic externo é preservado pelo mergeFilterParams
    await expect(page).toHaveURL(/[?&]topic=medo/);
  });

  test('busca digitada persiste em ?q= e o realce (<mark>) aparece nos cards', async ({ page }) => {
    await openExplorer(page);
    await page.getByPlaceholder('Buscar documento, autor ou tema...').fill('Laudato');

    await expect(page).toHaveURL(/[?&]q=Laudato/);
    await expect(page.locator('mark', { hasText: 'Laudato' }).first()).toBeVisible();
    await expect(page.getByRole('button', { name: /Remover busca: Laudato/ })).toBeVisible();
  });
});
