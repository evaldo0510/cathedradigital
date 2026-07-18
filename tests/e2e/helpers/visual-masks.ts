/**
 * Seletores centralizados de elementos DINÂMICOS que devem ser
 * mascarados em snapshots visuais para reduzir falsos positivos.
 *
 * REGRA: só entra aqui o que muda entre execuções sem indicar
 * regressão de layout (relógios, avatares, badges numéricos,
 * indicadores animados). NUNCA mascare conteúdo estável (títulos,
 * ícones fixos, estrutura do menu) — isso esconde bugs reais.
 *
 * Duas categorias:
 *   1. TESTID_SELECTORS  — precisos, dependem do componente expor `data-testid`.
 *   2. STRUCTURAL_SELECTORS — fallback por role/aria/classe/atributos estáveis,
 *      cobre casos em que o testid ainda não foi adicionado ao componente.
 */

import type { Page, Locator, TestInfo } from '@playwright/test';

/** Seletores por `data-testid` — precisos, mas exigem que o componente os exponha. */
export const TESTID_SELECTORS = [
  '[data-testid="clock"]',
  '[data-testid="current-time"]',
  '[data-testid="last-updated"]',
  '[data-testid="user-avatar"]',
  '[data-testid="user-name"]',
  '[data-testid="notification-badge"]',
  '[data-testid="streak-badge"]',
  '[data-testid="xp-counter"]',
  '[data-testid="level-badge"]',
  '[data-testid="unread-count"]',
  '[data-testid="bottom-nav-active-bg"]',
  '[data-testid="bottom-nav-dot"]',
] as const;

/**
 * Fallback estrutural — funciona mesmo quando os `data-testid` acima
 * ainda não existem. Foca em atributos HTML/ARIA estáveis e nunca
 * captura texto estático de menu.
 */
export const STRUCTURAL_SELECTORS = [
  // Tempo: <time>, [datetime], ou texto com formato HH:MM dentro de status.
  'time',
  '[datetime]',
  '[role="timer"]',
  '[data-badge-dynamic="true"]',

  // Avatar: <Avatar> do shadcn usa .avatar / img alt "avatar"; e fotos de perfil.
  'img[alt*="avatar" i]',
  'img[alt*="foto do usu" i]',
  'img[alt*="profile" i]',
  '[data-radix-avatar-image]',
  '[data-radix-avatar-fallback]',

  // Badges numéricos comuns (Radix/shadcn Badge + heurística de notificação).
  '[aria-label*="notifica" i]',
  '[aria-label*="notification" i]',
  '[aria-label*="mensagen" i]',
  '[aria-label*="streak" i]',
  '[aria-label*="ofensiva" i]',
  '[aria-label*="pontos" i]',
  '[aria-label*="xp" i]',
  '[aria-label*="n\u00edvel" i]',

  // Regiões live e animações (mudam entre frames).
  '[aria-live="polite"]',
  '[aria-live="assertive"]',
  '[role="status"]',
  '.animate-pulse',
  '.animate-spin',
  '.animate-bounce',
  '.animate-ping',
] as const;

export const VOLATILE_SELECTORS = [...TESTID_SELECTORS, ...STRUCTURAL_SELECTORS] as const;

/**
 * Converte a lista de seletores em Locators prontos para o `mask:` do
 * `toHaveScreenshot`. Seletores ausentes na página são ignorados pelo
 * Playwright automaticamente.
 */
export function volatileMasks(page: Page): Locator[] {
  return VOLATILE_SELECTORS.map((sel) => page.locator(sel));
}

/**
 * Diagnóstico: para cada seletor, conta ocorrências na página e reporta
 * os que ficaram em zero (mask no-op). Anexa o relatório ao `testInfo`
 * e, quando pelo menos um TESTID crítico não casou, imprime aviso
 * amarelo no stdout do runner (visível em CI).
 *
 * Retorna a lista de seletores sem match para permitir asserts opcionais.
 */
export async function auditMaskCoverage(page: Page, testInfo?: TestInfo): Promise<string[]> {
  const results: Array<{ selector: string; count: number; kind: 'testid' | 'structural' }> = [];

  for (const sel of TESTID_SELECTORS) {
    const count = await page.locator(sel).count().catch(() => 0);
    results.push({ selector: sel, count, kind: 'testid' });
  }
  for (const sel of STRUCTURAL_SELECTORS) {
    const count = await page.locator(sel).count().catch(() => 0);
    results.push({ selector: sel, count, kind: 'structural' });
  }

  const missing = results.filter((r) => r.count === 0).map((r) => r.selector);
  const missingTestids = results.filter((r) => r.kind === 'testid' && r.count === 0);

  const report = {
    total: results.length,
    matched: results.length - missing.length,
    missing,
    missingTestids: missingTestids.map((r) => r.selector),
    details: results,
  };

  if (testInfo) {
    await testInfo.attach('mask-coverage.json', {
      body: JSON.stringify(report, null, 2),
      contentType: 'application/json',
    });
  }

  if (missingTestids.length > 0) {
    // eslint-disable-next-line no-console
    console.warn(
      `\n\u001b[33m[visual-masks] AVISO: ${missingTestids.length}/${TESTID_SELECTORS.length} seletores testid não casaram (mask no-op):\u001b[0m\n` +
        missingTestids.map((r) => `  · ${r.selector}`).join('\n') +
        `\n\u001b[33m→ Fallbacks estruturais podem estar cobrindo, mas adicione os data-testid faltantes para proteção precisa.\u001b[0m\n`,
    );
  }

  return missing;
}
