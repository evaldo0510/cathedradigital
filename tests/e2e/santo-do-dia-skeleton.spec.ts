import { test, expect, type Page } from '@playwright/test';

/**
 * Santo do Dia — Skeletons, layout estável, aria-live sem duplicação,
 * estado de erro em pt-BR e shimmer respeitando prefers-reduced-motion.
 *
 * Estratégia:
 * - Delegamos a resposta do Supabase REST via `page.route` para controlar
 *   loading (delay) e erro (500), simulando as duas fases do ciclo.
 * - Layout estável = mesma altura do container antes e depois da resolução.
 * - aria-live polite deve existir em UMA fonte única (Saints.tsx). Skeletons
 *   NÃO usam aria-live para evitar anúncio duplicado.
 */

const DAILY_URL = '/santos?date=2026-07-20';

async function routeSaintsWithDelay(page: Page, delayMs: number) {
  await page.route('**/rest/v1/saints*', async (route) => {
    await new Promise((r) => setTimeout(r, delayMs));
    await route.continue();
  });
}

async function routeSaintsFail(page: Page) {
  await page.route('**/rest/v1/saints*', async (route) => {
    await route.fulfill({
      status: 500,
      contentType: 'application/json',
      body: JSON.stringify({ message: 'boom' }),
    });
  });
}

test.describe('Santo do Dia · Loading, Erro, Shimmer, A11y', () => {
  test('mostra skeletons com aria-busy enquanto carrega', async ({ page }) => {
    await routeSaintsWithDelay(page, 1200);
    await page.goto(DAILY_URL);

    const hero = page.getByTestId('santo-do-dia-hero-skeleton');
    const secondary = page.getByTestId('santo-do-dia-secondary-skeleton');

    await expect(hero).toBeVisible({ timeout: 3000 });
    await expect(hero).toHaveAttribute('aria-busy', 'true');
    await expect(hero).toHaveAttribute('aria-hidden', 'true');
    await expect(secondary).toHaveAttribute('aria-busy', 'true');

    // Nenhum elemento focável dentro do skeleton do hero.
    const focusables = await hero.locator(
      'button, a, [tabindex]:not([tabindex="-1"]), input, select, textarea',
    ).count();
    expect(focusables).toBe(0);
  });

  test('layout permanece estável entre skeleton e conteúdo', async ({ page }) => {
    await routeSaintsWithDelay(page, 800);
    await page.setViewportSize({ width: 1280, height: 1800 });
    await page.goto(DAILY_URL);

    const skeleton = page.getByTestId('santo-do-dia-hero-skeleton');
    await expect(skeleton).toBeVisible();
    const before = await skeleton.boundingBox();
    expect(before).not.toBeNull();

    // Espera o hero real
    const heroTitle = page.getByRole('heading', { level: 2 });
    await expect(heroTitle.first()).toBeVisible({ timeout: 10000 });

    const heroArticle = page.locator('article[aria-labelledby="santo-do-dia-title"]');
    await expect(heroArticle).toBeVisible();
    const after = await heroArticle.boundingBox();
    expect(after).not.toBeNull();

    // Tolerância generosa: altura e topo próximos (sem layout shift severo).
    const dTop = Math.abs((after!.y) - (before!.y));
    const dHeight = Math.abs((after!.height) - (before!.height));
    expect(dTop).toBeLessThan(32);
    expect(dHeight).toBeLessThan(220);
  });

  test('não expõe aria-live duplicado durante o carregamento', async ({ page }) => {
    await routeSaintsWithDelay(page, 1500);
    await page.goto(DAILY_URL);

    // Painel do modo "daily"
    const panel = page.locator('#panel-daily');
    await expect(panel).toBeVisible();

    // Deve haver exatamente 1 região polite dentro do painel (Saints.tsx).
    const polite = panel.locator('[aria-live="polite"]');
    await expect(polite).toHaveCount(1);

    // Skeletons NÃO devem carregar aria-live.
    const skeletonLive = page
      .getByTestId('santo-do-dia-hero-skeleton')
      .locator('[aria-live]');
    await expect(skeletonLive).toHaveCount(0);

    // Texto anunciado é único e coerente com o carregamento.
    await expect(polite).toContainText(/Carregando santos do dia/i);
  });

  test('substitui skeleton por hero com dados/fallbacks', async ({ page }) => {
    await routeSaintsWithDelay(page, 400);
    await page.goto(DAILY_URL);

    await expect(page.getByTestId('santo-do-dia-hero-skeleton')).toBeVisible();

    // Após carregar, o skeleton some e o hero real aparece.
    await expect(
      page.locator('article[aria-labelledby="santo-do-dia-title"]'),
    ).toBeVisible({ timeout: 10000 });
    await expect(page.getByTestId('santo-do-dia-hero-skeleton')).toHaveCount(0);

    // CTAs reais existem e estão habilitados (foco visível).
    const cta = page.getByRole('button', { name: /Conhecer a história/i });
    await expect(cta).toBeVisible();
    await expect(cta).toBeEnabled();
    await cta.focus();
    await expect(cta).toBeFocused();
  });

  test('erro na carga mostra mensagem pt-BR e botão de tentar novamente', async ({ page }) => {
    await routeSaintsFail(page);
    await page.goto(DAILY_URL);

    const alertBox = page.getByTestId('saints-fetch-error');
    await expect(alertBox).toBeVisible({ timeout: 10000 });
    await expect(alertBox).toHaveAttribute('role', 'alert');
    await expect(alertBox).toContainText(/Não foi possível carregar os santos do dia\./);

    const retry = alertBox.getByRole('button', { name: /Tentar novamente/i });
    await expect(retry).toBeVisible();
    await expect(retry).toBeEnabled();

    // Só o alerta assertivo — sem polite duplicado emitindo carregamento.
    const politeText = await page
      .locator('#panel-daily [aria-live="polite"]')
      .first()
      .textContent();
    expect(politeText || '').not.toMatch(/Carregando/i);
  });

  test('shimmer respeita prefers-reduced-motion (sem animação)', async ({ browser }) => {
    const context = await browser.newContext({ reducedMotion: 'reduce' });
    const page = await context.newPage();
    await routeSaintsWithDelay(page, 1500);
    await page.goto(DAILY_URL);

    const bar = page
      .getByTestId('santo-do-dia-hero-skeleton')
      .locator('.cathedra-shimmer')
      .first();
    await expect(bar).toBeVisible();

    const animationName = await bar.evaluate(
      (el) => getComputedStyle(el).animationName,
    );
    expect(animationName).toBe('none');

    await context.close();
  });

  test('shimmer roda por padrão (sem reduced-motion)', async ({ browser }) => {
    const context = await browser.newContext({ reducedMotion: 'no-preference' });
    const page = await context.newPage();
    await routeSaintsWithDelay(page, 1500);
    await page.goto(DAILY_URL);

    const bar = page
      .getByTestId('santo-do-dia-hero-skeleton')
      .locator('.cathedra-shimmer')
      .first();
    await expect(bar).toBeVisible();

    const animationName = await bar.evaluate(
      (el) => getComputedStyle(el).animationName,
    );
    expect(animationName).toContain('cathedra-shimmer');

    await context.close();
  });
});
