/**
 * STAB-NEXUS-P0 Etapa 4 — Integração cross-módulo do Nexus.
 *
 * Percorre Bíblia → Catecismo → Magistério → Santos → Jornada → Bíblia
 * validando em cada rota:
 *   - Página carrega sem pageerror
 *   - Nenhum console.error crítico
 *   - Se Nexus estiver montado, bubbles são clicáveis (0 dead-ends)
 *   - Eventos telemetria: nexus.shown / nexus.click / nexus.destination /
 *     nexus.failed são registrados via window.__nexusEvents__
 *
 * Ao final grava docs/CAT-030-NEXUS-COVERAGE-E2E.md com o inventário
 * de nós exibidos e destinos resolvidos durante a corrida.
 */
import { test, expect, type Page, type ConsoleMessage } from '@playwright/test';
import { writeFileSync, mkdirSync } from 'node:fs';

type NexusRecord = {
  event: string;
  payload: Record<string, unknown>;
  t: number;
};

type CoverageRow = {
  route: string;
  bubblesFound: number;
  destination: string | null;
  status: 'navigated' | 'no-bubbles' | 'dead-end' | 'error';
  detail?: string;
};

const coverage: CoverageRow[] = [];

async function readNexusEvents(page: Page): Promise<NexusRecord[]> {
  return await page.evaluate(() =>
    ((window as unknown as { __nexusEvents__?: NexusRecord[] }).__nexusEvents__ ?? []).slice(),
  );
}

async function clearNexusEvents(page: Page) {
  await page.evaluate(() => {
    (window as unknown as { __nexusEvents__?: NexusRecord[] }).__nexusEvents__ = [];
  });
}

function attachErrorGuards(page: Page): { errors: string[]; pageerrors: string[] } {
  const errors: string[] = [];
  const pageerrors: string[] = [];
  page.on('console', (msg: ConsoleMessage) => {
    if (msg.type() === 'error') {
      const text = msg.text();
      // Ignora erros conhecidos e não bloqueantes (rede intermitente, ext).
      if (
        text.includes('Failed to load resource') ||
        text.includes('net::ERR_') ||
        text.includes('Extension') ||
        text.includes('favicon')
      ) return;
      errors.push(text);
    }
  });
  page.on('pageerror', (err) => pageerrors.push(err.message));
  return { errors, pageerrors };
}

/**
 * Tenta abrir o painel do Nexus na página atual e, se houver bubbles,
 * clica no primeiro e valida navegação.
 */
async function exerciseNexus(page: Page, route: string): Promise<CoverageRow> {
  await clearNexusEvents(page);

  // Aguarda a página estabilizar.
  await page.waitForLoadState('networkidle', { timeout: 15_000 }).catch(() => {});

  // Procura qualquer trigger do Nexus (tag com data-slug ou botão com aria-label "Nexus").
  const trigger = page
    .locator('[data-nexus-trigger], [data-tag-slug], button:has-text("Nexus")')
    .first();

  const hasTrigger = await trigger.count().then((n) => n > 0).catch(() => false);
  if (!hasTrigger) {
    return { route, bubblesFound: 0, destination: null, status: 'no-bubbles', detail: 'sem trigger visível' };
  }

  await trigger.click({ trial: false, timeout: 5000 }).catch(() => {});
  await page.waitForTimeout(600); // deixa o Sheet abrir

  const bubbles = page.locator('[data-testid="nexus-bubble-cta"]');
  const bubbleCount = await bubbles.count();

  if (bubbleCount === 0) {
    return { route, bubblesFound: 0, destination: null, status: 'no-bubbles' };
  }

  // Sanidade: nenhum bubble pode ser <span> morto (STAB-NEXUS-P0 Etapa 2).
  const deadSpans = page.locator('.text-primary\\/40:has-text("Ir para"), .text-primary\\/40:has-text("Ler"), .text-primary\\/40:has-text("Contemplar")');
  const deadCount = await deadSpans.count().catch(() => 0);
  if (deadCount > 0) {
    return { route, bubblesFound: bubbleCount, destination: null, status: 'dead-end', detail: `${deadCount} <span> mortos` };
  }

  const firstBubble = bubbles.first();
  const kind = await firstBubble.getAttribute('data-nexus-type');
  await firstBubble.click();

  // Aguarda navegação.
  await page.waitForTimeout(1200);
  const destination = new URL(page.url()).pathname + new URL(page.url()).search;

  return {
    route,
    bubblesFound: bubbleCount,
    destination,
    status: 'navigated',
    detail: kind ?? undefined,
  };
}

const ROUTES_TO_VISIT: Array<{ label: string; path: string }> = [
  { label: 'Bíblia', path: '/bible?book=joao&ch=6' },
  { label: 'Catecismo', path: '/catechism?p=1817' },
  { label: 'Magistério', path: '/magisterium' },
  { label: 'Santos', path: '/santos' },
  { label: 'Jornada', path: '/jornadas' },
];

test.describe('STAB-NEXUS-P0 — Integração cross-módulo', () => {
  test('percorre Bíblia → Catecismo → Magistério → Santos → Jornada sem dead-ends', async ({ page }) => {
    const { errors, pageerrors } = attachErrorGuards(page);
    const allEvents: NexusRecord[] = [];

    for (const { label, path } of ROUTES_TO_VISIT) {
      await test.step(label, async () => {
        await page.goto(path, { waitUntil: 'domcontentloaded' });
        const row = await exerciseNexus(page, path);
        coverage.push(row);

        const evs = await readNexusEvents(page);
        allEvents.push(...evs);

        // Nenhum dead-end é aceitável.
        expect(row.status, `${label}: ${row.detail ?? ''}`).not.toBe('dead-end');

        // Se houve navegação, checa que a destino é uma rota SPA válida.
        if (row.status === 'navigated' && row.destination) {
          expect(row.destination).toMatch(/^\/(bible|catechism|magisterium|santos|temas|jornadas)/);
        }
      });
    }

    // Sem erros críticos em nenhuma rota.
    expect(pageerrors, 'pageerrors capturados durante a corrida').toEqual([]);
    expect(errors, 'console.errors capturados durante a corrida').toEqual([]);

    // Se qualquer rota abriu Nexus com bubbles, deve haver ao menos 1 shown + 1 click + 1 destination.
    const anyShown = coverage.some((r) => r.status === 'navigated');
    if (anyShown) {
      const shown = allEvents.filter((e) => e.event === 'nexus.shown');
      const clicks = allEvents.filter((e) => e.event === 'nexus.click');
      const dests = allEvents.filter((e) => e.event === 'nexus.destination');
      expect(shown.length, 'nexus.shown emitido').toBeGreaterThanOrEqual(1);
      expect(clicks.length, 'nexus.click emitido').toBeGreaterThanOrEqual(1);
      expect(dests.length, 'nexus.destination emitido').toBeGreaterThanOrEqual(1);
    }

    // Gera relatório de cobertura E2E.
    mkdirSync('docs', { recursive: true });
    const failedEvents = allEvents.filter((e) => e.event === 'nexus.failed');
    const lines = [
      '# CAT-030 — Cobertura Nexus (corrida E2E)',
      '',
      `_Gerado por \`tests/e2e/nexus-p0-integration.spec.ts\` — ${new Date().toISOString()}_`,
      '',
      '## Rotas visitadas',
      '',
      '| Rota | Bubbles | Destino resolvido | Status | Detalhe |',
      '|------|---------|-------------------|--------|---------|',
      ...coverage.map(
        (r) =>
          `| \`${r.route}\` | ${r.bubblesFound} | ${r.destination ?? '—'} | ${r.status} | ${r.detail ?? '—'} |`,
      ),
      '',
      '## Eventos de telemetria capturados',
      '',
      `- \`nexus.shown\`: ${allEvents.filter((e) => e.event === 'nexus.shown').length}`,
      `- \`nexus.click\`: ${allEvents.filter((e) => e.event === 'nexus.click').length}`,
      `- \`nexus.destination\`: ${allEvents.filter((e) => e.event === 'nexus.destination').length}`,
      `- \`nexus.failed\`: ${failedEvents.length}`,
      '',
    ];
    if (failedEvents.length > 0) {
      lines.push('### Falhas registradas', '');
      lines.push('```json');
      lines.push(JSON.stringify(failedEvents.map((e) => e.payload), null, 2));
      lines.push('```', '');
    }
    lines.push('## Erros de console', '', errors.length === 0 ? '_Nenhum._' : errors.map((e) => `- ${e}`).join('\n'));
    writeFileSync('docs/CAT-030-NEXUS-COVERAGE-E2E.md', lines.join('\n'));
  });
});
