/**
 * Persistência da última rota autenticada visitada.
 * Usada para restaurar o contexto do usuário após novo login
 * e para redirecionar da Landing (/) direto ao Átrio.
 */
const KEY = 'cathedra_last_route';

const EXCLUDED_PREFIXES = [
  '/auth',
  '/login',
  '/reset-password',
  '/.lovable',
  '/oauth',
];

const EXCLUDED_EXACT = new Set<string>(['/', '']);

export function isTrackableRoute(pathname: string): boolean {
  if (!pathname) return false;
  const clean = pathname.split(/[?#]/)[0];
  if (EXCLUDED_EXACT.has(clean)) return false;
  return !EXCLUDED_PREFIXES.some((p) => clean === p || clean.startsWith(`${p}/`));
}

export function setLastRoute(pathname: string): void {
  try {
    if (!isTrackableRoute(pathname)) return;
    localStorage.setItem(KEY, pathname);
  } catch {
    /* storage indisponível */
  }
}

export function getLastRoute(): string | null {
  try {
    const v = localStorage.getItem(KEY);
    return v && isTrackableRoute(v) ? v : null;
  } catch {
    return null;
  }
}

export function clearLastRoute(): void {
  try {
    localStorage.removeItem(KEY);
  } catch {
    /* noop */
  }
}

/** Rota padrão do usuário autenticado quando não há histórico. */
export const DEFAULT_AUTH_HOME = '/atrium';

export function resolveAuthHome(): string {
  return getLastRoute() ?? DEFAULT_AUTH_HOME;
}
