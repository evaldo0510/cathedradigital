/**
 * Redirects legados que apontam para /admin/* — botão Voltar
 *
 * Aliases cobertos:
 *   /telemetry → /admin/telemetry
 *   /security  → /admin/security
 *
 * Sem sessão, o AdminGuard redireciona /admin/* para "/". Este spec valida:
 *  1. O alias legado NÃO fica no history (usa <Navigate replace>).
 *  2. Após o AdminGuard levar a "/", o goBack retorna à âncora original,
 *     sem loop entre alias ⇄ /admin/* ⇄ "/".
 *  3. Quando existe sessão válida (via LOVABLE_BROWSER_SUPABASE_* injetados),
 *     o alias abre a tela /admin/* e o goBack volta à âncora mantendo
 *     a autenticação (a sessão permanece em localStorage/cookies).
 */
import { test, expect, type BrowserContext, type Page } from '@playwright/test';

const ANCHOR = '/buscar';

const ADMIN_LEGACY: Array<[string, string]> = [
  ['/telemetry', '/admin/telemetry'],
  ['/security', '/admin/security'],
];

async function restoreSupabaseSession(context: BrowserContext, page: Page): Promise<boolean> {
  const storageKey = process.env.LOVABLE_BROWSER_SUPABASE_STORAGE_KEY;
  const sessionJson = process.env.LOVABLE_BROWSER_SUPABASE_SESSION_JSON;
  const cookiesJson = process.env.LOVABLE_BROWSER_SUPABASE_COOKIES_JSON;
  const authStatus = process.env.LOVABLE_BROWSER_AUTH_STATUS;

  if (authStatus !== 'injected' || (!sessionJson && !cookiesJson)) return false;

  if (cookiesJson) {
    try {
      const cookies = JSON.parse(cookiesJson).map((c: Record<string, unknown>) => ({
        ...c,
        url: 'http://127.0.0.1:8080',
      }));
      await context.addCookies(cookies);
    } catch {
      /* ignore */
    }
  }
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  if (storageKey && sessionJson) {
    await page.evaluate(
      ([k, v]) => window.localStorage.setItem(k as string, v as string),
      [storageKey, sessionJson],
    );
  }
  return true;
}

test.describe('Redirects legados → /admin/* — sem sessão, back sai limpo', () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  for (const [from, adminTarget] of ADMIN_LEGACY) {
    test(`sem sessão: back após ${from} não fica preso em ${adminTarget}`, async ({
      page,
      context,
    }) => {
      await context.clearCookies();

      // 1. Âncora estável.
      await page.goto(ANCHOR, { waitUntil: 'domcontentloaded' });
      await expect(page).toHaveURL(new RegExp(ANCHOR + '$'));

      // 2. Alias legado → AdminGuard leva a "/" (ou mantém spinner em /admin).
      await page.goto(from, { waitUntil: 'domcontentloaded' });
      // Aguarda o AdminGuard resolver (ou o próprio alias já ter redirecionado).
      await page.waitForTimeout(600);

      const afterPath = new URL(page.url()).pathname;
      // Aceita: "/" (guard resolveu), ou ainda no destino /admin/* (spinner),
      // mas NUNCA no alias original.
      expect(afterPath, `alias ${from} não deveria persistir no URL`).not.toBe(from);
      expect(
        afterPath === '/' || afterPath.startsWith(adminTarget),
        `estado inesperado após ${from}: ${afterPath}`,
      ).toBe(true);

      // Nunca cai no NotFound.
      await expect(page.locator('h1', { hasText: /^404$/ })).toHaveCount(0);

      // 3. goBack — deve retornar à âncora, sem loop.
      await page.goBack({ waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(300);
      const backPath = new URL(page.url()).pathname;

      expect(backPath, `back reabriu o alias ${from}`).not.toBe(from);
      expect(
        backPath === ANCHOR || backPath.startsWith(ANCHOR),
        `back deveria retornar a ${ANCHOR}, chegou em ${backPath}`,
      ).toBe(true);
    });
  }
});

test.describe('Redirects legados → /admin/* — com sessão, back preserva autenticação', () => {
  for (const [from, adminTarget] of ADMIN_LEGACY) {
    test(`com sessão: back após ${from} → ${adminTarget} mantém auth`, async ({
      page,
      context,
    }) => {
      const restored = await restoreSupabaseSession(context, page);
      if (!restored) {
        test.skip(true, 'sessão Supabase não injetada (LOVABLE_BROWSER_AUTH_STATUS != injected)');
        return;
      }

      // 1. Âncora com sessão ativa.
      await page.goto(ANCHOR, { waitUntil: 'domcontentloaded' });
      const storageKey = process.env.LOVABLE_BROWSER_SUPABASE_STORAGE_KEY!;
      const sessionBefore = await page.evaluate(
        (k) => window.localStorage.getItem(k),
        storageKey,
      );
      expect(sessionBefore, 'sessão deveria estar em localStorage').toBeTruthy();

      // 2. Alias legado → destino /admin/*.
      await page.goto(from, { waitUntil: 'domcontentloaded' });
      await page
        .waitForFunction(
          (t) => window.location.pathname.startsWith(t),
          adminTarget,
          { timeout: 8000 },
        )
        .catch(() => {});
      const afterPath = new URL(page.url()).pathname;
      // Admin válido → chegou ao destino. Não-admin → redireciona a "/".
      expect(
        afterPath.startsWith(adminTarget) || afterPath === '/',
        `estado inesperado: ${afterPath}`,
      ).toBe(true);
      expect(afterPath, 'alias ficou no URL').not.toBe(from);

      // 3. Back → âncora, sem loop.
      await page.goBack({ waitUntil: 'domcontentloaded' });
      const backPath = new URL(page.url()).pathname;
      expect(backPath, 'back reabriu alias').not.toBe(from);
      expect(
        backPath === ANCHOR || backPath.startsWith(ANCHOR),
        `back deveria retornar a ${ANCHOR}, chegou em ${backPath}`,
      ).toBe(true);

      // 4. Sessão continua válida.
      const sessionAfter = await page.evaluate(
        (k) => window.localStorage.getItem(k),
        storageKey,
      );
      expect(sessionAfter, 'sessão perdida após back').toBeTruthy();
      expect(sessionAfter).toBe(sessionBefore);
    });
  }
});
