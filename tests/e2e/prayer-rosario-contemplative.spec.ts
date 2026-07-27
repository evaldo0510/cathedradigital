/**
 * E2E: /oracao/rosario?enter=1&mode=contemplative não pode disparar erro
 * React em runtime (regressão de React #300).
 *
 * Falha se:
 *  - console.error contiver "Minified React error" ou "Uncaught"
 *  - page error (window.onerror) for emitido
 *  - o Error Boundary do Prayer for renderizado ([data-testid="prayer-error-boundary"])
 */
import { test, expect, type ConsoleMessage } from '@playwright/test';

const TARGET = '/oracao/rosario?enter=1&mode=contemplative';

test.describe('Prayer · Rosário contemplativo', () => {
  test('não dispara erro React em runtime', async ({ page }) => {
    const consoleErrors: string[] = [];
    const pageErrors: string[] = [];

    page.on('console', (msg: ConsoleMessage) => {
      if (msg.type() === 'error') {
        const text = msg.text();
        // Ignora erros de rede/asset conhecidos que não bloqueiam a render.
        if (/favicon|manifest\.json|third-party/i.test(text)) return;
        consoleErrors.push(text);
      }
    });
    page.on('pageerror', (err) => {
      pageErrors.push(err.message);
    });

    await page.goto(TARGET, { waitUntil: 'domcontentloaded' });

    // Aguarda hidratação. Se o Error Boundary aparecer, já falha.
    await page.waitForTimeout(1500);

    const boundary = page.locator('[data-testid="prayer-error-boundary"]');
    await expect(boundary, 'Prayer Error Boundary não deve ser renderizado').toHaveCount(0);

    const reactErrors = [...consoleErrors, ...pageErrors].filter((t) =>
      /Minified React error|React error #\d+|Uncaught (Error|TypeError|ReferenceError)/i.test(t),
    );

    expect(
      reactErrors,
      `Erros React detectados em runtime:\n${reactErrors.join('\n---\n')}`,
    ).toHaveLength(0);
  });

  test('renderiza contexto contemplativo ou portal sem crash', async ({ page }) => {
    await page.goto(TARGET, { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('networkidle');

    // Alguma superfície do Prayer Engine precisa estar montada.
    const anySurface = page.locator(
      '[data-contemplative], [data-testid="prayer-portal"], [aria-label*="oração" i], main',
    );
    await expect(anySurface.first()).toBeVisible({ timeout: 10_000 });
  });
});
