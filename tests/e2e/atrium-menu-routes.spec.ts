import { test, expect } from '@playwright/test';

/**
 * Valida que cada item do menu do Átrio (HomeUnified) navega para a
 * rota canônica correta e nunca cai em rota inexistente (/rezar,
 * /formacao, /minha-jornada, etc.).
 *
 * Cobre a regressão do bug em que o mapeamento manual do <Link to>
 * enviava 'rezar' → /rezar (404) em vez de /oracao.
 */

type MenuItem = {
  atriumKey: string;
  expectedPath: string;
  label: string;
};

const MENU_ITEMS: MenuItem[] = [
  { atriumKey: 'estudar',       expectedPath: '/bible',    label: 'Estudar (Bíblia)' },
  { atriumKey: 'rezar',         expectedPath: '/oracao',   label: 'Rezar' },
  { atriumKey: 'pesquisar',     expectedPath: '/buscar',   label: 'Pesquisar' },
  { atriumKey: 'formar-se',     expectedPath: '/jornadas', label: 'Formar-se' },
  { atriumKey: 'minha-jornada', expectedPath: '/hoje',     label: 'Minha Jornada' },
];

test.describe('Átrio · itens do menu apontam para rotas canônicas', () => {
  test.beforeEach(async ({ page }) => {
    // Falha o teste se aparecer 404 no console (rota inexistente).
    page.on('console', (msg) => {
      if (msg.type() === 'error' && /404:\s*rota inexistente/.test(msg.text())) {
        throw new Error(`404 disparado no console: ${msg.text()}`);
      }
    });
  });

  for (const item of MENU_ITEMS) {
    test(`link "${item.label}" → ${item.expectedPath}`, async ({ page }) => {
      await page.goto('/', { waitUntil: 'domcontentloaded' });

      const link = page.locator(`[data-testid="atrium-block"][data-atrium-key="${item.atriumKey}"]`);
      await expect(link, `Bloco ${item.atriumKey} deveria estar visível no Átrio`).toBeVisible({ timeout: 10000 });

      // Confirma que o href já aponta para a rota canônica ANTES do clique
      const href = await link.getAttribute('href');
      expect(href, `href do bloco ${item.atriumKey}`).toBe(item.expectedPath);

      await Promise.all([
        page.waitForURL(new RegExp(`${item.expectedPath.replace(/\//g, '\\/')}(\\?|$|#)`), { timeout: 15000 }),
        link.click(),
      ]);

      // A URL final deve conter o caminho esperado e NÃO deve ter caído no /404
      expect(new URL(page.url()).pathname).toBe(item.expectedPath);

      // A página não deve renderizar o componente NotFound
      await expect(page.locator('text=/página não encontrada|not\\s*found/i')).toHaveCount(0);
    });
  }



  test('rota /diario abre sem erros (Diário Espiritual)', async ({ page }) => {
    const consoleErrors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') consoleErrors.push(msg.text());
    });

    const response = await page.goto('/diario', { waitUntil: 'domcontentloaded' });
    expect(response, 'resposta HTTP de /diario').toBeTruthy();
    expect(response!.status(), 'status HTTP de /diario').toBeLessThan(400);

    // A rota é protegida por AuthGuard: aceita render do diário ou redirecionamento para auth.
    await page.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => {});
    const path = new URL(page.url()).pathname;
    expect(path, `pathname final ao abrir /diario (foi: ${path})`).toMatch(/^\/(diario|auth|login)/);

    // Não pode cair na NotFound
    await expect(page.locator('text=/página não encontrada|not\\s*found/i')).toHaveCount(0);

    // Nenhum 404 de rota inexistente no console
    const has404 = consoleErrors.some((t) => /404:\s*rota inexistente/.test(t));
    expect(has404, `console errors: ${consoleErrors.join(' | ')}`).toBe(false);
  });
});

/**
 * Estado ativo: após navegar para a rota canônica de um item do menu,
 * o link correspondente (Sidebar/BottomNav) deve receber aria-current="page".
 * Cobre a regressão em que múltiplos itens ficavam ativos ao mesmo tempo.
 */
test.describe('Menu · estado ativo (aria-current="page")', () => {
  const ACTIVE_ROUTES = [
    { path: '/bible',    label: /Bíblia/i },
    { path: '/oracao',   label: /Orações|Rezar/i },
    { path: '/buscar',   label: /Busca|Pesquisar/i },
    { path: '/jornadas', label: /Jornadas|Formar/i },
    { path: '/hoje',     label: /Hoje/i },
  ] as const;

  for (const { path, label } of ACTIVE_ROUTES) {
    test(`ao abrir ${path}, apenas o item correspondente fica aria-current="page"`, async ({ page }) => {
      await page.goto(path, { waitUntil: 'domcontentloaded' });
      await page.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => {});

      const active = page
        .locator('a[aria-current="page"], button[aria-current="page"]')
        .filter({ hasText: label });
      await expect(active.first(), `nenhum item ativo para ${path}`).toBeVisible({ timeout: 10000 });

      const allActive = page.locator('a[aria-current="page"], button[aria-current="page"]');
      const activeHrefs = await allActive.evaluateAll((els) =>
        els
          .map((el) => (el as HTMLAnchorElement).getAttribute('href'))
          .filter((h): h is string => !!h && h.startsWith('/') && !h.includes('#')),
      );
      const uniquePaths = new Set(activeHrefs.map((h) => h.split(/[?#]/)[0]));
      expect(uniquePaths.size, `rotas ativas: ${[...uniquePaths].join(', ')}`).toBeLessThanOrEqual(1);
    });
  }
});

/**
 * Rotas protegidas por AuthGuard: sem sessão, devem redirecionar para /auth
 * SEM cair em NotFound e SEM 404 no console.
 */
test.describe('Menu · rotas com auth redirecionam sem 404', () => {
  const GUARDED = ['/diario', '/favorites', '/achievements', '/profile', '/settings'] as const;

  for (const path of GUARDED) {
    test(`GET ${path} sem sessão → /auth (nunca 404/NotFound)`, async ({ page }) => {
      const consoleErrors: string[] = [];
      page.on('console', (msg) => {
        if (msg.type() === 'error') consoleErrors.push(msg.text());
      });

      const response = await page.goto(path, { waitUntil: 'domcontentloaded' });
      expect(response, `resposta HTTP de ${path}`).toBeTruthy();
      expect(response!.status(), `status HTTP de ${path}`).toBeLessThan(400);

      await page.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => {});

      const finalPath = new URL(page.url()).pathname;
      expect(finalPath, `pathname final ao abrir ${path} (foi: ${finalPath})`).toMatch(/^\/(auth|login)/);

      await expect(page.locator('text=/página não encontrada|not\\s*found/i')).toHaveCount(0);
      await expect(page.getByRole('heading', { name: '404' })).toHaveCount(0);

      const has404 = consoleErrors.some((t) => /404:\s*rota inexistente/.test(t));
      expect(has404, `console errors: ${consoleErrors.join(' | ')}`).toBe(false);
    });
  }
});
