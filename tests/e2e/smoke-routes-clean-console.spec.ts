/**
 * Smoke test — percorre todas as rotas públicas indexáveis do ROUTE_META
 * e falha se qualquer uma dispara:
 *   - console.error
 *   - page.on('pageerror') (exceção JS não tratada)
 *   - runtime errors capturados pelo window.__cathedraRuntimeErrors
 *
 * Rotas administrativas, aliases (noindex) e padrões dinâmicos (`:id`) são
 * ignorados. Padrões dinâmicos são cobertos por specs dedicadas.
 *
 * Ruído esperado (React Router v7 warnings, 404 de terceiros, etc.) fica na
 * lista `ALLOWLIST_PATTERNS` — mantenha-a enxuta e justificada.
 */
import { test, expect, ConsoleMessage } from '@playwright/test';
import { ROUTE_META } from '../../src/config/routeMeta';

const ALLOWLIST_PATTERNS: RegExp[] = [
  /React Router Future Flag/i,
  /v7_startTransition/i,
  /v7_relativeSplatPath/i,
  /Download the React DevTools/i,
  /\[HMR\]/i,
  /net::ERR_ABORTED/i, // navegação cancelada por nova navegação
];

const IGNORE_ROUTES = new Set<string>([
  // rotas que exigem infraestrutura externa ou fluxo de auth completo
  '/auth/callback',
]);

const PUBLIC_ROUTES = Object.entries(ROUTE_META)
  .filter(([p, meta]) => !meta.noindex && !p.includes(':') && !IGNORE_ROUTES.has(p))
  .map(([p]) => p)
  .sort();

function isAllowed(text: string) {
  return ALLOWLIST_PATTERNS.some((rx) => rx.test(text));
}

test.describe('smoke: rotas públicas sem console.error / exception', () => {
  test.describe.configure({ mode: 'parallel' });

  for (const path of PUBLIC_ROUTES) {
    test(`sem erros em ${path}`, async ({ page }) => {
      const consoleErrors: string[] = [];
      const pageErrors: string[] = [];

      page.on('console', (msg: ConsoleMessage) => {
        if (msg.type() !== 'error') return;
        const text = msg.text();
        if (isAllowed(text)) return;
        consoleErrors.push(text);
      });

      page.on('pageerror', (err) => {
        const text = `${err.name}: ${err.message}`;
        if (isAllowed(text)) return;
        pageErrors.push(`${text}\n${err.stack ?? ''}`);
      });

      const res = await page.goto(path, { waitUntil: 'networkidle', timeout: 30_000 });
      expect(res, `sem resposta em ${path}`).not.toBeNull();
      expect(res!.status(), `status HTTP inválido em ${path}`).toBeLessThan(500);

      // Dá tempo para efeitos assíncronos (queries, hidratação) dispararem eventuais erros.
      await page.waitForTimeout(1200);

      // Runtime errors capturados pelo runtimeErrorLogger (window.onerror + unhandledrejection)
      const runtimeErrors = await page.evaluate(() => {
        const api = (window as unknown as {
          __cathedraRuntimeErrors?: { get?: () => Array<{ message: string; type: string }> };
        }).__cathedraRuntimeErrors;
        return api?.get?.() ?? [];
      });
      const runtimeFiltered = runtimeErrors.filter((r) => !isAllowed(r.message));

      const problems = [
        ...consoleErrors.map((e) => `console.error: ${e}`),
        ...pageErrors.map((e) => `pageerror: ${e}`),
        ...runtimeFiltered.map((r) => `runtime ${r.type}: ${r.message}`),
      ];

      expect(problems, `Erros em ${path}:\n${problems.join('\n---\n')}`).toEqual([]);
    });
  }
});
