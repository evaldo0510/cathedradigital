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
