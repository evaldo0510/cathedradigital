/**
 * Nexus — Rotas sem 404
 *
 * Percorre TODAS as chaves do RouteRegistry (fonte única dos links do Nexus)
 * resolvendo cada uma com parâmetros plausíveis e valida que a navegação
 * NUNCA cai na página 404 (`<h1>404</h1>`) e que a rota não é redirecionada
 * para o handler curinga `*`.
 *
 * Regressão do P0 da sprint CAT-11: antes o RouteRegistry emitia prefixos
 * /estudar/* e /rezar/* inexistentes, resultando em 404 ao clicar no Nexus.
 */
import { test, expect } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

const EVIDENCE_DIR = path.resolve('playwright-report/nexus-evidence');
const FAILURES_LOG = path.join(EVIDENCE_DIR, 'failures.log');
fs.mkdirSync(EVIDENCE_DIR, { recursive: true });

function appendFailure(entry: Record<string, unknown>) {
  const line = JSON.stringify({ ts: new Date().toISOString(), ...entry });
  fs.appendFileSync(FAILURES_LOG, line + '\n');
}

// Params plausíveis para cada rota que exige placeholders.
// Escolhidos a partir de slugs/valores reais existentes no banco/rotas.
const CASES: Array<{ key: string; params?: Record<string, string | number>; label: string }> = [
  { key: 'atrium', label: 'Átrio' },
  { key: 'env.estudar', label: 'Ambiente: Estudar' },
  { key: 'env.rezar', label: 'Ambiente: Rezar' },
  { key: 'env.formar-se', label: 'Ambiente: Formar-se' },
  { key: 'env.pesquisar', label: 'Ambiente: Pesquisar' },
  { key: 'env.minha-jornada', label: 'Ambiente: Minha Jornada' },
  { key: 'study.composed', params: { slug: 'videira' }, label: 'Estudo composto (tema)' },
  { key: 'study.bible', params: { book: 'Jo', chapter: 6 }, label: 'Bíblia (Jo 6)' },
  { key: 'study.catechism', params: { paragraph: 2 }, label: 'Catecismo §2' },
  { key: 'study.magisterium', params: { doc: 'dei-verbum' }, label: 'Magistério (dei-verbum)' },
  { key: 'study.father', params: { slug: 'agostinho' }, label: 'Padre (Agostinho)' },
  { key: 'study.saint', params: { slug: 'agostinho' }, label: 'Santo (Agostinho)' },
  { key: 'pray.lectio', params: { slug: 'jo-6' }, label: 'Lectio (Jo 6)' },
  { key: 'pray.liturgy-today', label: 'Liturgia de hoje' },
];

const VIEWPORTS: Array<{ name: 'desktop' | 'tablet' | 'mobile-lg' | 'mobile'; width: number; height: number }> = [
  { name: 'desktop', width: 1280, height: 800 },
  { name: 'tablet', width: 768, height: 1024 }, // iPad retrato
  { name: 'mobile-lg', width: 414, height: 896 }, // iPhone 11 Pro Max / XR
  { name: 'mobile', width: 390, height: 844 }, // iPhone 12/13/14
];

for (const vp of VIEWPORTS) {
  test.describe(`Nexus — todos os links navegam sem 404 [${vp.name}]`, () => {
    test.use({ viewport: { width: vp.width, height: vp.height } });

    for (const c of CASES) {
      test(`[${vp.name}] ${c.key} → ${c.label} não gera 404`, async ({ page }, testInfo) => {
        const slug = `${vp.name}__${c.key.replace(/\W+/g, '-')}`;
        // Resolve URL dentro do próprio app usando o RouteRegistry (fonte da verdade).
        await page.goto('/', { waitUntil: 'domcontentloaded' });
        const url = await page.evaluate(
          async ({ key, params }) => {
            const mod = await import('/src/core/navigation/RouteRegistry.ts');
            return mod.RouteRegistry.resolve(key as never, params ?? {});
          },
          { key: c.key, params: c.params ?? {} }
        );

        expect(url, `URL resolvida para ${c.key}`).toBeTruthy();
        // Nenhum link do Nexus pode voltar a apontar para prefixos antigos.
        expect(url.startsWith('/estudar/'), 'RouteRegistry não deve emitir /estudar/*').toBe(false);
        expect(url.startsWith('/rezar/'), 'RouteRegistry não deve emitir /rezar/*').toBe(false);

        try {
          const response = await page.goto(url, { waitUntil: 'domcontentloaded' });
          // O app é SPA: o HTTP status é 200 mesmo para rotas inexistentes.
          // A prova real de 404 é o componente NotFound renderizar `<h1>404</h1>`.
          expect(response?.status(), 'status HTTP').toBeLessThan(400);

          const notFound = page.locator('h1', { hasText: /^404$/ });
          await expect(notFound, `rota ${url} não pode renderizar NotFound no ${vp.name}`).toHaveCount(0);

          // Guarda de redirecionamento: a URL final após navegação SPA
          // não pode escorregar para prefixos antigos.
          const finalPath = new URL(page.url()).pathname;
          expect(finalPath.startsWith('/estudar/'), `redirecionou para /estudar/* (${finalPath})`).toBe(false);
          expect(finalPath.startsWith('/rezar/'), `redirecionou para /rezar/* (${finalPath})`).toBe(false);
        } catch (err) {
          // Evidência no CI: screenshot + log estruturado da rota que falhou.
          const shotPath = path.join(EVIDENCE_DIR, `${slug}.png`);
          await page.screenshot({ path: shotPath }).catch(() => {});
          appendFailure({
            viewport: vp.name,
            key: c.key,
            resolvedUrl: url,
            finalUrl: page.url(),
            screenshot: shotPath,
            error: err instanceof Error ? err.message : String(err),
          });
          await testInfo.attach(`nexus-failure-${slug}.png`, {
            path: shotPath,
            contentType: 'image/png',
          }).catch(() => {});
          throw err;
        }
      });
    }
  });
}


