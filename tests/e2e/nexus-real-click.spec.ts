/**
 * Nexus — clique real em bubbles da Bíblia.
 *
 * Complementa `nexus-routes-no-404.spec.ts` (que valida via URL): aqui abrimos
 * o leitor bíblico, expandimos os bubbles do Nexus renderizados nos versículos
 * e clicamos o CTA "Abrir no módulo" (`data-testid="nexus-open-module"`),
 * garantindo que a rota destino carrega sem 404 e sem cair em prefixos antigos.
 *
 * Se a passagem não tiver bubbles indexados no ambiente de teste, o teste é
 * marcado como `skip` — a matriz sintética em `nexus-routes-no-404.spec.ts`
 * cobre a validação de rotas independentemente de dados.
 */
import { test, expect } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

const EVIDENCE_DIR = path.resolve('playwright-report/nexus-evidence');
fs.mkdirSync(EVIDENCE_DIR, { recursive: true });

const PASSAGES = [
  { book: 'Jo', chapter: 6, verse: 51 }, // "eu sou o pão vivo" — clássica no Nexus
  { book: 'Mt', chapter: 5, verse: 3 },
];

test.describe('Nexus — clique real na UI navega sem 404', () => {
  for (const p of PASSAGES) {
    test(`Bíblia ${p.book} ${p.chapter}:${p.verse} → nexus-open-module`, async ({ page }, testInfo) => {
      const slug = `real-click__${p.book}-${p.chapter}-${p.verse}`;
      await page.goto(`/bible?book=${p.book}&chapter=${p.chapter}`, { waitUntil: 'domcontentloaded' });

      // Aguarda o container de bubbles do versículo alvo.
      const bubbles = page.locator(`[data-testid="nexus-bubbles-${p.verse}"]`).first();
      const appeared = await bubbles.waitFor({ state: 'visible', timeout: 8000 }).then(() => true).catch(() => false);
      if (!appeared) {
        test.skip(true, `sem bubbles indexados para ${p.book} ${p.chapter}:${p.verse}`);
        return;
      }

      // Clica no primeiro bubble para abrir o inline preview.
      const firstBubble = bubbles.locator('button').first();
      await firstBubble.click();

      // O NexusInlinePreview renderiza o CTA "Abrir no módulo".
      const openCta = page.locator('[data-testid="nexus-open-module"]').first();
      const ctaVisible = await openCta.waitFor({ state: 'visible', timeout: 5000 }).then(() => true).catch(() => false);
      if (!ctaVisible) {
        test.skip(true, `bubble sem CTA de módulo para ${p.book} ${p.chapter}:${p.verse}`);
        return;
      }

      try {
        await openCta.click();
        await page.waitForLoadState('domcontentloaded');

        const notFound = page.locator('h1', { hasText: /^404$/ });
        await expect(notFound, `clique no Nexus não pode cair em 404`).toHaveCount(0);

        const finalPath = new URL(page.url()).pathname;
        expect(finalPath.startsWith('/estudar/'), `redirecionou para /estudar/* (${finalPath})`).toBe(false);
        expect(finalPath.startsWith('/rezar/'), `redirecionou para /rezar/* (${finalPath})`).toBe(false);
      } catch (err) {
        const shot = path.join(EVIDENCE_DIR, `${slug}.png`);
        await page.screenshot({ path: shot }).catch(() => {});
        await testInfo.attach(`${slug}.png`, { path: shot, contentType: 'image/png' }).catch(() => {});
        throw err;
      }
    });
  }
});
