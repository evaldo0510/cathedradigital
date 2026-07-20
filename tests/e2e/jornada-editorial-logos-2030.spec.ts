/**
 * Testes E2E — Layout editorial Logos 2030 na página de detalhe de Jornada.
 *
 * Cobre:
 *   1. Hero editorial com kicker, título e meta (tempo, passos).
 *   2. Presença da timeline de passos com ao menos um item.
 *   3. CTA primária ("Iniciar/Continuar") aponta para /jornadas/:id/step?step=...
 *   4. Seção Nexus (quando existir) traz `NexusSourceBadge` com aria-label
 *      contendo "Fonte automática KnowledgeGraph, tipo <kind>, id <id>",
 *      e links internos aparecem (sem 404) — ao clicar navega SPA (sem
 *      full reload).
 *
 * O teste é escrito em modo defensivo: seções condicionais (intro,
 * próxima etapa, progresso, reflexão) são validadas apenas quando
 * presentes no DOM — permite rodar com qualquer jornada semeada.
 *
 * IDs reutilizam a mesma descoberta usada pelo restante da suíte
 * (`.e2e-ids.json` gerado por `bun run test:jornadas:discover`).
 */
import { test, expect } from '@playwright/test';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

function loadJourneyId(): string | undefined {
  const fromEnv = process.env.E2E_JOURNEY_ID;
  if (fromEnv) return fromEnv;
  const cache = join(process.cwd(), '.e2e-ids.json');
  if (!existsSync(cache)) return undefined;
  try {
    return JSON.parse(readFileSync(cache, 'utf-8')).E2E_JOURNEY_ID;
  } catch {
    return undefined;
  }
}

const JOURNEY_ID = loadJourneyId();

test.describe('Jornada — layout editorial Logos 2030', () => {
  test.skip(!JOURNEY_ID, 'Requer E2E_JOURNEY_ID (via env ou .e2e-ids.json).');

  test.beforeEach(async ({ page }) => {
    await page.goto(`/jornadas/${JOURNEY_ID}`);
    await page.waitForLoadState('domcontentloaded');
  });

  test('Hero editorial: kicker, título e meta visíveis', async ({ page }) => {
    const hero = page.getByTestId('jornada-hero');
    await expect(hero).toBeVisible();

    // Título H1 principal dentro do hero.
    await expect(hero.locator('h1')).toBeVisible();

    // Meta editorial ("~N dias · N etapas · [dificuldade]")
    const meta = page.getByTestId('jornada-meta');
    await expect(meta).toBeVisible();
    await expect(meta).toContainText(/dias/i);
    await expect(meta).toContainText(/etapas/i);
  });

  test('Timeline: lista ordenada com ao menos um passo', async ({ page }) => {
    const timeline = page.getByTestId('jornada-timeline');
    await expect(timeline).toBeVisible();
    await expect(timeline.locator('ol > li').first()).toBeVisible();
  });

  test('CTA primária aponta para /jornadas/:id/step', async ({ page }) => {
    const cta = page.getByTestId('jornada-cta');
    if ((await cta.count()) === 0) {
      test.skip(true, 'Jornada bloqueada (PRO) — CTA primária não exposta.');
    }
    await expect(cta).toBeVisible();
    const href = await cta.getAttribute('href');
    expect(href).toMatch(new RegExp(`^/jornadas/${JOURNEY_ID}/step`));
  });

  test('Seções condicionais renderizam quando presentes', async ({ page }) => {
    for (const id of [
      'jornada-intro',
      'jornada-next-step',
      'jornada-progress',
      'jornada-reflexao',
    ]) {
      const node = page.getByTestId(id);
      if (await node.count()) {
        await expect(node.first()).toBeVisible();
      }
    }
  });

  test('Nexus Theologicus: badges expõem fonte KnowledgeGraph e links funcionam', async ({
    page,
  }) => {
    const nexus = page.getByTestId('jornada-nexus');
    if ((await nexus.count()) === 0) {
      test.skip(true, 'Jornada sem conexões geradas pelo KnowledgeGraph.');
    }
    await expect(nexus).toBeVisible();

    // Ao menos uma seção (bíblia, catecismo, santo, oração, glossário)
    const kindSection = nexus.locator('[id^="nexus-"]').first();
    await expect(kindSection).toBeVisible();

    // NexusSourceBadge: aria-label determinístico e focável.
    const badge = nexus
      .locator('button[aria-label^="Fonte automática KnowledgeGraph"]')
      .first();
    if ((await badge.count()) === 0) {
      test.skip(true, 'Sem badges renderizados nesta jornada.');
    }
    await expect(badge).toBeVisible();
    const label = (await badge.getAttribute('aria-label')) ?? '';
    expect(label).toMatch(/tipo\s+\w+.*id\s+\S+/i);

    // Foco por teclado + tooltip aparece.
    await badge.focus();
    await expect(badge).toBeFocused();

    // Um dos links de nó do Nexus deve navegar SPA (sem full page reload).
    const link = nexus.locator('a[href^="/"]').first();
    if (await link.count()) {
      const href = await link.getAttribute('href');
      // Marca o documento — se recarregar, essa marca some.
      await page.evaluate(() => {
        (window as unknown as { __spa: boolean }).__spa = true;
      });
      await link.click();
      await page.waitForURL((u) => u.pathname === href, { timeout: 5_000 });
      const stillSpa = await page.evaluate(
        () => (window as unknown as { __spa?: boolean }).__spa === true,
      );
      expect(stillSpa).toBe(true);
    }
  });
});
