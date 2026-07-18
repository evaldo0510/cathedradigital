/**
 * Estado compartilhado e utilitários puros do painel Nexus.
 * Isolado do componente para permitir testes unitários determinísticos
 * (persistência, deep-link, atalhos, aria-live, sync entre abas).
 */

export const NEXUS_STATE_KEY = 'nexus:state:v1';
export const NEXUS_STATE_MAX_AGE_MS = 1000 * 60 * 60 * 24; // 24h

export type PersistedNexusState = {
  tagId: string;
  tagSlug?: string;
  path: string;
  historyIds: string[];
  activeSectionIdx: number;
  visitedKinds: string[];
  focusMode?: boolean;
  ts: number;
};

export const readPersistedState = (
  storage: Storage | undefined = typeof window !== 'undefined' ? window.localStorage : undefined,
): PersistedNexusState | null => {
  if (!storage) return null;
  try {
    const raw = storage.getItem(NEXUS_STATE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as PersistedNexusState;
    if (Date.now() - (parsed.ts || 0) > NEXUS_STATE_MAX_AGE_MS) return null;
    return parsed;
  } catch {
    return null;
  }
};

export const writePersistedState = (
  s: PersistedNexusState | null,
  storage: Storage | undefined = typeof window !== 'undefined' ? window.localStorage : undefined,
) => {
  if (!storage) return;
  try {
    if (s === null) storage.removeItem(NEXUS_STATE_KEY);
    else storage.setItem(NEXUS_STATE_KEY, JSON.stringify(s));
  } catch {
    /* silencioso */
  }
};

/* -------------------------------------------------------------------------- */
/* Atalhos de teclado                                                          */
/* -------------------------------------------------------------------------- */

export type KeyLike = {
  key: string;
  altKey?: boolean;
  ctrlKey?: boolean;
  metaKey?: boolean;
  shiftKey?: boolean;
};

/**
 * Retorna o novo índice de seção com base no evento de teclado.
 * `null` = nenhuma ação (o handler deve ignorar).
 * Reconhece: Alt+ArrowRight/ArrowLeft e as teclas `]` / `[`.
 */
export const reduceSectionKeyboard = (
  e: KeyLike,
  current: number,
  total: number,
): number | null => {
  if (total <= 0) return null;
  const isNext = (e.altKey && e.key === 'ArrowRight') || e.key === ']';
  const isPrev = (e.altKey && e.key === 'ArrowLeft') || e.key === '[';
  if (isNext) return Math.min(current + 1, total - 1);
  if (isPrev) return Math.max(current - 1, 0);
  return null;
};

/**
 * Alterna modo foco quando `f` é pressionado sem modificadores.
 */
export const isFocusToggleKey = (e: KeyLike): boolean =>
  e.key === 'f' && !e.altKey && !e.ctrlKey && !e.metaKey && !e.shiftKey;

/* -------------------------------------------------------------------------- */
/* Mensagens aria-live                                                         */
/* -------------------------------------------------------------------------- */

export const sectionLiveMessage = (idx: number, total: number, eyebrow: string): string =>
  `Seção ${idx + 1} de ${total}: ${eyebrow}`;

export const restoredLiveMessage = (label: string): string =>
  `Painel Nexus restaurado em ${label}`;

export const closedLiveMessage = (): string =>
  'Painel fechado. Trecho anterior restaurado.';

export const focusModeLiveMessage = (on: boolean): string =>
  on ? 'Modo foco ativado. Apenas a passagem atual está visível.' : 'Modo foco desativado.';

/* -------------------------------------------------------------------------- */
/* Deep link (hash)                                                            */
/* -------------------------------------------------------------------------- */

export type NexusDeepLink = { slug: string; kind?: string };

/**
 * Formato: `#nexus=<slug>[:kind]`
 * Ex.: `#nexus=maria`, `#nexus=maria:bible`
 */
export const parseNexusHash = (hash: string): NexusDeepLink | null => {
  if (!hash) return null;
  const clean = hash.startsWith('#') ? hash.slice(1) : hash;
  const params = new URLSearchParams(clean);
  const value = params.get('nexus');
  if (!value) return null;
  const [slug, kind] = value.split(':');
  if (!slug) return null;
  return kind ? { slug, kind } : { slug };
};

export const buildNexusHash = (slug: string, kind?: string): string => {
  const value = kind ? `${slug}:${kind}` : slug;
  return `#nexus=${encodeURIComponent(value).replace(/%3A/gi, ':')}`;
};

/**
 * Compõe URL completa deep-linkável para compartilhar.
 */
export const buildNexusShareUrl = (
  baseUrl: string,
  slug: string,
  kind?: string,
): string => {
  const [pathAndQuery] = baseUrl.split('#');
  return `${pathAndQuery}${buildNexusHash(slug, kind)}`;
};
