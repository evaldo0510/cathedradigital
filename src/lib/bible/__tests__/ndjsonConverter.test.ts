/**
 * Testes do conversor NDJSON canônico.
 * Garante: canonicalização correta (Cathedra), validação estrita, contagens
 * por livro/capítulo/versículo, rejeição de linhas inválidas e detecção
 * de livros do canon ausentes.
 */
import { describe, it, expect } from "vitest";
import {
  resolveAbbr,
  convertText,
  previewDump,
  detectFormat,
  toCanonicalNDJSON,
  rejectedToNDJSON,
} from "@/lib/bible/ndjsonConverter";
import { BIBLE_CANON } from "@/lib/bibleCanon";

describe("ndjsonConverter — resolveAbbr (canonicalização)", () => {
  it("resolve abreviações canônicas em si mesmas", () => {
    expect(resolveAbbr("Gn")).toBe("Gn");
    expect(resolveAbbr("Ap")).toBe("Ap");
  });

  it("resolve nomes completos PT (acentuados e não acentuados)", () => {
    expect(resolveAbbr("Gênesis")).toBe("Gn");
    expect(resolveAbbr("genesis")).toBe("Gn");
    expect(resolveAbbr("Êxodo")).toBe("Ex");
    expect(resolveAbbr("Apocalipse")).toBe("Ap");
  });

  it("resolve nomes em inglês e USFM IDs", () => {
    expect(resolveAbbr("Genesis")).toBe("Gn");
    expect(resolveAbbr("Matthew")).toBe("Mt");
    expect(resolveAbbr("PSA")).toBe("Sl");
    expect(resolveAbbr("REV")).toBe("Ap");
  });

  it("resolve variantes católicas/deuterocanônicas", () => {
    expect(resolveAbbr("Tobias")).toBe("Tb");
    expect(resolveAbbr("Sirach")).toBe("Eclo");
    expect(resolveAbbr("Sabedoria")).toBe("Sb");
    expect(resolveAbbr("1Macabeus")).toBe("1Mc");
    expect(resolveAbbr("2 Macabeus")).toBe("2Mc");
  });

  it("aceita variações com espaços e pontuação", () => {
    expect(resolveAbbr(" 1 Cor ")).toBe("1Co");
    expect(resolveAbbr("1.cor")).toBe("1Co");
    expect(resolveAbbr("1pedro")).toBe("1Pd");
  });

  it("retorna null para entrada inválida", () => {
    expect(resolveAbbr("XYZ")).toBeNull();
    expect(resolveAbbr("")).toBeNull();
    expect(resolveAbbr(null)).toBeNull();
  });

  it("cobre todos os 73 livros do canon Cathedra", () => {
    expect(BIBLE_CANON.length).toBe(73);
    for (const book of BIBLE_CANON) {
      expect(resolveAbbr(book.abbr), `abbr ${book.abbr}`).toBe(book.abbr);
      expect(resolveAbbr(book.name), `name ${book.name}`).toBe(book.abbr);
    }
  });
});

describe("ndjsonConverter — detectFormat", () => {
  it("detecta extensões corretamente", () => {
    expect(detectFormat("dump.ndjson")).toBe("ndjson");
    expect(detectFormat("dump.jsonl")).toBe("ndjson");
    expect(detectFormat("dump.json")).toBe("json");
    expect(detectFormat("dump.csv")).toBe("csv");
    expect(detectFormat("dump.tsv")).toBe("tsv");
    expect(detectFormat("desconhecido.dat")).toBe("csv"); // fallback
  });
});

describe("ndjsonConverter — convertText (NDJSON)", () => {
  it("converte linhas válidas e rejeita inválidas", () => {
    const ndjson = [
      JSON.stringify({ abbr: "Gn", chapter: 1, verse: 1, text: "No princípio..." }),
      JSON.stringify({ book: "Êxodo", chapter: 3, verse: 14, text: "EU SOU" }),
      JSON.stringify({ abbr: "XYZ", chapter: 1, verse: 1, text: "lixo" }),
      JSON.stringify({ abbr: "Gn", chapter: 1, verse: 0, text: "v=0" }),
      "linha não-JSON",
      "",
    ].join("\n");

    const { verses, rejected } = convertText(ndjson, "ndjson");
    expect(verses).toHaveLength(2);
    expect(verses[0]).toEqual({ abbr: "Gn", chapter: 1, verse: 1, text: "No princípio..." });
    expect(verses[1]).toEqual({ abbr: "Ex", chapter: 3, verse: 14, text: "EU SOU" });
    expect(rejected).toHaveLength(3);
    expect(rejected[0].reason).toMatch(/desconhecida/);
    expect(rejected[1].reason).toMatch(/versículo inválido/);
    expect(rejected[2].reason).toMatch(/JSON inválido/);
  });

  it("trims texto e rejeita texto vazio", () => {
    const { verses, rejected } = convertText(
      JSON.stringify({ abbr: "Gn", chapter: 1, verse: 1, text: "   " }),
      "ndjson",
    );
    expect(verses).toHaveLength(0);
    expect(rejected[0].reason).toMatch(/vazio/);
  });
});

describe("ndjsonConverter — convertText (JSON / CSV)", () => {
  it("aceita JSON array no topo", () => {
    const json = JSON.stringify([
      { livro: "Mateus", capitulo: 1, versiculo: 1, texto: "Genealogia" },
      { livro: "Mc", cap: 1, v: 1, texto: "Princípio do evangelho" },
    ]);
    const { verses } = convertText(json, "json");
    expect(verses).toHaveLength(2);
    expect(verses[0].abbr).toBe("Mt");
    expect(verses[1].abbr).toBe("Mc");
  });

  it("rejeita JSON que não é array", () => {
    const { verses, rejected } = convertText('{"foo":"bar"}', "json");
    expect(verses).toHaveLength(0);
    expect(rejected[0].reason).toMatch(/array/);
  });

  it("processa CSV com header", () => {
    const csv = [
      "book,chapter,verse,text",
      "Gn,1,1,No princípio",
      '"Ex",3,14,"EU SOU, ele disse"',
    ].join("\n");
    const { verses, rejected } = convertText(csv, "csv");
    expect(rejected).toHaveLength(0);
    expect(verses).toHaveLength(2);
    expect(verses[1].text).toBe("EU SOU, ele disse");
  });
});

describe("ndjsonConverter — previewDump (cobertura)", () => {
  it("conta livros/capítulos/versículos únicos", () => {
    const ndjson = [
      { abbr: "Gn", chapter: 1, verse: 1, text: "a" },
      { abbr: "Gn", chapter: 1, verse: 2, text: "b" },
      { abbr: "Gn", chapter: 2, verse: 1, text: "c" },
      { abbr: "Mt", chapter: 1, verse: 1, text: "d" },
    ].map((r) => JSON.stringify(r)).join("\n");

    const p = previewDump(ndjson, "x.ndjson");
    expect(p.format).toBe("ndjson");
    expect(p.validVerses).toBe(4);
    expect(p.rejectedCount).toBe(0);
    expect(p.uniqueBooks).toBe(2);
    expect(p.uniqueChapters).toBe(3);
    expect(p.byBook.find((b) => b.abbr === "Gn")).toMatchObject({ chapters: 2, verses: 3 });
    expect(p.missingCanonBooks.length).toBe(71);
  });

  it("emite warning quando >10% rejeitado", () => {
    const ndjson = [
      JSON.stringify({ abbr: "Gn", chapter: 1, verse: 1, text: "ok" }),
      "lixo1", "lixo2", "lixo3",
    ].join("\n");
    const p = previewDump(ndjson, "x.ndjson");
    expect(p.warnings.some((w) => /10%/.test(w))).toBe(true);
  });

  it("lista os 73 livros canônicos como ausentes em dump vazio", () => {
    const p = previewDump("", "vazio.ndjson");
    expect(p.validVerses).toBe(0);
    expect(p.missingCanonBooks).toHaveLength(73);
  });
});

describe("ndjsonConverter — serializadores", () => {
  it("toCanonicalNDJSON produz uma linha por versículo", () => {
    const out = toCanonicalNDJSON([
      { abbr: "Gn", chapter: 1, verse: 1, text: "a" },
      { abbr: "Gn", chapter: 1, verse: 2, text: "b" },
    ]);
    expect(out.split("\n").filter(Boolean)).toHaveLength(2);
    expect(JSON.parse(out.split("\n")[0])).toEqual({ abbr: "Gn", chapter: 1, verse: 1, text: "a" });
  });

  it("rejectedToNDJSON inclui razão e raw", () => {
    const out = rejectedToNDJSON([
      { lineNumber: 5, reason: "abreviação desconhecida", raw: "xxx" },
    ]);
    const parsed = JSON.parse(out.trim());
    expect(parsed.lineNumber).toBe(5);
    expect(parsed.reason).toMatch(/desconhecida/);
  });
});
