/**
 * Pré-aquece o cache L2 da Bíblia chamando a edge `bible-text` em modo warm
 * para cada (livro, capítulo) listado.
 *
 * Uso (Deno):
 *   deno run --allow-net --allow-env --allow-read scripts/warm-bible-cache.ts
 *
 * Variáveis opcionais:
 *   WARM_CONCURRENCY      (default 4)
 *   WARM_BOOKS            csv de abbrs para filtrar (ex.: "Sl,Mt,Mc,Lc,Jo")
 *   WARM_TIER             "hot" | "core" | "deutero" | "all" (default "hot")
 *   WARM_DRY_RUN          "1" → só lista, não chama
 *
 * Requer no .env (ou no shell): VITE_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY.
 * Sem a service role, o script tenta VITE_SUPABASE_PUBLISHABLE_KEY.
 */
import "https://deno.land/std@0.224.0/dotenv/load.ts";
import { BIBLE_CANON, type BibleBook } from "../supabase/functions/_shared/bibleCanon.ts";

const SUPABASE_URL = Deno.env.get("VITE_SUPABASE_URL") || Deno.env.get("SUPABASE_URL");
const KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || Deno.env.get("VITE_SUPABASE_PUBLISHABLE_KEY");
if (!SUPABASE_URL || !KEY) {
  console.error("Missing VITE_SUPABASE_URL / (SUPABASE_SERVICE_ROLE_KEY | VITE_SUPABASE_PUBLISHABLE_KEY).");
  Deno.exit(2);
}

const CONCURRENCY = Math.max(1, Number(Deno.env.get("WARM_CONCURRENCY") || 4));
const BOOKS_FILTER = (Deno.env.get("WARM_BOOKS") || "").split(",").map((s) => s.trim()).filter(Boolean);
const TIER = (Deno.env.get("WARM_TIER") || "hot").toLowerCase();
const DRY = Deno.env.get("WARM_DRY_RUN") === "1";

const HOT = new Set(["Sl", "Pv", "Mt", "Mc", "Lc", "Jo"]);
function tierOf(b: BibleBook): "hot" | "core" | "deutero" {
  if (b.deuterocanonical) return "deutero";
  if (HOT.has(b.abbr)) return "hot";
  return "core";
}

// Contagem de capítulos por livro — fonte: cânon protestante/católico padrão.
// Mantida estática para não depender do DB; se um capítulo extra existir, o warm
// apenas falha aquele item e continua.
const CHAPTERS: Record<string, number> = {
  Gn: 50, Ex: 40, Lv: 27, Nm: 36, Dt: 34, Js: 24, Jz: 21, Rt: 4,
  "1Sm": 31, "2Sm": 24, "1Rs": 22, "2Rs": 25, "1Cr": 29, "2Cr": 36,
  Ed: 10, Ne: 13, Et: 10, "Jó": 42, Sl: 150, Pv: 31, Ec: 12, Ct: 8,
  Is: 66, Jr: 52, Lm: 5, Ez: 48, Dn: 14, Os: 14, Jl: 3, Am: 9, Ab: 1,
  Jn: 4, Mq: 7, Na: 3, Hc: 3, Sf: 3, Ag: 2, Zc: 14, Ml: 4,
  Mt: 28, Mc: 16, Lc: 24, Jo: 21, At: 28, Rm: 16, "1Co": 16, "2Co": 13,
  Gl: 6, Ef: 6, Fp: 4, Cl: 4, "1Ts": 5, "2Ts": 3, "1Tm": 6, "2Tm": 4,
  Tt: 3, Fm: 1, Hb: 13, Tg: 5, "1Pe": 5, "2Pe": 3, "1Jo": 5, "2Jo": 1, "3Jo": 1, Jd: 1, Ap: 22,
  // Deuterocanônicos
  Tb: 14, Jt: 16, Sb: 19, Eclo: 51, Br: 6, "1Mc": 16, "2Mc": 15,
};

type Task = { abbrev: string; chapter: number; tier: string };

const tasks: Task[] = [];
for (const book of BIBLE_CANON) {
  if (BOOKS_FILTER.length && !BOOKS_FILTER.includes(book.abbr)) continue;
  const t = tierOf(book);
  if (TIER !== "all" && t !== TIER) continue;
  const count = CHAPTERS[book.abbr] ?? 0;
  for (let c = 1; c <= count; c++) tasks.push({ abbrev: book.abbr, chapter: c, tier: t });
}

console.log(`[warm] total tasks=${tasks.length} concurrency=${CONCURRENCY} tier=${TIER} dry=${DRY}`);
if (DRY) {
  for (const t of tasks.slice(0, 20)) console.log(" ·", t);
  console.log(`(showing first 20 of ${tasks.length})`);
  Deno.exit(0);
}

const url = `${SUPABASE_URL}/functions/v1/bible-text`;
let done = 0, ok = 0, fail = 0;
const t0 = Date.now();
const perBook = new Map<string, { ok: number; fail: number; ms: number }>();

async function runOne(task: Task) {
  const start = Date.now();
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${KEY}`, apikey: KEY! },
      body: JSON.stringify({ abbrev: task.abbrev, chapter: task.chapter, warm: true }),
    });
    const j = await res.json().catch(() => ({}));
    const ms = Date.now() - start;
    const success = res.ok && j?.ok;
    const slot = perBook.get(task.abbrev) || { ok: 0, fail: 0, ms: 0 };
    slot.ms += ms;
    if (success) { slot.ok++; ok++; } else { slot.fail++; fail++; }
    perBook.set(task.abbrev, slot);
    done++;
    if (done % 20 === 0 || done === tasks.length) {
      const pct = ((done / tasks.length) * 100).toFixed(1);
      console.log(`[warm] ${done}/${tasks.length} (${pct}%) ok=${ok} fail=${fail} elapsed=${((Date.now() - t0) / 1000).toFixed(1)}s`);
    }
    if (!success) console.warn(`  ✗ ${task.abbrev} ${task.chapter} status=${res.status} src=${j?.source ?? "—"}`);
  } catch (e) {
    fail++; done++;
    console.warn(`  ✗ ${task.abbrev} ${task.chapter} error=${String((e as any)?.message || e)}`);
  }
}

// Pool de concorrência simples
const queue = [...tasks];
const workers = Array.from({ length: CONCURRENCY }, async () => {
  while (queue.length) {
    const t = queue.shift();
    if (!t) break;
    await runOne(t);
  }
});
await Promise.all(workers);

console.log("\n[warm] === Resumo por livro ===");
for (const [abbr, s] of [...perBook.entries()].sort()) {
  const avg = s.ok + s.fail > 0 ? (s.ms / (s.ok + s.fail)).toFixed(0) : "—";
  console.log(`  ${abbr.padEnd(5)} ok=${s.ok} fail=${s.fail} avg=${avg}ms`);
}
console.log(`\n[warm] DONE in ${((Date.now() - t0) / 1000).toFixed(1)}s · ok=${ok} fail=${fail}`);
Deno.exit(fail > 0 ? 1 : 0);
