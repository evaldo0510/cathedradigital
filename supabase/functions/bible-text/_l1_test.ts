import { assertEquals, assertExists, assert } from "https://deno.land/std@0.224.0/assert/mod.ts";
import {
  createL1Cache,
  L1_TTL_MS_L2,
  L1_SWR_MS_L2,
  L1_TTL_MS_CONFIG,
} from "./_l1.ts";

// Clock virtual permite testar TTL/SWR de minutos sem esperar.
function makeClock(start = 1_000_000) {
  let t = start;
  return {
    now: () => t,
    advance: (ms: number) => { t += ms; },
    set: (v: number) => { t = v; },
  };
}

Deno.test("L1: MISS quando chave nunca foi setada", () => {
  const c = createL1Cache({ now: () => 0 });
  assertEquals(c.get("nope"), undefined);
});

Deno.test("L1: HIT fresh imediatamente após set", () => {
  const clock = makeClock();
  const c = createL1Cache({ now: clock.now });
  c.set("k", { v: 1 }, L1_TTL_MS_L2, L1_SWR_MS_L2);
  const r = c.get<{ v: number }>("k");
  assertExists(r);
  assertEquals(r!.value.v, 1);
  assertEquals(r!.stale, false);
});

Deno.test("L1: ainda fresh em 4min59s (TTL 5min)", () => {
  const clock = makeClock();
  const c = createL1Cache({ now: clock.now });
  c.set("k", "v", L1_TTL_MS_L2, L1_SWR_MS_L2);
  clock.advance(L1_TTL_MS_L2 - 1_000); // 4m59s
  const r = c.get<string>("k");
  assertExists(r);
  assertEquals(r!.stale, false);
});

Deno.test("L1: vira STALE entre 5min e 10min (janela SWR)", () => {
  const clock = makeClock();
  const c = createL1Cache({ now: clock.now });
  c.set("k", "v", L1_TTL_MS_L2, L1_SWR_MS_L2);
  clock.advance(L1_TTL_MS_L2 + 1_000); // 5m01s
  const r = c.get<string>("k");
  assertExists(r);
  assertEquals(r!.value, "v");
  assertEquals(r!.stale, true);

  clock.advance(L1_SWR_MS_L2 - 2_000); // ~9m59s total
  const r2 = c.get<string>("k");
  assertExists(r2);
  assertEquals(r2!.stale, true);
});

Deno.test("L1: hard-expire em 10min (TTL + SWR) — volta para MISS", () => {
  const clock = makeClock();
  const c = createL1Cache({ now: clock.now });
  c.set("k", "v", L1_TTL_MS_L2, L1_SWR_MS_L2);
  clock.advance(L1_TTL_MS_L2 + L1_SWR_MS_L2 + 1);
  assertEquals(c.get("k"), undefined);
  // Entrada removida durante o get.
  assertEquals(c.size(), 0);
});

Deno.test("L1: config (TTL 30s, sem SWR) expira direto para MISS sem janela stale", () => {
  const clock = makeClock();
  const c = createL1Cache({ now: clock.now });
  c.set("cfg:flag", true, L1_TTL_MS_CONFIG); // swr=0
  clock.advance(L1_TTL_MS_CONFIG - 1);
  assertEquals(c.get<boolean>("cfg:flag")?.stale, false);
  clock.advance(2); // passa do TTL
  // hardExpire == freshUntil quando swr=0: get retorna undefined.
  assertEquals(c.get("cfg:flag"), undefined);
});

Deno.test("L1: rajada serial de 10 leituras no mesmo capítulo serve do cache sem reescrever", () => {
  const clock = makeClock();
  const c = createL1Cache({ now: clock.now });
  let writes = 0;
  const wrappedSet = (k: string, v: unknown) => { writes++; c.set(k, v, L1_TTL_MS_L2, L1_SWR_MS_L2); };

  // Simula o fluxo: primeira chamada faz MISS → set, próximas reaproveitam.
  for (let i = 0; i < 10; i++) {
    clock.advance(50); // 50ms entre requisições
    const hit = c.get<string>("l2:Lv|1");
    if (!hit) wrappedSet("l2:Lv|1", "verses-payload");
  }
  assertEquals(writes, 1, "deve escrever no L1 apenas no primeiro MISS");
});

Deno.test("L1: rajada que cruza a fronteira fresh→stale ainda serve valor (SWR)", () => {
  const clock = makeClock();
  const c = createL1Cache({ now: clock.now });
  c.set("l2:Ex|1", "payload", L1_TTL_MS_L2, L1_SWR_MS_L2);

  const observations: Array<{ atMs: number; stale: boolean | null }> = [];
  // 6 amostras: 0, 2min, 4min, 5min30s, 7min, 9min30s
  const offsets = [0, 120_000, 240_000, 330_000, 420_000, 570_000];
  for (const off of offsets) {
    clock.set(1_000_000 + off);
    const r = c.get<string>("l2:Ex|1");
    observations.push({ atMs: off, stale: r ? r.stale : null });
  }

  assertEquals(observations[0].stale, false);
  assertEquals(observations[1].stale, false);
  assertEquals(observations[2].stale, false);
  assertEquals(observations[3].stale, true, "5min30s deve estar stale");
  assertEquals(observations[4].stale, true);
  assertEquals(observations[5].stale, true);
  for (const o of observations) assert(o.stale !== null, `não pode ser MISS em t=${o.atMs}`);
});

Deno.test("L1: invalidate força MISS imediato", () => {
  const c = createL1Cache();
  c.set("k", 1, L1_TTL_MS_L2, L1_SWR_MS_L2);
  assertExists(c.get("k"));
  c.invalidate("k");
  assertEquals(c.get("k"), undefined);
});

Deno.test("L1: LRU básico — quando excede maxEntries, remove a chave mais antiga", () => {
  const clock = makeClock();
  const c = createL1Cache({ now: clock.now, maxEntries: 3 });
  c.set("a", 1, L1_TTL_MS_L2, L1_SWR_MS_L2);
  c.set("b", 2, L1_TTL_MS_L2, L1_SWR_MS_L2);
  c.set("c", 3, L1_TTL_MS_L2, L1_SWR_MS_L2);
  c.set("d", 4, L1_TTL_MS_L2, L1_SWR_MS_L2); // excede
  assertEquals(c.get("a"), undefined, "mais antiga foi removida");
  assertExists(c.get("d"));
  assert(c.size() <= 3);
});
