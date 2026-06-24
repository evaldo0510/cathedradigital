/**
 * Magisterium Diagnostics — espelha o padrão do CatechismDiagnostics.
 *
 * Ligado quando `?debug=1` está na URL ou `localStorage.cathedra_magisterium_debug = '1'`.
 *
 * - Buffer circular em memória + persistência opcional em localStorage.
 * - Reidrata ao recarregar.
 * - Destaca eventos `cache_thin` / `fetch_thin` / `fetch_404`.
 */

export type MagisteriumDiagStep =
  | 'cache_hit'
  | 'cache_thin'
  | 'fetch_ok'
  | 'fetch_thin'
  | 'fetch_404'
  | 'fetch_error'
  | 'final_error';

export interface MagisteriumDiagEvent {
  ts: number;
  docId?: string;
  url?: string;
  step: MagisteriumDiagStep;
  status?: number | string;
  contentLength?: number;
  message?: string;
  route?: string;
  meta?: Record<string, unknown>;
}

const DEBUG_KEY = 'cathedra_magisterium_debug';
const TIMELINE_KEY = 'cathedra_magisterium_diag_timeline';
const ERRORS_KEY = 'cathedra_magisterium_diag_errors';
const MAX_BUFFER = 200;
const MAX_PERSISTED_ERRORS = 50;
const PERSIST_DEBOUNCE_MS = 400;

const rehydrate = (): MagisteriumDiagEvent[] => {
  try {
    if (typeof window === 'undefined') return [];
    const raw = window.localStorage.getItem(TIMELINE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.slice(0, MAX_BUFFER) : [];
  } catch {
    return [];
  }
};

const buffer: MagisteriumDiagEvent[] = rehydrate();

let persistTimer: ReturnType<typeof setTimeout> | null = null;
const schedulePersist = () => {
  if (typeof window === 'undefined' || persistTimer) return;
  persistTimer = setTimeout(() => {
    persistTimer = null;
    try {
      window.localStorage.setItem(TIMELINE_KEY, JSON.stringify(buffer.slice(0, MAX_BUFFER)));
    } catch {/* quota — silencioso */}
  }, PERSIST_DEBOUNCE_MS);
};

const isThinOrErrorStep = (s: MagisteriumDiagStep) =>
  s === 'cache_thin' || s === 'fetch_thin' || s === 'fetch_404' || s === 'fetch_error' || s === 'final_error';

const persistError = (ev: MagisteriumDiagEvent) => {
  try {
    if (typeof window === 'undefined') return;
    const raw = window.localStorage.getItem(ERRORS_KEY);
    const list: MagisteriumDiagEvent[] = raw ? JSON.parse(raw) : [];
    list.unshift(ev);
    window.localStorage.setItem(ERRORS_KEY, JSON.stringify(list.slice(0, MAX_PERSISTED_ERRORS)));
  } catch {/* silent */}
};

export const isMagisteriumDebugOn = (): boolean => {
  try {
    if (typeof window === 'undefined') return false;
    const params = new URLSearchParams(window.location.search);
    if (params.get('debug') === '1') return true;
    return window.localStorage.getItem(DEBUG_KEY) === '1';
  } catch {
    return false;
  }
};

export const enableMagisteriumDebug = (on: boolean) => {
  try {
    if (on) localStorage.setItem(DEBUG_KEY, '1');
    else localStorage.removeItem(DEBUG_KEY);
  } catch {/* silent */}
};

export const logMagisteriumDiag = (ev: Omit<MagisteriumDiagEvent, 'ts' | 'route'>) => {
  const full: MagisteriumDiagEvent = {
    ...ev,
    ts: Date.now(),
    route: typeof window !== 'undefined' ? window.location.pathname + window.location.search : undefined,
  };
  buffer.unshift(full);
  if (buffer.length > MAX_BUFFER) buffer.length = MAX_BUFFER;
  schedulePersist();

  if (isThinOrErrorStep(full.step)) persistError(full);

  if (isMagisteriumDebugOn() || isThinOrErrorStep(full.step)) {
    const fn = isThinOrErrorStep(full.step) ? console.warn : console.info;
    fn('[Magisterium][%s] %s status=%s len=%s', full.step, full.docId ?? full.url ?? '-', full.status ?? '-', full.contentLength ?? '-');
  }

  try {
    window.dispatchEvent(new CustomEvent('magisterium-diagnostic', { detail: full }));
  } catch {/* silent */}
};

export const getMagisteriumDiagBuffer = (): MagisteriumDiagEvent[] => [...buffer];

export const getPersistedMagisteriumErrors = (): MagisteriumDiagEvent[] => {
  try {
    if (typeof window === 'undefined') return [];
    const raw = window.localStorage.getItem(ERRORS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

export const clearMagisteriumDiag = () => {
  buffer.length = 0;
  if (persistTimer) { clearTimeout(persistTimer); persistTimer = null; }
  try { localStorage.removeItem(TIMELINE_KEY); } catch {/* silent */}
  try { localStorage.removeItem(ERRORS_KEY); } catch {/* silent */}
  try { window.dispatchEvent(new CustomEvent('magisterium-diagnostic-cleared')); } catch {/* silent */}
};
