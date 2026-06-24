import { assertEquals, assertExists } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { BIBLE_CANON, BOLLS_MAP, findBookByAbbr, bookNameFromAbbr } from "./bibleCanon.ts";

/**
 * Garante resolução case-insensitive para TODAS as abreviações canônicas:
 * original ("1Tm"), lowercase ("1tm"), uppercase ("1TM") e mixed ("1tM").
 */
Deno.test("bibleCanon: findBookByAbbr resolve case-insensitive todas as abreviações", () => {
  for (const book of BIBLE_CANON) {
    const variants = [
      book.abbr,
      book.abbr.toLowerCase(),
      book.abbr.toUpperCase(),
      book.abbr.charAt(0).toLowerCase() + book.abbr.slice(1),
    ];
    for (const v of variants) {
      const found = findBookByAbbr(v);
      assertExists(found, `findBookByAbbr("${v}") deveria resolver para ${book.abbr}`);
      assertEquals(found!.bollsId, book.bollsId, `bollsId divergente para "${v}"`);
    }
  }
});

Deno.test("bibleCanon: BOLLS_MAP devolve bollsId para variações de caixa", () => {
  const samples: Array<[string, number]> = [
    ["1Tm", 54],
    ["1tm", 54],
    ["1TM", 54],
    ["1tM", 54],
    ["Mt", 40],
    ["mt", 40],
    ["Sl", 19],
    ["SL", 19],
    ["2Mc", 73],
    ["2mc", 73],
  ];
  for (const [k, expected] of samples) {
    assertEquals(BOLLS_MAP[k], expected, `BOLLS_MAP["${k}"] esperado ${expected}`);
  }
});

Deno.test("bibleCanon: aliases legados ainda resolvem", () => {
  assertEquals(findBookByAbbr("Job")?.abbr, "Jó");
  assertEquals(findBookByAbbr("job")?.abbr, "Jó");
  assertEquals(findBookByAbbr("Mal")?.abbr, "Ml");
  assertEquals(findBookByAbbr("mal")?.abbr, "Ml");
});

Deno.test("bibleCanon: bookNameFromAbbr é tolerante a caixa", () => {
  assertEquals(bookNameFromAbbr("1tm"), "1 Timóteo");
  assertEquals(bookNameFromAbbr("1TM"), "1 Timóteo");
  assertEquals(bookNameFromAbbr("mt"), "Mateus");
});

Deno.test("bibleCanon: abreviação desconhecida retorna undefined sem lançar", () => {
  assertEquals(findBookByAbbr(""), undefined);
  assertEquals(findBookByAbbr("xyz"), undefined);
  assertEquals(BOLLS_MAP["xyz"], undefined);
});
