/**
 * Guard único para bloquear 100% dos prefetches relacionados ao calendário
 * litúrgico quando a flag `litcal_no_prefetch=1` está presente na URL.
 *
 * Persiste o estado em `sessionStorage` para que sobreviva a `page.reload()`
 * (usado pelos testes E2E de cache offline / TTL).
 *
 * Pontos cobertos:
 *  - `useLiturgicalMonth` → prefetch silencioso de meses adjacentes
 *  - `prefetch.prefetchEssentialContent` → prefetch da liturgia do dia
 *  - `LiturgiaPage.usePrefetchLiturgyCache` → prefetch dos 6 dias anteriores
 *  - Qualquer novo call site futuro que invoque a edge `liturgical-calendar`
 *    em background deve passar por este guard.
 */

const STORAGE_KEY = '__litcal_no_prefetch__';

const fromURL = (): boolean => {
  if (typeof window === 'undefined') return false;
  try {
    return new URLSearchParams(window.location.search).get('litcal_no_prefetch') === '1';
  } catch {
    return false;
  }
};

/** Snapshot inicial — chame uma vez no boot para travar para a sessão inteira. */
export const initLiturgicalPrefetchGuard = () => {
  if (typeof window === 'undefined') return;
  if (fromURL()) {
    try { window.sessionStorage.setItem(STORAGE_KEY, '1'); } catch { /* silent */ }
  }
};

/** True quando QUALQUER prefetch do calendário litúrgico deve ser bloqueado. */
export const isLiturgicalPrefetchDisabled = (): boolean => {
  if (typeof window === 'undefined') return false;
  if (fromURL()) return true;
  try {
    return window.sessionStorage.getItem(STORAGE_KEY) === '1';
  } catch {
    return false;
  }
};
