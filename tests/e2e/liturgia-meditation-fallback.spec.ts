/**
 * Simula respostas 402 (créditos esgotados) e 429 (rate limit) da Edge
 * Function `liturgy-meditation` e verifica que o aviso persistente, o
 * botão "Tentar novamente" e o link "Planos & créditos" renderizam sem
 * quebrar a página.
 *
 * Estratégia:
 *   1. Interceptar `/rest/v1/liturgy_meditations*` → devolver [] (sem cache no banco).
 *   2. Interceptar `/functions/v1/liturgy-meditation` → devolver o status desejado
 *      com payload `{ code, message }` padronizado.
 *   3. Abrir `/liturgia` e aguardar o aviso `[data-fallback-code=...]`.
 */
import { test, expect } from '@playwright/test';

const MEDITATION_ROUTE = /\/functions\/v1\/liturgy-meditation(\?|$)/;
const DB_ROUTE = /\/rest\/v1\/liturgy_meditations(\?|$)/;

async function stubMeditation(page: import('@playwright/test').Page, status: 402 | 429) {
  await page.route(DB_ROUTE, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(null),
    });
  });

  const code = status === 402 ? 'ai_credits_exhausted' : 'ai_rate_limited';
  const message =
    status === 402
      ? 'Os créditos de IA da plataforma se esgotaram.'
      : 'Muitas requisições simultâneas ao gerador de meditação.';

  let callCount = 0;
  await page.route(MEDITATION_ROUTE, async (route) => {
    callCount += 1;
    await route.fulfill({
      status,
      contentType: 'application/json',
      body: JSON.stringify({ code, message, detail: 'Simulated by e2e' }),
    });
  });
  return { getCallCount: () => callCount };
}

test.describe('Liturgia · fallback 402/429 da meditação editorial', () => {
  test.use({ viewport: { width: 1280, height: 900 } });

  test('402 (ai_credits_exhausted) exibe aviso, retry e link de planos', async ({ page }) => {
    const stub = await stubMeditation(page, 402);

    await page.goto('/liturgia');
    await page.waitForLoadState('networkidle');

    const notice = page.locator('[data-fallback-code="ai_credits_exhausted"]');
    await notice.waitFor({ state: 'visible', timeout: 15000 });

    await expect(notice).toContainText(/Créditos de IA esgotados/i);

    const retryBtn = notice.getByRole('button', { name: /Tentar gerar novamente/i });
    await expect(retryBtn).toBeVisible();
    await expect(retryBtn).toBeEnabled();

    const plansLink = notice.getByRole('link', { name: /Planos e créditos/i });
    await expect(plansLink).toBeVisible();
    await expect(plansLink).toHaveAttribute('target', '_blank');
    await expect(plansLink).toHaveAttribute('href', /plans-and-credits/);

    const callsBefore = stub.getCallCount();
    await retryBtn.click();
    // Retry deve manter o aviso (a stub continua retornando 402) e chamar
    // a função ao menos mais uma vez, sem quebrar a página.
    await expect(notice).toBeVisible();
    await expect
      .poll(() => stub.getCallCount(), { timeout: 5000 })
      .toBeGreaterThan(callsBefore);

    // Página segue funcional: não há erro de runtime visível.
    const runtimeError = page.getByText(/Algo deu errado|Something went wrong/i);
    await expect(runtimeError).toHaveCount(0);
  });

  test('429 (ai_rate_limited) exibe aviso essencial com retry', async ({ page }) => {
    await stubMeditation(page, 429);

    await page.goto('/liturgia');
    await page.waitForLoadState('networkidle');

    const notice = page.locator('[data-fallback-code="ai_rate_limited"]');
    await notice.waitFor({ state: 'visible', timeout: 15000 });

    await expect(notice).toContainText(/Meditação em modo essencial/i);
    await expect(notice.getByRole('button', { name: /Tentar gerar novamente/i })).toBeVisible();

    // No 429 não há CTA de planos.
    await expect(notice.getByRole('link', { name: /Planos e créditos/i })).toHaveCount(0);
  });
});
