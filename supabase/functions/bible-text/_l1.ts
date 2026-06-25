// =========================================================================
// L1 in-memory cache (TTL + SWR) — unit-testable.
// Conteúdo L2: fresh por 5min, depois stale por mais 5min (serve valor antigo
// e dispara refresh em background via waitUntil no caller). Hard-expire = 10min.
// Configs/flags: TTL curto (30s) sem SWR — propagam invalidações rápido.
// =========================================================================

export const L1_TTL_MS_L2 = 300_000;
export const L1_SWR_MS_L2 = 300_000;
export const L1_TTL_MS_CONFIG = 30_000;
export const L1_MAX_ENTRIES = 500;

export type L1Entry<T> = { value: T; freshUntil: number; hardExpiresAt: number };

export interface L1Cache {
  get<T>(key: string): { value: T; stale: boolean } | undefined;
  set<T>(key: string, value: T, ttlMs: number, swrMs?: number): void;
  invalidate(key: string): void;
  clear(): void;
  size(): number;
}

export interface CreateL1Options {
  now?: () => number;
  maxEntries?: number;
}

export function createL1Cache(opts: CreateL1Options = {}): L1Cache {
  const now = opts.now ?? (() => Date.now());
  const maxEntries = opts.maxEntries ?? L1_MAX_ENTRIES;
  const store = new Map<string, L1Entry<unknown>>();

  return {
    get<T>(key: string) {
      const e = store.get(key) as L1Entry<T> | undefined;
      if (!e) return undefined;
      const t = now();
      if (e.hardExpiresAt < t) { store.delete(key); return undefined; }
      return { value: e.value, stale: t > e.freshUntil };
    },
    set<T>(key: string, value: T, ttlMs: number, swrMs = 0) {
      const t = now();
      store.set(key, { value, freshUntil: t + ttlMs, hardExpiresAt: t + ttlMs + swrMs });
      if (store.size > maxEntries) {
        for (const [k, v] of store) if (v.hardExpiresAt < t) store.delete(k);
        if (store.size > maxEntries) {
          const firstKey = store.keys().next().value;
          if (firstKey !== undefined) store.delete(firstKey);
        }
      }
    },
    invalidate(key: string) { store.delete(key); },
    clear() { store.clear(); },
    size() { return store.size; },
  };
}

// =========================================================================
// Single-flight (request coalescing): garante que N chamadas paralelas para
// a mesma chave compartilhem UMA única promessa, evitando rajadas de fetch
// ao L2/Postgres quando o L1 está vazio ou atravessa fresh→stale.
// =========================================================================
export interface SingleFlight {
  run<T>(key: string, fn: () => Promise<T>): Promise<{ value: T; coalesced: boolean }>;
  inFlight(key: string): boolean;
  size(): number;
}

export function createSingleFlight(): SingleFlight {
  const map = new Map<string, Promise<unknown>>();
  return {
    inFlight(key) { return map.has(key); },
    size() { return map.size; },
    async run<T>(key: string, fn: () => Promise<T>) {
      const existing = map.get(key) as Promise<T> | undefined;
      if (existing) {
        const value = await existing;
        return { value, coalesced: true };
      }
      const p = (async () => fn())();
      map.set(key, p);
      try {
        const value = await p;
        return { value, coalesced: false };
      } finally {
        // Remove só se ainda for a mesma promessa (não pisa em uma nova já iniciada).
        if (map.get(key) === p) map.delete(key);
      }
    },
  };
}

