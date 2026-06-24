/**
 * Catechism Diagnostics
 * Logging detalhado e telemetria leve (client-side) para falhas de
 * carregamento de parágrafos do Catecismo.
 *
 * - Mantém um buffer circular dos últimos eventos em memória.
 * - Persiste os últimos 50 erros em localStorage (`cathedra_catechism_diag`).
 * - Dispara `CustomEvent('catechism-diagnostic')` para o painel de diagnóstico
 *   reagir em tempo real.
 * - Envia eventos para `analytics_events` quando possível (best-effort, silencioso).
 */
import { supabase } from '@/integrations/supabase/client';

export type CatechismDiagStep =
  | 'cache_hit'
  | 'official_query'
  | 'official_hit'
  | 'official_error'
  | 'local_hit'
  | 'edge_invoke'
  | 'edge_hit'
  | 'edge_not_found'
  | 'edge_error'
  | 'fallback_cached'
  | 'unauthorized'
  | 'forbidden'
  | 'final_error';

export interface CatechismDiagEvent {
  ts: number;
  paragraph: number;
  step: CatechismDiagStep;
  status?: number | string;
  message?: string;
  route?: string;
  meta?: Record<string, unknown>;
}

const STORAGE_KEY = 'cathedra_catechism_diag';
const MAX_PERSISTED = 50;
const MAX_BUFFER = 200;
const buffer: CatechismDiagEvent[] = [];

const isDebug = (): boolean => {
  try {
    if (typeof window === 'undefined') return false;
    const params = new URLSearchParams(window.location.search);
    if (params.get('debug') === '1') return true;
    return localStorage.getItem('cathedra_catechism_debug') === '1';
  } catch {
    return false;
  }
};

export const enableCatechismDebug = (on: boolean) => {
  try {
    if (on) localStorage.setItem('cathedra_catechism_debug', '1');
    else localStorage.removeItem('cathedra_catechism_debug');
  } catch {}
};

export const isCatechismDebugOn = (): boolean => isDebug();

const persistError = (ev: CatechismDiagEvent) => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const list: CatechismDiagEvent[] = raw ? JSON.parse(raw) : [];
    list.unshift(ev);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list.slice(0, MAX_PERSISTED)));
  } catch {}
};

const isErrorStep = (step: CatechismDiagStep) =>
  step === 'official_error' ||
  step === 'edge_error' ||
  step === 'edge_not_found' ||
  step === 'unauthorized' ||
  step === 'forbidden' ||
  step === 'final_error';

export const logCatechismDiag = (ev: Omit<CatechismDiagEvent, 'ts' | 'route'>) => {
  const full: CatechismDiagEvent = {
    ...ev,
    ts: Date.now(),
    route: typeof window !== 'undefined' ? window.location.pathname + window.location.search : undefined,
  };

  buffer.unshift(full);
  if (buffer.length > MAX_BUFFER) buffer.length = MAX_BUFFER;

  if (isErrorStep(full.step)) {
    persistError(full);
  }

  if (isDebug() || isErrorStep(full.step)) {
    const fn = isErrorStep(full.step) ? console.error : console.info;
    fn('[Catechism][%s] §%s status=%s msg=%s', full.step, full.paragraph, full.status ?? '-', full.message ?? '');
  }

  try {
    window.dispatchEvent(new CustomEvent('catechism-diagnostic', { detail: full }));
  } catch {}

  // Best-effort remote telemetry on errors only — never throws.
  if (isErrorStep(full.step)) {
    void sendRemote(full);
  }
};

const sendRemote = async (ev: CatechismDiagEvent) => {
  try {
    const { data: userData } = await supabase.auth.getUser();
    await supabase.from('analytics_events').insert({
      event_name: `catechism.${ev.step}`,
      user_id: userData?.user?.id ?? null,
      metadata: {
        paragraph: ev.paragraph,
        status: ev.status ?? null,
        message: ev.message ?? null,
        route: ev.route ?? null,
        ...(ev.meta ?? {}),
      } as any,
    } as any);
  } catch {
    /* silent */
  }
};

export const getCatechismDiagBuffer = (): CatechismDiagEvent[] => [...buffer];

export const getPersistedCatechismErrors = (): CatechismDiagEvent[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

export const clearCatechismDiag = () => {
  buffer.length = 0;
  try { localStorage.removeItem(STORAGE_KEY); } catch {}
  try { window.dispatchEvent(new CustomEvent('catechism-diagnostic-cleared')); } catch {}
};

/** Normaliza erros do Supabase/Edge em um código semântico. */
export const classifyCatechismError = (err: any): {
  code: 'unauthorized' | 'forbidden' | 'not_found' | 'network' | 'unknown';
  status?: number;
  message: string;
} => {
  const status: number | undefined =
    err?.status ?? err?.context?.status ?? err?.response?.status;
  const raw = (err?.message || err?.error_description || String(err || '')).toLowerCase();

  if (status === 401 || raw.includes('jwt') || raw.includes('unauthorized')) {
    return { code: 'unauthorized', status, message: 'Sessão inválida ou expirada.' };
  }
  if (status === 403 || raw.includes('forbidden') || raw.includes('permission denied') || raw.includes('row-level security')) {
    return { code: 'forbidden', status, message: 'Sem permissão para ler este parágrafo.' };
  }
  if (status === 404 || raw.includes('not_found') || raw.includes('não encontrado') || raw.includes('not found') || raw.includes('não disponível')) {
    return { code: 'not_found', status, message: 'Parágrafo não encontrado no banco oficial.' };
  }
  if (raw.includes('failed to fetch') || raw.includes('network')) {
    return { code: 'network', status, message: 'Falha de rede ao consultar o servidor.' };
  }
  return { code: 'unknown', status, message: err?.message || 'Erro desconhecido.' };
};
