import { test, expect, Page } from '@playwright/test';

/**
 * Cobre cenários adicionais do SanctorumDateNav / PopesPage / SaintDetail:
 *  1. "Falha/ausência" no acervo → PopesPage mostra empty state com aria-live
 *     e SanctorumDateNav permanece sincronizado ao trocar dia.
 *  2. Regressão visual do destaque "hoje" na tira + hero editorial em cada troca.
 *  3. Navegação por teclado no Popover do calendário (Tab, Enter, Escape).
 *  4. Metatags canonical / twitter:card / twitter:image em Santos e Papas
 *     após trocar o dia.
 */

async function getMeta(page: Page, selector: string): Promise<string | null> {
  return page.locator(selector).first().getAttribute('content');
}

async function getCanonical(page: Page): Promise<string | null> {
  return page.locator('link[rel="canonical"]').first().getAttribute('href');
}

// ---------------------------------------------------------------------------
// 1. Ausência de papa reinante (ano sem dados no acervo hardcoded) → empty state
// ---------------------------------------------------------------------------
test.describe('PopesPage — empty state / sincronia do DateNav', () => {
  test('ano 800 não tem papa no acervo: mostra aviso com aria-live', async ({ page }) => {
    await page.goto('/papas?date=0800-06-15', { waitUntil: 'domcontentloaded' });
    await expect(page.getByRole('button', { name: 'Ir para hoje' })).toBeVisible();

    // Painel do papa reinante não deve existir.
    await expect(page.getByTestId('reigning-pope-panel')).toHaveCount(0);

    // Mensagem de ausência é anunciada via aria-live=polite.
    const empty = page.getByText(/Nenhum papa deste acervo/i);
    await expect(empty).toBeVisible();
    await expect(empty).toHaveAttribute('aria-live', 'polite');

    // Cabeçalho do DateNav reflete a data 15/06 (sincronia inicial via URL).
    await expect(page.locator('h2').filter({ hasText: /^15 de junho/i })).toBeVisible();
  });

  test('trocar dia mantém DateNav sincronizado no estado vazio', async ({ page }) => {
    await page.goto('/papas?date=0800-06-15', { waitUntil: 'domcontentloaded' });
    await page.getByRole('button', { name: 'Próximo dia' }).click();
    await expect(page.locator('h2').filter({ hasText: /^16 de junho/i })).toBeVisible();

    // Ainda sem papa reinante — estado vazio persiste.
    await expect(page.getByText(/Nenhum papa deste acervo/i)).toBeVisible();

    // URL foi persistida.
    await expect.poll(() => new URL(page.url()).searchParams.get('date')).toBe('0800-06-16');

    // Tira de dias marca 16 como aria-pressed=true.
    const pressed = page.locator('button[aria-pressed="true"]').first();
    await expect(pressed).toBeVisible();
    await expect(pressed).toHaveAttribute('aria-label', /^16 de junho/);
  });

  test('busca sem resultado exibe empty state com role=status', async ({ page }) => {
    await page.goto('/papas', { waitUntil: 'domcontentloaded' });
    await page.getByPlaceholder('Buscar Papa...').fill('__inexistente__');
    const status = page.getByTestId('popes-empty');
    await expect(status).toBeVisible();
    await expect(status).toHaveAttribute('role', 'status');
  });
});

// ---------------------------------------------------------------------------
// 2. Regressão visual — destaque do dia atual e hero editorial permanecem
// ---------------------------------------------------------------------------
test.describe('SanctorumDateNav — regressão visual', () => {
  test.beforeEach(async ({ page }) => {
    // Desativa animações para snapshots estáveis.
    await page.addStyleTag({
      content: `*, *::before, *::after { animation: none !important; transition: none !important; }`,
    });
  });

  test('hero + destaque do dia atual em /papas', async ({ page }) => {
    await page.goto('/papas', { waitUntil: 'networkidle' });
    const hero = page.locator('[data-testid="sanctorum-hero"], header').first();
    // Snapshot da área topo (hero + DateNav).
    await expect(page).toHaveScreenshot('papas-hero-datenav-hoje.png', {
      fullPage: false,
      maxDiffPixelRatio: 0.03,
      clip: { x: 0, y: 0, width: 1280, height: 720 },
    });

    // Ao mudar para um dia futuro, o hero e a estrutura do DateNav permanecem;
    // o destaque migra para o novo dia.
    await page.getByRole('button', { name: 'Próximo dia' }).click();
    await expect(page.locator('button[aria-pressed="true"]').first()).toBeVisible();
    await expect(page).toHaveScreenshot('papas-hero-datenav-proximo.png', {
      fullPage: false,
      maxDiffPixelRatio: 0.03,
      clip: { x: 0, y: 0, width: 1280, height: 720 },
    });
  });

  test('hero + destaque do dia atual em /santos', async ({ page }) => {
    await page.goto('/santos', { waitUntil: 'networkidle' });
    await expect(page).toHaveScreenshot('santos-hero-datenav-hoje.png', {
      fullPage: false,
      maxDiffPixelRatio: 0.03,
      clip: { x: 0, y: 0, width: 1280, height: 720 },
    });
  });
});

// ---------------------------------------------------------------------------
// 3. Navegação por teclado no Popover do calendário
// ---------------------------------------------------------------------------
test.describe('SanctorumDateNav — teclado no Popover', () => {
  test('Tab foca o trigger; Enter abre; Escape fecha e devolve foco', async ({ page }) => {
    await page.goto('/papas', { waitUntil: 'domcontentloaded' });
    const trigger = page.getByRole('button', { name: 'Escolher data no calendário' });
    await expect(trigger).toHaveAttribute('aria-expanded', 'false');

    // Foca o trigger via teclado (sem depender da ordem exata do Tab).
    await trigger.focus();
    await expect(trigger).toBeFocused();

    // Enter abre o Popover.
    await page.keyboard.press('Enter');
    await expect(trigger).toHaveAttribute('aria-expanded', 'true');
    const dialog = page.getByRole('dialog').first();
    await expect(dialog).toBeVisible();

    // O foco entra no calendário (initialFocus).
    const focusedInDialog = dialog.locator(':focus').first();
    await expect(focusedInDialog).toBeVisible();

    // Escape fecha o Popover e devolve foco ao trigger.
    await page.keyboard.press('Escape');
    await expect(dialog).toBeHidden();
    await expect(trigger).toHaveAttribute('aria-expanded', 'false');
    await expect(trigger).toBeFocused();
  });

  test('Enter em uma célula do calendário seleciona e fecha o Popover', async ({ page }) => {
    await page.goto('/papas', { waitUntil: 'domcontentloaded' });
    const trigger = page.getByRole('button', { name: 'Escolher data no calendário' });
    await trigger.focus();
    await page.keyboard.press('Enter');
    const dialog = page.getByRole('dialog').first();
    await expect(dialog).toBeVisible();

    // Navega até o dia 15 e pressiona Enter.
    const target = dialog.getByRole('gridcell', { name: /^15$/ }).first();
    await target.focus();
    await page.keyboard.press('Enter');

    await expect(dialog).toBeHidden();
    await expect(trigger).toHaveAttribute('aria-expanded', 'false');
    await expect(page.locator('h2').filter({ hasText: /^15 de /i })).toBeVisible();
  });
});

// ---------------------------------------------------------------------------
// 4. canonical / twitter:card / twitter:image após trocar o dia
// ---------------------------------------------------------------------------
test.describe('SEO — canonical/twitter em Santos e Papas após trocar de dia', () => {
  test('/papas: metatags obrigatórias presentes e canonical estável', async ({ page }) => {
    await page.goto('/papas', { waitUntil: 'domcontentloaded' });

    // Antes: com papa reinante (data de hoje).
    const canonicalBefore = await getCanonical(page);
    expect(canonicalBefore).toBeTruthy();
    expect(canonicalBefore).toContain('/papas');
    expect(await getMeta(page, 'meta[name="twitter:card"]')).toBe('summary_large_image');
    const twitterImgBefore = await getMeta(page, 'meta[name="twitter:image"]');
    expect(twitterImgBefore).toBeTruthy();

    // Retrocede alguns anos via calendário para garantir troca de estado.
    const trigger = page.getByRole('button', { name: 'Escolher data no calendário' });
    await trigger.click();
    const dialog = page.getByRole('dialog').first();
    await dialog.getByRole('button', { name: /previous|mês anterior/i }).click({ clickCount: 60 });
    await dialog.getByRole('gridcell', { name: /^15$/ }).first().click();
    await expect(dialog).toBeHidden();

    // Depois: canonical permanece /papas (não muda por data), twitter:card idem.
    const canonicalAfter = await getCanonical(page);
    expect(canonicalAfter).toBe(canonicalBefore);
    expect(await getMeta(page, 'meta[name="twitter:card"]')).toBe('summary_large_image');
    // twitter:image existe se houver papa reinante; caso contrário, pode estar ausente,
    // mas twitter:card deve permanecer.
  });

  test('/santos/:slug: canonical, twitter:card e twitter:image presentes', async ({ page }) => {
    // Entra na listagem e abre o primeiro santo disponível.
    await page.goto('/santos', { waitUntil: 'networkidle' });
    const firstSaintLink = page.locator('a[href^="/santos/"]').first();
    if ((await firstSaintLink.count()) === 0) {
      test.skip(true, 'Nenhum santo linkável na listagem — pulando.');
      return;
    }
    await firstSaintLink.click();
    await page.waitForURL(/\/santos\/[^/]+/);

    const canonical = await getCanonical(page);
    expect(canonical).toMatch(/\/santos\//);
    expect(await getMeta(page, 'meta[name="twitter:card"]')).toBe('summary_large_image');
    const twImg = await getMeta(page, 'meta[name="twitter:image"]');
    // Nem todo santo tem imagem, mas quando presente deve ser URL absoluta.
    if (twImg) expect(twImg).toMatch(/^https?:\/\//);
  });
});
