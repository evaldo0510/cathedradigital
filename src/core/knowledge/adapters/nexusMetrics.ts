/**
 * nexusMetrics — coleta leve de métricas dos adapters do Nexus
 * (glossaryAutoNexus e journeyAutoNexus).
 *
 * - Sem efeitos colaterais em produção além de mutação de contadores.
 * - Sem I/O, sem rede: apenas um objeto in-memory.
 * - Um único listener é notificado a cada evento (usado pelo overlay dev).
 *
 * Contrato:
 *   • `recordNexusMetric` é o único ponto de escrita.
 *   • `getNexusMetricsSnapshot` devolve uma cópia imutável.
 *   • `subscribeNexusMetrics` retorna uma função de unsubscribe.
 */

export type NexusAdapter = 'glossary' | 'journey' | 'prayer';

export interface NexusMetricEvent {
  adapter: NexusAdapter;
  hit: boolean;
  /** Tempo total do `resolve*` (inclui lookup de cache). */
  ms: number;
  /** Fingerprint que serviu como chave da cache. */
  key: string;
}

export interface AdapterMetrics {
  hits: number;
  misses: number;
  /** Média móvel simples do tempo total (ms). */
  avgMs: number;
  /** Tempo do último evento (ms). */
  lastMs: number;
  /** Timestamp do último evento (epoch ms). */
  lastAt: number | null;
}

export interface NexusMetricsSnapshot {
  glossary: AdapterMetrics;
  journey: AdapterMetrics;
}

const zero = (): AdapterMetrics => ({
  hits: 0,
  misses: 0,
  avgMs: 0,
  lastMs: 0,
  lastAt: null,
});

const state: NexusMetricsSnapshot = {
  glossary: zero(),
  journey: zero(),
};

type Listener = (snap: NexusMetricsSnapshot) => void;
const listeners = new Set<Listener>();

export function recordNexusMetric(evt: NexusMetricEvent): void {
  const bucket = state[evt.adapter];
  if (!bucket) return;
  if (evt.hit) bucket.hits += 1;
  else bucket.misses += 1;
  const total = bucket.hits + bucket.misses;
  // Média incremental para evitar armazenar histórico.
  bucket.avgMs = bucket.avgMs + (evt.ms - bucket.avgMs) / total;
  bucket.lastMs = evt.ms;
  bucket.lastAt = Date.now();
  for (const l of listeners) l(cloneSnapshot());
}

export function getNexusMetricsSnapshot(): NexusMetricsSnapshot {
  return cloneSnapshot();
}

export function resetNexusMetrics(): void {
  state.glossary = zero();
  state.journey = zero();
  for (const l of listeners) l(cloneSnapshot());
}

export function subscribeNexusMetrics(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** Taxa de cache hit em [0, 1]. Retorna 0 quando ainda não houve evento. */
export function hitRate(m: AdapterMetrics): number {
  const total = m.hits + m.misses;
  return total === 0 ? 0 : m.hits / total;
}

function cloneSnapshot(): NexusMetricsSnapshot {
  return {
    glossary: { ...state.glossary },
    journey: { ...state.journey },
  };
}
