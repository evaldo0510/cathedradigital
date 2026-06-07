import { test, expect } from '@playwright/test';

/**
 * MISSÃO CRÍTICA: ZERO INGLÊS NOS LIVROS DEUTEROCANÔNICOS
 * Este teste valida em runtime (UI Real) se o texto bíblico está em português.
 */

const DEUTERO_TARGETS = [
  { path: '/bible/tb/1', name: 'Tobias 1' },
  { path: '/bible/jdt/1', name: 'Judite 1' },
  { path: '/bible/sb/1', name: 'Sabedoria 1' },
  { path: '/bible/eclo/1', name: 'Eclesiástico 1' },
  { path: '/bible/br/1', name: 'Baruc 1' },
  { path: '/bible/1mc/14', name: '1 Macabeus 14' },
  { path: '/bible/2mc/1', name: '2 Macabeus 1' }
];

const ENGLISH_INDICATORS = [
  /\bthe\b/i, /\band\b/i, /\bshall\b/i, /\bunto\b/i, /\bfrom\b/i, /\bwith\b/i,
  /\bking\b/i, /\bgathered\b/i, /\bforces\b/i, /\bfight\b/i, /\bwent\b/i
];

test.describe('Bible Zero English E2E (Deuterocanonical)', () => {
  for (const target of DEUTERO_TARGETS) {
    test(`Verify ${target.name} text is in Portuguese`, async ({ page }) => {
      // Navegar para o capítulo
      await page.goto(target.path);
      
      // Aguardar o carregamento (BibleReader exibe esqueletos ou spinner)
      // O texto bíblico fica dentro de parágrafos (.font-serif)
      const readerContainer = page.locator('div.max-w-2xl.mx-auto');
      await expect(readerContainer).toBeVisible({ timeout: 15000 });

      // Pegar todo o texto do corpo bíblico
      const bodyText = await readerContainer.innerText();
      
      // Validar ausência de palavras comuns em inglês no corpo do texto
      for (const indicator of ENGLISH_INDICATORS) {
        const matches = bodyText.match(indicator);
        if (matches) {
          throw new Error(`[REGRESSÃO] Texto em inglês detectado em ${target.name}: "${matches[0]}" encontrado. Trecho: "${bodyText.substring(0, 100)}..."`);
        }
      }

      // Validar presença de indicadores de português (acentuação/palavras comuns)
      const portugueseIndicators = [
        ' de ', ' o ', ' e ', ' a ', ' que ', ' para ', ' em '
      ];
      
      const hasPortuguese = portugueseIndicators.some(word => bodyText.toLowerCase().includes(word));
      expect(hasPortuguese, `O texto em ${target.name} não parece ser português válido.`).toBe(true);
      
      console.log(`✅ ${target.name} validado com sucesso em português.`);
    });
  }
});
