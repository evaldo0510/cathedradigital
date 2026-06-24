import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import {
  BibleTextSuccessSchema,
  BibleTextErrorSchema,
  classifyError,
} from "./bibleTextSchema.ts";

Deno.test("BibleTextSuccessSchema aceita resposta canônica e exige received_abbrev/canonical_abbr/bollsId/chapter", () => {
  const ok = BibleTextSuccessSchema.parse({
    book: "1 Timóteo",
    chapter: 3,
    verses: [{ number: 1, text: "Fiel é a palavra...", comment: null }],
    metadata: {
      source: "L2 Cache",
      correlationId: "test",
      received_abbrev: "1tm",
      canonical_abbr: "1Tm",
      bollsId: 54,
    },
  });
  assertEquals(ok.metadata.received_abbrev, "1tm");
  assertEquals(ok.metadata.canonical_abbr, "1Tm");
  assertEquals(ok.metadata.bollsId, 54);
  assertEquals(ok.chapter, 3);
});

Deno.test("BibleTextSuccessSchema rejeita metadata sem received_abbrev", () => {
  const result = BibleTextSuccessSchema.safeParse({
    book: "Mateus",
    chapter: 1,
    verses: [{ number: 1, text: "..." }],
    metadata: { source: "L2 Cache", correlationId: "x", canonical_abbr: "Mt", bollsId: 40 },
  });
  assertEquals(result.success, false);
});

Deno.test("BibleTextErrorSchema valida 404 descritivo com todos os campos", () => {
  const err = BibleTextErrorSchema.parse({
    error: "Texto não encontrado",
    reason: 'Abreviação não reconhecida: "xx". Verifique BIBLE_CANON em supabase/functions/_shared/bibleCanon.ts.',
    received_abbrev: "xx",
    canonical_abbr: null,
    book_name: null,
    bollsId: null,
    chapter: 1,
    correlationId: "c",
  });
  assertEquals(err.canonical_abbr, null);
  assertEquals(err.bollsId, null);
});

Deno.test("classifyError separa unknown_abbrev vs chapter_unavailable", () => {
  assertEquals(classifyError('Abreviação não reconhecida: "xx".'), "unknown_abbrev");
  assertEquals(classifyError('Capítulo 999 de "Mateus" (bollsId=40) não foi encontrado em nenhuma fonte'), "chapter_unavailable");
  assertEquals(classifyError("Parâmetros inválidos: informe ..."), "invalid_payload");
  assertEquals(classifyError(undefined), "other");
});
