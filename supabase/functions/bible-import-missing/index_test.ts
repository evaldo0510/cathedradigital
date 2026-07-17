/**
 * Testes de bible-import-missing.
 *
 * Cobre:
 *  - validate: normalização e mensagens de erro do código de tradução
 *  - dry_run/start: normalização da seleção (idempotente na entrada)
 *  - retry_of: idempotência do plano — dados já existentes → plano vazio
 *  - filtro por seleção não duplica registros já presentes
 *
 * Execução: deno test -A supabase/functions/bible-import-missing/index_test.ts
 */
import {
  assertEquals,
  assertThrows,
  assert,
} from "https://deno.land/std@0.224.0/assert/mod.ts";
import {
  normalizeTranslation,
  normalizeSelection,
  planMissing,
  type PlanCanonEntry,
} from "./helpers.ts";

// ─────────────── normalizeTranslation (validate) ───────────────

Deno.test("validate: aceita códigos alfanuméricos maiúsculos", () => {
  assertEquals(normalizeTranslation("NVIPT"), "NVIPT");
  assertEquals(normalizeTranslation(" nvipt "), "NVIPT");
  assertEquals(normalizeTranslation("naa"), "NAA");
  assertEquals(normalizeTranslation("ARA"), "ARA");
  assertEquals(normalizeTranslation("KJV1611"), "KJV1611");
});

Deno.test("validate: rejeita entradas inválidas com mensagem clara", () => {
  const bad = ["", "  ", "N", "toolongcode11", "NVI-PT", "NVI PT", null, undefined, 123, {}];
  for (const v of bad) {
    const err = assertThrows(() => normalizeTranslation(v as unknown), Error);
    assert(
      err.message.includes("Código de tradução inválido"),
      `mensagem para ${JSON.stringify(v)} deveria mencionar tradução inválida: ${err.message}`,
    );
    assert(
      err.message.includes("NVIPT") || err.message.includes("NAA") || err.message.includes("ARA"),
      "mensagem deveria orientar formatos válidos",
    );
  }
});

// ─────────────── normalizeSelection (dry_run / start) ───────────────

Deno.test("dry_run/start: seleção vazia/nula vira null (importa tudo)", () => {
  assertEquals(normalizeSelection(null), null);
  assertEquals(normalizeSelection(undefined), null);
  assertEquals(normalizeSelection([]), null);
  assertEquals(normalizeSelection("Gn" as unknown), null);
});

Deno.test("dry_run/start: seleção descarta itens inválidos", () => {
  const s = normalizeSelection([
    { abbrev: "Gn" },
    { abbrev: "" }, // ignorado
    { abbrev: "  " }, // ignorado
    null, // ignorado
    { abbrev: "Ex", chapters: [1, 2, 3] },
  ]);
  assertEquals(s, [
    { abbrev: "Gn", chapters: undefined },
    { abbrev: "Ex", chapters: [1, 2, 3] },
  ]);
});

Deno.test("dry_run/start: capítulos filtram só inteiros positivos", () => {
  const s = normalizeSelection([
    { abbrev: "Gn", chapters: [1, "2", 3.5, -4, 0, "x"] },
    { abbrev: "Ex", chapters: [] }, // vira undefined
  ]);
  assertEquals(s, [
    { abbrev: "Gn", chapters: [1, 2] },
    { abbrev: "Ex", chapters: undefined },
  ]);
});

// ─────────────── planMissing (idempotência do retry_of) ───────────────

const CANON: PlanCanonEntry[] = [
  { abbr: "Gn", name: "Gênesis", bollsId: 1, testament: "OT" },
  { abbr: "Ex", name: "Êxodo", bollsId: 2, testament: "OT" },
  { abbr: "Tb", name: "Tobias", bollsId: 17, deuterocanonical: true, testament: "OT" },
  { abbr: "Sl", name: "Salmos", bollsId: 19, testament: "OT" },
  { abbr: "Mt", name: "Mateus", bollsId: 40, testament: "NT" },
];

const BOLLS = new Map<number, { chapters: number }>([
  [1, { chapters: 50 }],
  [2, { chapters: 40 }],
  [17, { chapters: 14 }],
  [19, { chapters: 150 }],
  [40, { chapters: 28 }],
]);

const SKIP = new Set(["Sl"]); // catch: Sl é gerenciado pelo import-deutero

Deno.test("retry_of: plano vazio quando todos os capítulos já existem (idempotência)", () => {
  const existing = new Map<string, Set<number>>([
    ["Gn", new Set(Array.from({ length: 50 }, (_, i) => i + 1))],
    ["Ex", new Set(Array.from({ length: 40 }, (_, i) => i + 1))],
    ["Mt", new Set(Array.from({ length: 28 }, (_, i) => i + 1))],
  ]);

  const plan = planMissing({
    canon: CANON, bollsBooks: BOLLS,
    existingChaptersByAbbrev: existing, skipAbbrs: SKIP,
  });
  assertEquals(plan.length, 0, "reexecutar sobre dados completos não deve reprocessar nada");
});

Deno.test("retry_of: computa apenas capítulos ausentes (não duplica os presentes)", () => {
  const existing = new Map<string, Set<number>>([
    ["Gn", new Set([1, 2, 3, 4, 5])], // 6..50 faltam
    ["Ex", new Set(Array.from({ length: 40 }, (_, i) => i + 1))], // completo
    ["Mt", new Set()], // vazio
  ]);

  const plan = planMissing({
    canon: CANON, bollsBooks: BOLLS,
    existingChaptersByAbbrev: existing, skipAbbrs: SKIP,
  });

  const gn = plan.find((p) => p.canon.abbr === "Gn");
  const ex = plan.find((p) => p.canon.abbr === "Ex");
  const mt = plan.find((p) => p.canon.abbr === "Mt");

  assert(gn, "Gn deve estar no plano");
  assertEquals(gn!.chapters.length, 45);
  assertEquals(gn!.chapters[0], 6);
  assertEquals(gn!.chapters.at(-1), 50);
  for (const c of [1, 2, 3, 4, 5]) {
    assert(!gn!.chapters.includes(c), `cap ${c} de Gn já existia — não pode reaparecer`);
  }

  assertEquals(ex, undefined, "Ex completo não deve entrar no plano");

  assert(mt, "Mt vazio deve entrar no plano");
  assertEquals(mt!.chapters.length, 28);
});

Deno.test("retry_of: livros deuterocanônicos e SKIP_ABBRS são ignorados", () => {
  const empty = new Map<string, Set<number>>();
  const plan = planMissing({
    canon: CANON, bollsBooks: BOLLS,
    existingChaptersByAbbrev: empty, skipAbbrs: SKIP,
  });
  const abbrs = plan.map((p) => p.canon.abbr);
  assert(!abbrs.includes("Tb"), "Tb (deuterocanônico) não deve ser importado por este job");
  assert(!abbrs.includes("Sl"), "Sl (skip) não deve ser importado por este job");
  assertEquals(abbrs.sort(), ["Ex", "Gn", "Mt"]);
});

// ─────────────── seleção manual não duplica ───────────────

Deno.test("start com seleção: filtra plano aos livros escolhidos e ignora capítulos já presentes", () => {
  const existing = new Map<string, Set<number>>([
    ["Gn", new Set([1, 2])], // faltam 3..50
    ["Mt", new Set()],
  ]);
  const selection = normalizeSelection([
    { abbrev: "Gn", chapters: [1, 2, 3, 4] }, // 1,2 já existem → só 3,4
    { abbrev: "Ex" }, // livro inteiro — mas Ex completo abaixo
  ]);

  const withEx = new Map(existing);
  withEx.set("Ex", new Set(Array.from({ length: 40 }, (_, i) => i + 1)));

  const plan = planMissing({
    canon: CANON, bollsBooks: BOLLS,
    existingChaptersByAbbrev: withEx, skipAbbrs: SKIP,
    selection,
  });

  // Mt não foi selecionado — não pode aparecer
  assert(!plan.find((p) => p.canon.abbr === "Mt"), "Mt fora da seleção não deve aparecer");
  // Ex já completo → fora do plano
  assert(!plan.find((p) => p.canon.abbr === "Ex"), "Ex completo (seleção livro-inteiro) não deve aparecer");
  // Gn só com 3,4 pendentes
  const gn = plan.find((p) => p.canon.abbr === "Gn");
  assert(gn);
  assertEquals(gn!.chapters, [3, 4], "seleção deve ser interseção entre pedido e faltantes");
});
