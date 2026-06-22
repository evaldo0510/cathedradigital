import { test, expect, Page } from '@playwright/test';

/**
 * Validação visual do Nexus na Bíblia:
 * - Percorre uma seleção representativa de livros (AT/NT) que possuem
 *   conexões com o Catecismo na tabela `bible_connections` (e/ou no
 *   fallback hard-coded `KNOWLEDGE_CONNECTIONS`).
 * - Confirma:
 *    1. Renderização de ao menos um ponto dourado (aria-label
 *       "Capítulo com citação do Catecismo" ou "Versículo com citação do Catecismo").
 *    2. Renderização das bolhas/cards do Nexus quando há citação.
 *    3. Navegação bidirecional Bíblia ↔ Catecismo:
 *       Bíblia → "Ler no Catecismo" abre /catechism?p=<id>.
 *
 * Critério de aceite: TODOS os livros listados precisam mostrar gold
 * dot + bolha. Inconsistências são reportadas como falha de teste.
 */

const BOOKS_WITH_CIC = [
  { abbr: 'Gn', chapter: 1, verse: 1 },
  { abbr: 'Ex', chapter: 3, verse: 14 },
  { abbr: 'Is', chapter: 7, verse: 14 },
  { abbr: 'Mt', chapter: 5, verse: 3 },
  { abbr: 'Mc', chapter: 1, verse: 15 },
  { abbr: 'Lc', chapter: 1, verse: 28 },
  { abbr: 'Jo', chapter: 6, verse: 35 },
  { abbr: 'At', chapter: 2, verse: 4 },
  { abbr: 'Rm', chapter: 5, verse: 12 },
  { abbr: 'Hb', chapter: 11, verse: 1 },
  { abbr: '1Jo', chapter: 4, verse: 8 },
  { abbr: 'Ap', chapter: 21, verse: 1 },
];

async function openVerse(page: Page, abbr: string, ch: number, v: number) {
  await page.goto(`/bible?book=${abbr}&ch=${ch}&v=${v}`);
  // Wait until the reader has at least one verse rendered
  await page.waitForSelector(`#v${v}`, { timeout: 15_000 });
}

test.describe('Nexus ↔ Catecismo: dots, bolhas e navegação bidirecional', () => {
  for (const { abbr, chapter, verse } of BOOKS_WITH_CIC) {
    test(`${abbr} ${chapter}:${verse} — ponto dourado + bolha do Nexus`, async ({ page }) => {
      const consoleErrors: string[] = [];
      page.on('console', (msg) => {
        if (msg.type() === 'error') consoleErrors.push(msg.text());
      });

      await openVerse(page, abbr, chapter, verse);

      // 1. Ponto dourado no versículo OU no capítulo
      const goldVerse = page.locator('[aria-label="Versículo com citação do Catecismo"]');
      const goldChapter = page.locator('[aria-label="Capítulo com citação do Catecismo"]');
      const hasGold =
        (await goldVerse.count()) > 0 || (await goldChapter.count()) > 0;
      expect(hasGold, `Sem ponto dourado em ${abbr} ${chapter}:${verse}`).toBe(true);

      // 2. Pelo menos uma bolha/card do Nexus com kicker "Catecismo"
      const nexusCard = page.getByText(/Catecismo/i).first();
      await expect(nexusCard, `Sem bolha Nexus em ${abbr} ${chapter}:${verse}`).toBeVisible({ timeout: 10_000 });

      // 3. Sem erros de console críticos
      const critical = consoleErrors.filter((e) => !/favicon|sourcemap/i.test(e));
      expect(critical, `Console errors em ${abbr} ${chapter}:${verse}`).toEqual([]);
    });
  }

  test('Navegação bidirecional: Bíblia → Catecismo → Bíblia', async ({ page }) => {
    await openVerse(page, 'Jo', 6, 35);

    // Abre o card CIC e o modal "Ler no Catecismo"
    const cicCard = page.getByRole('button', { name: /CIC\s*1324/i }).first();
    await cicCard.click();

    const lerNoCat = page.getByRole('button', { name: /Catecismo/i }).first();
    await lerNoCat.click();

    await page.waitForURL(/\/catechism\?p=1324/, { timeout: 10_000 });

    // No Catecismo, navegar de volta via referência bíblica é manual no UI;
    // aqui validamos apenas que a página do Catecismo carregou o parágrafo.
    await expect(page.locator('body')).toContainText(/1324/);
  });
});
