import { assertEquals, assertExists, assert, assertRejects } from "https://deno.land/std@0.224.0/assert/mod.ts";
import {
  createL1Cache,
  createSingleFlight,
  L1_TTL_MS_L2,
  L1_SWR_MS_L2,
} from "./_l1.ts";

function makeClock(start = 1_000_000) {
  let t = start;
  return { now: () => t, advance: (ms: number) => { t += ms; }, set: (v: number) => { t = v; } };
}

function deferred<T>() {
  let resolve!: (v: T) => void;
  let reject!: (e: unknown) => void;
  const promise = new Promise<T>((res, rej) => { resolve = res; reject = rej; });
  return { promise, resolve, reject };
}

// =========================================================================
// Single-flight (unitário)
// =========================================================================

Deno.test("SF: rajada paralela de 5 chamadas na mesma key compartilha 1 execução", async () => {
  const sf = createSingleFlight();
  let calls = 0;
  const d = deferred<string>();
  const fn = async () => { calls++; return await d.promise; };

  const all = Promise.all([
    sf.run("k", fn), sf.run("k", fn), sf.run("k", fn), sf.run("k", fn), sf.run("k", fn),
  ]);
  // Resolve a única execução em andamento.
  d.resolve("payload");
  const results = await all;

  assertEquals(calls, 1, "fn deve ser chamada exatamente 1 vez");
  for (const r of results) assertEquals(r.value, "payload");
  // Apenas a primeira NÃO é coalesced; as 4 seguintes sim.
  const coalescedCount = results.filter(r => r.coalesced).length;
  assertEquals(coalescedCount, 4);
  assertEquals(sf.size(), 0, "map deve estar limpo após resolver");
});

Deno.test("SF: chaves diferentes não interferem", async () => {
  const sf = createSingleFlight();
  let aCalls = 0, bCalls = 0;
  const da = deferred<number>(), db = deferred<number>();
  const pA = sf.run("a", async () => { aCalls++; return da.promise; });
  const pB = sf.run("b", async () => { bCalls++; return db.promise; });
  da.resolve(1); db.resolve(2);
  const [ra, rb] = await Promise.all([pA, pB]);
  assertEquals(ra.value, 1); assertEquals(rb.value, 2);
  assertEquals(aCalls, 1); assertEquals(bCalls, 1);
});

Deno.test("SF: rejeição propaga para todos os waiters e libera a key", async () => {
  const sf = createSingleFlight();
  const d = deferred<string>();
  const fn = () => d.promise;
  const pA = sf.run("k", fn);
  const pB = sf.run("k", fn);
  d.reject(new Error("boom"));
  await assertRejects(() => pA, Error, "boom");
  await assertRejects(() => pB, Error, "boom");
  assertEquals(sf.size(), 0, "key deve ser liberada após falha");

  // Próxima chamada após erro reexecuta normalmente.
  let calls = 0;
  const r = await sf.run("k", async () => { calls++; return "ok"; });
  assertEquals(calls, 1);
  assertEquals(r.value, "ok");
  assertEquals(r.coalesced, false);
});

Deno.test("SF: chamada SEQUENCIAL (não coalesce) reexecuta a função", async () => {
  const sf = createSingleFlight();
  let calls = 0;
  const r1 = await sf.run("k", async () => { calls++; return "a"; });
  const r2 = await sf.run("k", async () => { calls++; return "b"; });
  assertEquals(calls, 2);
  assertEquals(r1.coalesced, false);
  assertEquals(r2.coalesced, false);
});

// =========================================================================
// Integração L1 + SWR + Single-flight: simula fetchCacheL2Row sem Postgres.
// Reproduz o fluxo do edge: L1 hit fresh, stale serve+refresh em background,
// MISS coalesce N requests paralelos em 1 execução.
// =========================================================================

function makeFakeL2(initial: Record<string, { content: string; version: number }> = {}) {
  const store = new Map(Object.entries(initial));
  let queries = 0;
  return {
    queries: () => queries,
    set: (k: string, v: { content: string; version: number }) => store.set(k, v),
    fetch: async (k: string) => {
      queries++;
      // Yield a tick para simular round-trip.
      await new Promise<void>((r) => setTimeout(r, 1));
      return store.get(k) ?? null;
    },
  };
}

function makeBibleL1Harness() {
  const clock = makeClock();
  const l1 = createL1Cache({ now: clock.now });
  const sfFetch = createSingleFlight();
  const sfRefresh = createSingleFlight();
  const l2 = makeFakeL2();
  const events: Array<{ event: string; key: string }> = [];

  async function refreshInBackground(key: string) {
    if (sfRefresh.inFlight(`l2:${key}`)) {
      events.push({ event: "coalesced_refresh", key });
      return;
    }
    await sfRefresh.run(`l2:${key}`, async () => {
      const row = await l2.fetch(key);
      if (row) {
        l1.set(`l2:${key}`, row, L1_TTL_MS_L2, L1_SWR_MS_L2);
        events.push({ event: "swr_refresh_ok", key });
      } else {
        l1.invalidate(`l2:${key}`);
        events.push({ event: "swr_refresh_empty", key });
      }
    });
  }

  async function fetchRow(key: string) {
    const cached = l1.get<{ content: string; version: number }>(`l2:${key}`);
    if (cached) {
      if (cached.stale) {
        // Marca fresh imediato para evitar disparos múltiplos entre o trigger e o término do refresh.
        l1.set(`l2:${key}`, cached.value, L1_TTL_MS_L2, L1_SWR_MS_L2);
        events.push({ event: "served_stale", key });
        // background — NÃO aguardado pelo caller (simula waitUntil).
        void refreshInBackground(key);
      } else {
        events.push({ event: "hit_fresh", key });
      }
      return cached.value;
    }
    const { value, coalesced } = await sfFetch.run(`l2:${key}`, async () => {
      const row = await l2.fetch(key);
      if (row) l1.set(`l2:${key}`, row, L1_TTL_MS_L2, L1_SWR_MS_L2);
      return row;
    });
    events.push({ event: coalesced ? "coalesced_fetch" : "miss", key });
    return value;
  }

  return { clock, l1, l2, events, fetchRow, refreshInBackground };
}

Deno.test("E2E: HIT fresh dentro dos 5min não consulta L2", async () => {
  const h = makeBibleL1Harness();
  h.l2.set("Lv|1", { content: "v1", version: 1 });
  await h.fetchRow("Lv|1"); // MISS (1 query)
  h.clock.advance(60_000);  // 1 min depois
  await h.fetchRow("Lv|1"); // fresh
  await h.fetchRow("Lv|1"); // fresh
  assertEquals(h.l2.queries(), 1);
  assertEquals(h.events.filter(e => e.event === "hit_fresh").length, 2);
});

Deno.test("E2E: STALE entre 5-10min serve imediatamente e dispara refresh em background", async () => {
  const h = makeBibleL1Harness();
  h.l2.set("Ex|1", { content: "v1", version: 1 });
  await h.fetchRow("Ex|1"); // MISS, popula L1

  // Atualiza L2 (nova versão) e avança para janela SWR.
  h.l2.set("Ex|1", { content: "v2", version: 2 });
  h.clock.advance(L1_TTL_MS_L2 + 30_000); // 5m30s

  const t0 = performance.now();
  const served = await h.fetchRow("Ex|1");
  const elapsed = performance.now() - t0;

  // Resposta imediata com valor antigo.
  assertEquals(served?.content, "v1", "stale serve valor antigo sem bloquear");
  assert(elapsed < 50, `resposta stale deve ser ~instantânea, foi ${elapsed}ms`);
  assertExists(h.events.find(e => e.event === "served_stale"));

  // Aguarda refresh em background concluir (microtask + setTimeout 1ms do fake L2).
  await new Promise((r) => setTimeout(r, 20));

  assertExists(h.events.find(e => e.event === "swr_refresh_ok"));

  // Próxima leitura deve ver o valor novo (refresh atualizou L1).
  const next = await h.fetchRow("Ex|1");
  assertEquals(next?.content, "v2");
});

Deno.test("E2E: rajada paralela em MISS coalesce em 1 query ao L2", async () => {
  const h = makeBibleL1Harness();
  h.l2.set("Nm|1", { content: "x", version: 1 });
  const results = await Promise.all([
    h.fetchRow("Nm|1"), h.fetchRow("Nm|1"), h.fetchRow("Nm|1"),
    h.fetchRow("Nm|1"), h.fetchRow("Nm|1"),
  ]);
  assertEquals(h.l2.queries(), 1, "single-flight: 1 query para 5 requests paralelos");
  for (const r of results) assertEquals(r?.content, "x");
  assertEquals(h.events.filter(e => e.event === "coalesced_fetch").length, 4);
  assertEquals(h.events.filter(e => e.event === "miss").length, 1);
});

Deno.test("E2E: múltiplos disparos de SWR para a mesma key coalescem em 1 refresh", async () => {
  const h = makeBibleL1Harness();
  h.l2.set("Dt|1", { content: "v1", version: 1 });
  await h.fetchRow("Dt|1"); // MISS popula L1
  h.clock.advance(L1_TTL_MS_L2 + 10_000); // entra em SWR

  // 4 leituras consecutivas no estado stale. Todas devem servir, mas o refresh
  // em background deve coalescer (única query extra ao L2).
  await Promise.all([h.fetchRow("Dt|1"), h.fetchRow("Dt|1"), h.fetchRow("Dt|1"), h.fetchRow("Dt|1")]);

  // Após primeira leitura stale, L1 foi reset para fresh — então 2ª/3ª/4ª são hit_fresh.
  // Mas no ponto em que duas chegassem simultaneamente antes do reset, o coalesce do
  // refresh evitaria múltiplos round-trips. Garantimos pelo menos 1 refresh disparado.
  await new Promise((r) => setTimeout(r, 20));
  assert(h.events.filter(e => e.event === "swr_refresh_ok").length >= 1);
  // L2 consultado: 1 vez (MISS inicial) + 1 vez (refresh) = 2 total.
  assertEquals(h.l2.queries(), 2);
});

Deno.test("E2E: hard-expire após 10min volta para MISS (e single-flight cobre rajada)", async () => {
  const h = makeBibleL1Harness();
  h.l2.set("Js|1", { content: "v1", version: 1 });
  await h.fetchRow("Js|1");
  assertEquals(h.l2.queries(), 1);

  h.clock.advance(L1_TTL_MS_L2 + L1_SWR_MS_L2 + 1); // > 10min

  // Rajada paralela após hard-expire: deve coalescer em 1 query.
  await Promise.all([h.fetchRow("Js|1"), h.fetchRow("Js|1"), h.fetchRow("Js|1")]);
  assertEquals(h.l2.queries(), 2, "1 inicial + 1 após hard-expire (rajada coalesced)");
});
