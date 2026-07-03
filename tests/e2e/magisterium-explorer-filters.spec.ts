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

  test('múltiplos ?theme= aplicam AND estrito e o filtro sobrevive ao reload', async ({ page }) => {
    await openExplorer(page, '?theme=Maria&theme=Ros%C3%A1rio');

    // AND estrito: só documentos com AMBOS os temas aparecem.
    // Ineffabilis Deus tem "Maria" mas não "Rosário".
    // Munificentissimus Deus tem "Maria" mas não "Rosário".
    // Rosarium Virginis Mariae tem os dois.
    await expect(page.getByRole('heading', { name: 'Rosarium Virginis Mariae' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Ineffabilis Deus' })).toHaveCount(0);
    await expect(page.getByRole('heading', { name: 'Munificentissimus Deus' })).toHaveCount(0);

    const beforeReload = await readCount(page);
    expect(beforeReload).toBeGreaterThan(0);

    await page.reload();
    await page.getByPlaceholder('Buscar documento, autor ou tema...').waitFor();

    // Estado hidratado idêntico após reload.
    await expect(page.getByRole('button', { name: 'Remover tema: Maria' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Remover tema: Rosário' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Rosarium Virginis Mariae' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Ineffabilis Deus' })).toHaveCount(0);
    expect(await readCount(page)).toBe(beforeReload);
    await expect(page).toHaveURL(/theme=Maria/);
    await expect(page).toHaveURL(/theme=Ros%C3%A1rio/);
  });

  test('?topic e ?doc são preservados ao trocar categoria, remover chip e Limpar tudo', async ({ page }) => {
    await openExplorer(
      page,
      '?topic=medo&doc=lg&cat=Enc%C3%ADclicas&theme=F%C3%A9',
    );

    // 1) Troca categoria via clique — topic/doc permanecem.
    await page
      .getByRole('button', { name: 'Cartas Apostólicas', exact: true })
      .first()
      .click();
    await expect(page).toHaveURL(/cat=Cartas\+Apost%C3%B3licas|cat=Cartas%20Apost%C3%B3licas/);
    await expect(page).toHaveURL(/topic=medo/);
    await expect(page).toHaveURL(/doc=lg/);

    // 2) Remove chip de tema — topic/doc permanecem.
    await page.getByRole('button', { name: 'Remover tema: Fé' }).click();
    await expect(page).not.toHaveURL(/[?&]theme=/);
    await expect(page).toHaveURL(/topic=medo/);
    await expect(page).toHaveURL(/doc=lg/);

    // 3) Limpar tudo — remove filtros mas mantém topic/doc.
    await page.getByRole('button', { name: /Limpar tudo/i }).click();
    await expect(page).not.toHaveURL(/[?&](q|cat|theme|sort)=/);
    await expect(page).toHaveURL(/topic=medo/);
    await expect(page).toHaveURL(/doc=lg/);
  });

  test('chips e “Limpar tudo”: navegação por teclado e aria-label acessível', async ({ page }) => {
    await openExplorer(page, '?cat=Enc%C3%ADclicas&theme=F%C3%A9&theme=Ros%C3%A1rio&q=amor');

    const searchChip = page.getByRole('button', { name: 'Remover busca: amor' });
    const catChip = page.getByRole('button', { name: 'Remover categoria: Encíclicas' });
    const themeFe = page.getByRole('button', { name: 'Remover tema: Fé' });
    const themeRos = page.getByRole('button', { name: 'Remover tema: Rosário' });
    const clearAll = page.getByRole('button', { name: /Limpar tudo/i });

    // Todos exponem aria-label legível por leitores de tela.
    for (const chip of [searchChip, catChip, themeFe, themeRos, clearAll]) {
      await expect(chip).toBeVisible();
      const label = await chip.getAttribute('aria-label');
      // clearAll usa texto visível "Limpar tudo"; os demais têm aria-label explícito.
      if (label !== null) expect(label.length).toBeGreaterThan(0);
    }

    // Região de filtros ativos anunciada por landmark.
    await expect(page.getByRole('region', { name: 'Filtros ativos' })).toBeVisible();

    // Foca o chip de categoria e aciona por teclado (Enter) — deve remover da URL.
    await catChip.focus();
    await expect(catChip).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(page).not.toHaveURL(/[?&]cat=/);

    // Foca o próximo chip (tema) e aciona por Space — também remove.
    await themeFe.focus();
    await expect(themeFe).toBeFocused();
    await page.keyboard.press('Space');
    await expect(page).not.toHaveURL(/theme=F%C3%A9/);

    // “Limpar tudo” alcançável e acionável por teclado.
    await clearAll.focus();
    await expect(clearAll).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(page).not.toHaveURL(/[?&](q|cat|theme|sort)=/);
  });

  test('alternar sort atualiza ?sort= na URL, mantém filtros e sobrevive ao reload', async ({ page }) => {
    await openExplorer(page, '?cat=Enc%C3%ADclicas');

    // Estado inicial: canonical (default) NÃO vai à URL.
    await expect(page).not.toHaveURL(/[?&]sort=/);
    const sortBtn = page.getByRole('button', { name: /Ordem canônica|Cronológica/ });
    await expect(sortBtn).toHaveAccessibleName(/Ordem canônica/);

    // 1º clique → chronological-asc
    await sortBtn.click();
    await expect(page).toHaveURL(/[?&]sort=chronological-asc/);
    await expect(page).toHaveURL(/cat=Enc%C3%ADclicas/);
    await expect(sortBtn).toHaveAccessibleName(/Cronológica ↑/);

    // 2º clique → chronological-desc
    await sortBtn.click();
    await expect(page).toHaveURL(/[?&]sort=chronological-desc/);
    await expect(page).toHaveURL(/cat=Enc%C3%ADclicas/);

    // Reload preserva sort e filtros.
    await page.reload();
    await page.getByPlaceholder('Buscar documento, autor ou tema...').waitFor();
    await expect(page).toHaveURL(/[?&]sort=chronological-desc/);
    await expect(page).toHaveURL(/cat=Enc%C3%ADclicas/);
    await expect(
      page.getByRole('button', { name: 'Remover categoria: Encíclicas' }),
    ).toBeVisible();
    await expect(
      page.getByRole('button', { name: /Ordem canônica|Cronológica/ }),
    ).toHaveAccessibleName(/Cronológica ↓/);

    // 3º clique volta para canonical → sort desaparece da URL.
    await page.getByRole('button', { name: /Cronológica ↓/ }).click();
    await expect(page).not.toHaveURL(/[?&]sort=/);
    await expect(page).toHaveURL(/cat=Enc%C3%ADclicas/);
  });

  test('remover um ?theme mantém AND com os restantes e atualiza a contagem', async ({ page }) => {
    await openExplorer(page, '?theme=Maria&theme=Ros%C3%A1rio');

    // AND estrito com 2 temas: só 1 doc (Rosarium Virginis Mariae).
    const countBefore = await readCount(page);
    expect(countBefore).toBe(1);
    await expect(page.getByRole('heading', { name: 'Rosarium Virginis Mariae' })).toBeVisible();

    // Remove só o chip "Rosário" — filtro passa a ser AND com {Maria}.
    await page.getByRole('button', { name: 'Remover tema: Rosário' }).click();

    // URL mantém apenas theme=Maria.
    await expect(page).toHaveURL(/theme=Maria/);
    await expect(page).not.toHaveURL(/theme=Ros%C3%A1rio/);
    await expect(page.getByRole('button', { name: 'Remover tema: Maria' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Remover tema: Rosário' })).toHaveCount(0);

    // Contagem cresce (mais docs têm "Maria") e todos os visíveis contêm Maria.
    const countAfter = await readCount(page);
    expect(countAfter).toBeGreaterThan(countBefore);

    // Docs com Maria (mas sem Rosário) que antes estavam ocultos agora aparecem.
    await expect(page.getByRole('heading', { name: 'Ineffabilis Deus' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Munificentissimus Deus' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Rosarium Virginis Mariae' })).toBeVisible();

    // Doc sem "Maria" continua fora (AND estrito com {Maria}).
    await expect(page.getByRole('heading', { name: 'Rerum Novarum' })).toHaveCount(0);
  });

  test('realce <mark> aparece ao hidratar via ?q= e persiste após reload', async ({ page }) => {
    await openExplorer(page, '?q=Laudato');

    // Estado hidratado da URL: input preenchido, chip de busca e <mark> nos cards.
    await expect(page.getByPlaceholder('Buscar documento, autor ou tema...')).toHaveValue('Laudato');
    await expect(page.getByRole('button', { name: 'Remover busca: Laudato' })).toBeVisible();
    const mark = page.locator('mark', { hasText: 'Laudato' });
    await expect(mark.first()).toBeVisible();
    const countBefore = await mark.count();
    expect(countBefore).toBeGreaterThan(0);

    // Reload — realce e estado devem persistir.
    await page.reload();
    await page.getByPlaceholder('Buscar documento, autor ou tema...').waitFor();
    await expect(page).toHaveURL(/[?&]q=Laudato/);
    await expect(page.getByPlaceholder('Buscar documento, autor ou tema...')).toHaveValue('Laudato');
    const markAfter = page.locator('mark', { hasText: 'Laudato' });
    await expect(markAfter.first()).toBeVisible();
    expect(await markAfter.count()).toBe(countBefore);
  });
});

test.describe('Magistério Explorer — mobile (390×844)', () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test('chips, “Limpar tudo” e teclado sincronizam URL em viewport mobile', async ({ page }) => {
    await openExplorer(page, '?cat=Enc%C3%ADclicas&theme=F%C3%A9&topic=medo');

    const catChip = page.getByRole('button', { name: 'Remover categoria: Encíclicas' });
    const themeChip = page.getByRole('button', { name: 'Remover tema: Fé' });
    const clearAll = page.getByRole('button', { name: /Limpar tudo/i });

    // Chips e botão renderizados e visíveis no viewport pequeno.
    await expect(catChip).toBeVisible();
    await expect(themeChip).toBeVisible();
    await expect(clearAll).toBeVisible();

    // Região de filtros ativos com landmark acessível.
    await expect(page.getByRole('region', { name: 'Filtros ativos' })).toBeVisible();

    // Tap no chip de tema (interação primária em mobile) → URL sincroniza.
    await themeChip.tap();
    await expect(page).not.toHaveURL(/[?&]theme=/);
    await expect(page).toHaveURL(/cat=Enc%C3%ADclicas/);
    await expect(page).toHaveURL(/topic=medo/);

    // Teclado (bluetooth/externo) permanece funcional em mobile.
    await catChip.focus();
    await expect(catChip).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(page).not.toHaveURL(/[?&]cat=/);
    await expect(page).toHaveURL(/topic=medo/);

    // "Limpar tudo" via tap remove filtros mas preserva topic externo.
    // Rehidrata estado para garantir presença do botão.
    await openExplorer(page, '?q=vida&cat=Enc%C3%ADclicas&theme=Vida&topic=medo');
    await page.getByRole('button', { name: /Limpar tudo/i }).tap();
    await expect(page).not.toHaveURL(/[?&](q|cat|theme|sort)=/);
    await expect(page).toHaveURL(/topic=medo/);
  });
});

test.describe('Magistério Explorer — ordenação com múltiplos temas', () => {
  test('alternar sort com AND estrito de 2 temas mantém coerência cronológica', async ({ page }) => {
    // "Maria" isolado retorna ≥3 docs de anos distintos, permitindo aferir ordem.
    await openExplorer(page, '?theme=Maria');

    async function collectYears(): Promise<number[]> {
      const raw = await page.locator('span.tracking-widest').allInnerTexts();
      return raw.map(y => Number(y.trim())).filter(y => Number.isFinite(y));
    }

    // 1) Ordem canônica default (sem ?sort= na URL).
    await expect(page).not.toHaveURL(/[?&]sort=/);
    const canonical = await collectYears();
    expect(canonical.length).toBeGreaterThanOrEqual(3);

    // 2) chronological-asc — todos crescentes.
    const sortBtn = page.getByRole('button', { name: /Ordem canônica|Cronológica/ });
    await sortBtn.click();
    await expect(page).toHaveURL(/[?&]sort=chronological-asc/);
    await expect(page).toHaveURL(/theme=Maria/);
    const asc = await collectYears();
    expect(asc.length).toBe(canonical.length);
    for (let i = 0; i < asc.length - 1; i++) {
      expect(asc[i]).toBeLessThanOrEqual(asc[i + 1]);
    }

    // 3) chronological-desc — todos decrescentes.
    await sortBtn.click();
    await expect(page).toHaveURL(/[?&]sort=chronological-desc/);
    await expect(page).toHaveURL(/theme=Maria/);
    const desc = await collectYears();
    expect(desc.length).toBe(canonical.length);
    for (let i = 0; i < desc.length - 1; i++) {
      expect(desc[i]).toBeGreaterThanOrEqual(desc[i + 1]);
    }
    // asc reverso ≡ desc — coerência forte.
    expect(desc).toEqual([...asc].reverse());

    // 4) Adiciona segundo tema mantendo sort=desc: AND estrito não quebra ordenação.
    await page.getByRole('button', { name: 'Rosário', exact: true }).first().click();
    await expect(page).toHaveURL(/theme=Maria/);
    await expect(page).toHaveURL(/theme=Ros%C3%A1rio/);
    await expect(page).toHaveURL(/[?&]sort=chronological-desc/);
    const andYears = await collectYears();
    // Subconjunto (AND reduz), mas ainda ordenado desc.
    expect(andYears.length).toBeLessThanOrEqual(desc.length);
    expect(andYears.length).toBeGreaterThan(0);
    for (let i = 0; i < andYears.length - 1; i++) {
      expect(andYears[i]).toBeGreaterThanOrEqual(andYears[i + 1]);
    }
  });
});
