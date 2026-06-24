import { assertEquals, assertExists } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { BIBLE_CANON, BOLLS_MAP, findBookByAbbr, bookNameFromAbbr, normalizeAbbr } from "./bibleCanon.ts";

Deno.test("bibleCanon: normalizeAbbr tolera espaços/pontuação e devolve forma canônica", () => {
  const cases: Array<[string, string, number]> = [
    ["2 Cr", "2Cr", 14],
    ["2.Cr", "2Cr", 14],
    ["2-cr", "2Cr", 14],
    ["1 tm", "1Tm", 54],
    ["1 TM", "1Tm", 54],
    ["1.tm", "1Tm", 54],
    ["1 Rs", "1Rs", 11],
    ["2 sm", "2Sm", 10],
    ["2 mc", "2Mc", 73],
    ["1Tm", "1Tm", 54],
    ["Mt", "Mt", 40],
  ];
  for (const [input, expectedAbbr, expectedId] of cases) {
    assertEquals(normalizeAbbr(input), expectedAbbr, `normalizeAbbr("${input}")`);
    const book = findBookByAbbr(input);
    assertExists(book, `findBookByAbbr("${input}") deveria resolver`);
    assertEquals(book!.bollsId, expectedId, `bollsId divergente para "${input}"`);
  }
});

Deno.test("bibleCanon: normalizeAbbr de entrada desconhecida não lança e retorna trim", () => {
  assertEquals(normalizeAbbr("xyz"), "xyz");
  assertEquals(normalizeAbbr("  zzz  "), "zzz");
  assertEquals(normalizeAbbr(""), "");
  // só pontuação/whitespace: trim mantém os caracteres, mas não resolve
  assertEquals(findBookByAbbr("..."), undefined);
  assertEquals(findBookByAbbr("---"), undefined);
  assertEquals(findBookByAbbr("   "), undefined);
  assertEquals(findBookByAbbr("123"), undefined);
});

Deno.test("bibleCanon: normalizeAbbr cobre variantes amplas (espaços, caixa, pontuação)", () => {
  const cases: Array<[string, string, number]> = [
    // espaços extras / tabs / newlines
    ["  2  Cr  ", "2Cr", 14],
    ["\t1\tTm\n", "1Tm", 54],
    // pontuação variada
    ["1_co", "1Co", 46],
    ["2,Mc", "2Mc", 73],
    ["1·rs", "1Rs", 11],
    // caixa mista
    ["2cR", "2Cr", 14],
    ["mT", "Mt", 40],
    ["SL", "Sl", 19],
    // aliases legados normalizados
    ["job", "Jó", 18],
    ["MAL", "Ml", 39],
    ["jon", "Jn", 32],
  ];
  for (const [input, expectedAbbr, expectedId] of cases) {
    assertEquals(normalizeAbbr(input), expectedAbbr, `normalizeAbbr("${input}")`);
    assertEquals(findBookByAbbr(input)?.bollsId, expectedId, `bollsId para "${input}"`);
  }
});

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
