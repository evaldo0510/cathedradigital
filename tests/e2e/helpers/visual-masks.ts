/**
 * Seletores centralizados de elementos DINÂMICOS que devem ser
 * mascarados em snapshots visuais para reduzir falsos positivos.
 *
 * REGRA: só entra aqui o que muda entre execuções sem indicar
 * regressão de layout (relógios, avatares, badges numéricos,
 * indicadores animados). NUNCA mascare conteúdo estável (títulos,
 * ícones fixos, estrutura do menu) — isso esconde bugs reais.
 */

import type { Page, Locator } from '@playwright/test';

export const VOLATILE_SELECTORS = [
  // Tempo e datas
  '[data-testid="clock"]',
  '[data-testid="current-time"]',
  '[data-testid="last-updated"]',
  'time',
  '[datetime]',

  // Identidade do usuário
  '[data-testid="user-avatar"]',
  '[data-testid="user-name"]',
  'img[alt*="avatar" i]',
  'img[alt*="foto do usuário" i]',

  // Contadores e badges dinâmicos
  '[data-testid="notification-badge"]',
  '[data-testid="streak-badge"]',
  '[data-testid="xp-counter"]',
  '[data-testid="level-badge"]',
  '[data-testid="unread-count"]',
  '[data-badge-dynamic="true"]',

  // Indicadores do BottomNav que animam com a rota ativa
  '[data-testid="bottom-nav-active-bg"]',
  '[data-testid="bottom-nav-dot"]',

  // Regiões live e animações
  '[aria-live="polite"]',
  '[aria-live="assertive"]',
  '.animate-pulse',
  '.animate-spin',
  '.animate-bounce',
] as const;

/**
 * Converte a lista de seletores em Locators prontos para o `mask:` do
 * `toHaveScreenshot`. Seletores ausentes na página são ignorados pelo
 * Playwright automaticamente.
 */
export function volatileMasks(page: Page): Locator[] {
  return VOLATILE_SELECTORS.map((sel) => page.locator(sel));
}
