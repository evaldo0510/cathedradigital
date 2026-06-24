import { test, expect, Page, BrowserContext } from '@playwright/test';

/**
 * Persistência e sincronização cross-device da preferência de alto contraste.
 *
 * 1) Liga o modo, recarrega a página e garante que o atributo permanece.
 * 2) Simula "outro dispositivo": novo contexto isolado, restaura a sessão do
 *    mesmo usuário a partir do storageState e confere que o servidor (profile)
 *    hidrata o estado mesmo com localStorage vazio.
 */

const STORAGE_KEY = 'cathedra:nexus-high-contrast';
const ATTR = 'data-nexus-contrast';

async function openBibleChapter(page: Page) {
  await page.goto('/bible?book=Gn&ch=1');
  await page.waitForSelector('[data-testid^="verse-text-"]', { timeout: 20_000 });
}

async function getContrastAttr(page: Page) {
  return page.locator('html').getAttribute(ATTR);
}

async function ensureEnabled(page: Page) {
  if ((await getContrastAttr(page)) !== 'high') {
    await page.getByTestId('nexus-contrast-toggle').click();
  }
  await expect(page.locator('html')).toHaveAttribute(ATTR, 'high');
}

test.describe('Alto contraste — persistência e sincronização cross-device', () => {
  test('persiste após recarregar a página', async ({ page }) => {
    await openBibleChapter(page);
    await ensureEnabled(page);

    // localStorage deve ter sido marcado
    const stored = await page.evaluate((k) => window.localStorage.getItem(k), STORAGE_KEY);
    expect(stored).toBe('1');

    await page.reload();
    await page.waitForSelector('[data-testid^="verse-text-"]', { timeout: 20_000 });

    await expect(page.locator('html')).toHaveAttribute(ATTR, 'high');
  });

  test('sincroniza para outro dispositivo via profile do servidor', async ({ browser }, testInfo) => {
    // Requer um storageState autenticado salvo em /tmp/auth.json pelos testes auth.
    // Quando ausente, pula com mensagem amigável em vez de falhar.
    const fs = await import('node:fs');
    const path = '/tmp/auth.json';
    if (!fs.existsSync(path)) {
      testInfo.skip(true, 'storageState autenticado não encontrado (rode auth.spec.ts antes).');
      return;
    }

    // Dispositivo A — liga o alto contraste (persiste no profile)
    const ctxA: BrowserContext = await browser.newContext({ storageState: path });
    const pageA = await ctxA.newPage();
    await openBibleChapter(pageA);
    await ensureEnabled(pageA);
    // Aguarda escrita remota (best effort)
    await pageA.waitForTimeout(800);
    await ctxA.close();

    // Dispositivo B — mesma sessão, mas SEM localStorage do A
    const ctxB: BrowserContext = await browser.newContext({ storageState: path });
    const pageB = await ctxB.newPage();
    // Garante origem antes de mexer no storage
    await pageB.goto('/');
    await pageB.evaluate((k) => window.localStorage.removeItem(k), STORAGE_KEY);

    await openBibleChapter(pageB);
    // A hidratação acontece após auth.getUser(); damos um tempo curto.
    await expect.poll(
      async () => getContrastAttr(pageB),
      { timeout: 10_000, message: 'profile remoto não hidratou o alto contraste no device B' },
    ).toBe('high');

    await ctxB.close();
  });
});
