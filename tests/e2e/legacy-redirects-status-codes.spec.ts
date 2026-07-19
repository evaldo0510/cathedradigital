/**
 * Redirects legados — status codes e ausência de loop
 *
 * Contexto: o app é uma SPA e os redirects são feitos por <Navigate replace>
 * do React Router. O primeiro request HTTP sempre retorna 200 (index.html);
 * o redirect ocorre no cliente. Este spec valida:
 *
 *  - Toda resposta da cadeia HTTP é < 400 (nenhum 404/5xx no caminho).
 *  - Se algum hop for 3xx (redirect servidor, ex.: hosting futuro), o header
 *    `Location` aponta para o destino esperado.
 *  - O `pathname` final bate com o destino esperado.
 *  - Não há loop: a URL estabiliza em ≤ 3 mudanças e não oscila.
 *
 * Fonte da verdade dos pares [from → to]: <Navigate to=...> em src/App.tsx.
 */
import { test, expect, type Response } from '@playwright/test';

// Pares extraídos do App.tsx (mesma lista do spec de 404).
const LEGACY_REDIRECTS: Array<[string, string]> = [
  ['/home', '/'],
  ['/biblia', '/bible'],
  ['/catecismo', '/catechism'],
  ['/magisterio', '/magisterium'],
  ['/search', '/buscar'],
  ['/chat', '/logos'],
  ['/login', '/auth'],
  ['/dashboard', '/hoje'],
  ['/glossary', '/glossario'],
  ['/az-faith', '/glossario'],
  ['/encyclopedia', '/glossario'],
  ['/prayers', '/oracao'],
  ['/rezar', '/oracao'],
  ['/contemplacao', '/contemplatio'],
  ['/library', '/biblioteca'],
  ['/prayer', '/oracao'],
  ['/via-crucis', '/viacrucis'],
  ['/journeys', '/jornadas'],
  ['/notes', '/diario'],
  ['/telemetry', '/admin/telemetry'],
  ['/security', '/admin/security'],
  ['/catechism-explorer', '/catechism'],
  ['/formacao', '/jornadas'],
  ['/formar-se', '/jornadas'],
  ['/minha-jornada', '/jornadas'],
  ['/pesquisar', '/buscar'],
  ['/oracoes', '/oracao'],
  ['/orar', '/oracao'],
  ['/rosario', '/rosary'],
  ['/via-sacra', '/viacrucis'],
  ['/today', '/hoje'],
  ['/saints', '/santos'],
  ['/liturgy', '/liturgia'],
];

const MAX_HOPS = 3;

test.describe('Redirects legados — status codes + destino final + sem loop', () => {
  for (const [from, expectedPrefix] of LEGACY_REDIRECTS) {
    test(`${from} → ${expectedPrefix}`, async ({ page }) => {
      // 1. Captura toda a cadeia de responses do documento principal.
      const documentResponses: Response[] = [];
      page.on('response', (resp) => {
        if (resp.request().resourceType() === 'document') {
          documentResponses.push(resp);
        }
      });

      // 2. Rastreia mudanças de pathname para detectar loop no client-side.
      const pathHistory: string[] = [];
      page.on('framenavigated', (frame) => {
        if (frame === page.mainFrame()) {
          try {
            pathHistory.push(new URL(frame.url()).pathname);
          } catch {
            /* ignore */
          }
        }
      });

      const nav = await page.goto(from, { waitUntil: 'domcontentloaded' });

      // 3. Espera o React Router aplicar o <Navigate replace>.
      await page
        .waitForFunction(
          (target) => window.location.pathname.startsWith(target),
          expectedPrefix,
          { timeout: 5000 },
        )
        .catch(() => {
          // /home → / é caso limite quando já entramos em "/".
        });

      // ---------- Asserção 1: nenhuma resposta HTTP quebrada na cadeia
      expect(documentResponses.length, 'nenhum document response').toBeGreaterThan(0);
      for (const r of documentResponses) {
        expect(
          r.status(),
          `hop ${r.url()} retornou ${r.status()}`,
        ).toBeLessThan(400);
      }

      // ---------- Asserção 2: se houver 3xx, o Location bate com o esperado
      const redirectHops = documentResponses.filter(
        (r) => r.status() >= 300 && r.status() < 400,
      );
      for (const r of redirectHops) {
        expect([301, 302, 307, 308]).toContain(r.status());
        const location = r.headers()['location'] ?? '';
        // Location pode ser relativo ou absoluto.
        const targetPath = location.startsWith('http')
          ? new URL(location).pathname
          : location;
        expect(
          targetPath.startsWith(expectedPrefix),
          `redirect servidor de ${r.url()} → ${targetPath}, esperado ${expectedPrefix}`,
        ).toBe(true);
      }

      // ---------- Asserção 3: status do navigate principal também < 400
      expect(nav?.status() ?? 200).toBeLessThan(400);

      // ---------- Asserção 4: pathname final == destino
      const finalPath = new URL(page.url()).pathname;
      expect(
        finalPath.startsWith(expectedPrefix),
        `esperava terminar em ${expectedPrefix}, chegou em ${finalPath}`,
      ).toBe(true);

      // ---------- Asserção 5: sem loop
      // Máx. 3 mudanças de pathname (from → intermediário → destino).
      // E o destino final não pode reaparecer no meio da cadeia (oscilação).
      expect(
        pathHistory.length,
        `cadeia de navegação longa demais (loop?): ${pathHistory.join(' → ')}`,
      ).toBeLessThanOrEqual(MAX_HOPS);

      // A URL final não deve voltar para o alias original.
      expect(
        finalPath === from && from !== expectedPrefix,
        `voltou para o alias original (${from}), possível loop`,
      ).toBe(false);

      // Nenhum pathname da cadeia pode se repetir (loop A → B → A).
      const seen = new Set<string>();
      for (const p of pathHistory) {
        if (seen.has(p) && p !== finalPath) {
          throw new Error(
            `loop detectado: pathname ${p} repetiu na cadeia ${pathHistory.join(' → ')}`,
          );
        }
        seen.add(p);
      }
    });
  }
});
