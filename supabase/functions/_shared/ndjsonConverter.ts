/**
 * Mirror Deno do conversor canônico (src/lib/bible/ndjsonConverter.ts).
 * Não importa o módulo TS do frontend para evitar resolução de alias `@/`.
 * Mantenha esta lista de aliases em sincronia com o frontend — coberta
 * pelos testes Vitest em src/lib/bible/__tests__/ndjsonConverter.test.ts.
 */
import { BIBLE_CANON, normalizeAbbr } from "./bibleCanon.ts";

export type DumpFormat = "ndjson" | "json" | "csv" | "tsv";

export interface CanonicalVerse {
  abbr: string;
  chapter: number;
  verse: number;
  text: string;
}

export interface RejectedLine {
  lineNumber: number;
  reason: string;
  raw: unknown;
}

const EXTRA_ALIASES: Record<string, string> = {
  gen: "Gn", genesis: "Gn", "gênesis": "Gn", genese: "Gn",
  exo: "Ex", exodo: "Ex", "êxodo": "Ex", exodus: "Ex",
  lev: "Lv", levitico: "Lv", "levítico": "Lv", leviticus: "Lv",
  num: "Nm", numeros: "Nm", "números": "Nm", numbers: "Nm",
  deu: "Dt", deuteronomio: "Dt", "deuteronômio": "Dt", deuteronomy: "Dt",
  jos: "Js", josue: "Js", "josué": "Js", joshua: "Js",
  jdg: "Jz", jui: "Jz", juizes: "Jz", "juízes": "Jz", judges: "Jz",
  rut: "Rt", rute: "Rt", ruth: "Rt",
  "1sa": "1Sm", "1samuel": "1Sm", "1 samuel": "1Sm", "1sam": "1Sm",
  "2sa": "2Sm", "2samuel": "2Sm", "2 samuel": "2Sm", "2sam": "2Sm",
  "1ki": "1Rs", "1reis": "1Rs", "1 reis": "1Rs", "1kings": "1Rs",
  "2ki": "2Rs", "2reis": "2Rs", "2 reis": "2Rs", "2kings": "2Rs",
  "1ch": "1Cr", "1cronicas": "1Cr", "1crônicas": "1Cr", "1chronicles": "1Cr",
  "2ch": "2Cr", "2cronicas": "2Cr", "2crônicas": "2Cr", "2chronicles": "2Cr",
  esd: "Ed", esdras: "Ed", ezr: "Ed", ezra: "Ed",
  neh: "Ne", neemias: "Ne", nehemiah: "Ne",
  tob: "Tb", tobias: "Tb", tobit: "Tb",
  jdt: "Jdt", judite: "Jdt", judith: "Jdt",
  est: "Et", ester: "Et", esther: "Et",
  "1ma": "1Mc", "1macabeus": "1Mc", "1maccabees": "1Mc",
  "2ma": "2Mc", "2macabeus": "2Mc", "2maccabees": "2Mc",
  job: "Jó",
  psa: "Sl", salmos: "Sl", psalms: "Sl", ps: "Sl",
  prv: "Pv", pro: "Pv", pr: "Pv", proverbios: "Pv", "provérbios": "Pv", proverbs: "Pv",
  ecl: "Ec", eclesiastes: "Ec", ecclesiastes: "Ec", qoh: "Ec",
  sng: "Ct", cantares: "Ct", canticos: "Ct", "cânticos": "Ct", songofsongs: "Ct",
  wis: "Sb", sabedoria: "Sb", wisdom: "Sb",
  sir: "Eclo", eclesiastico: "Eclo", "eclesiástico": "Eclo", sirach: "Eclo", "ben sira": "Eclo",
  isa: "Is", isaias: "Is", "isaías": "Is", isaiah: "Is",
  jer: "Jr", jeremias: "Jr", jeremiah: "Jr",
  lam: "Lm", lamentacoes: "Lm", "lamentações": "Lm", lamentations: "Lm",
  bar: "Br", baruc: "Br", baruch: "Br",
  ezk: "Ez", ezequiel: "Ez", ezekiel: "Ez",
  dan: "Dn", daniel: "Dn",
  hos: "Os", oseias: "Os", "oséias": "Os", hosea: "Os",
  jol: "Jl", joel: "Jl",
  amo: "Am", amos: "Am", "amós": "Am",
  oba: "Ab", abdias: "Ab", obadiah: "Ab",
  jon: "Jn", jonas: "Jn", jonah: "Jn",
  mic: "Mq", miqueias: "Mq", "miquéias": "Mq", micah: "Mq",
  nam: "Na", naum: "Na", nahum: "Na",
  hab: "Hc", habacuc: "Hc", habakkuk: "Hc",
  zep: "Sf", sofonias: "Sf", zephaniah: "Sf",
  hag: "Ag", ageu: "Ag", haggai: "Ag",
  zec: "Zc", zacarias: "Zc", zechariah: "Zc",
  mal: "Ml", malaquias: "Ml", malachi: "Ml",
  mat: "Mt", mateus: "Mt", matthew: "Mt",
  mrk: "Mc", marcos: "Mc", mark: "Mc",
  luk: "Lc", lucas: "Lc", luke: "Lc",
  jhn: "Jo", joao: "Jo", "joão": "Jo", john: "Jo",
  act: "At", atos: "At", acts: "At",
  rom: "Rm", romanos: "Rm", romans: "Rm",
  "1co": "1Co", "1corintios": "1Co", "1coríntios": "1Co", "1 cor": "1Co", "1corinthians": "1Co",
  "2co": "2Co", "2corintios": "2Co", "2coríntios": "2Co", "2 cor": "2Co", "2corinthians": "2Co",
  gal: "Gl", galatas: "Gl", "gálatas": "Gl", galatians: "Gl",
  eph: "Ef", efesios: "Ef", "efésios": "Ef", ephesians: "Ef",
  php: "Fp", filipenses: "Fp", philippians: "Fp",
  col: "Cl", colossenses: "Cl", colossians: "Cl",
  "1th": "1Ts", "1tessalonicenses": "1Ts", "1thessalonians": "1Ts",
  "2th": "2Ts", "2tessalonicenses": "2Ts", "2thessalonians": "2Ts",
  "1ti": "1Tm", "1timoteo": "1Tm", "1timóteo": "1Tm", "1timothy": "1Tm",
  "2ti": "2Tm", "2timoteo": "2Tm", "2timóteo": "2Tm", "2timothy": "2Tm",
  tit: "Tt", tito: "Tt", titus: "Tt",
  phm: "Fm", filemon: "Fm", philemon: "Fm",
  heb: "Hb", hebreus: "Hb", hebrews: "Hb", hbr: "Hb",
  jas: "Tg", tiago: "Tg", james: "Tg",
  "1pe": "1Pe", "1pedro": "1Pe", "1peter": "1Pe",
  "2pe": "2Pe", "2pedro": "2Pe", "2peter": "2Pe",
  "1jn": "1Jo", "1joao": "1Jo", "1joão": "1Jo", "1john": "1Jo",
  "2jn": "2Jo", "2joao": "2Jo", "2joão": "2Jo", "2john": "2Jo",
  "3jn": "3Jo", "3joao": "3Jo", "3joão": "3Jo", "3john": "3Jo",
  jud: "Jd", judas: "Jd", jude: "Jd",
  rev: "Ap", apocalipse: "Ap", revelation: "Ap",
};

const ALIAS_TO_ABBR: Record<string, string> = (() => {
  const map: Record<string, string> = {};
  for (const b of BIBLE_CANON) {
    map[b.abbr.toLowerCase()] = b.abbr;
    map[b.name.toLowerCase()] = b.abbr;
    map[b.name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")] = b.abbr;
  }
  for (const [k, v] of Object.entries(EXTRA_ALIASES)) map[k] = v;
  return map;
})();

const CANON_ABBRS = new Set(BIBLE_CANON.map((b) => b.abbr));

export function resolveAbbr(raw: unknown): string | null {
  if (raw == null) return null;
  const s = String(raw).trim().toLowerCase().replace(/\s+/g, " ");
  if (!s) return null;
  if (ALIAS_TO_ABBR[s]) return ALIAS_TO_ABBR[s];
  const compact = s.replace(/[.\s]/g, "");
  if (ALIAS_TO_ABBR[compact]) return ALIAS_TO_ABBR[compact];
  const fromCanon = normalizeAbbr(String(raw));
  return fromCanon && CANON_ABBRS.has(fromCanon) ? fromCanon : null;
}

export function detectFormat(filename: string): DumpFormat {
  const ext = filename.toLowerCase().split(".").pop() ?? "";
  if (ext === "jsonl" || ext === "ndjson") return "ndjson";
  if (ext === "json") return "json";
  if (ext === "tsv") return "tsv";
  return "csv";
}

function parseCsvLine(line: string, sep: string): string[] {
  const out: string[] = [];
  let cur = ""; let q = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (q) {
      if (c === '"' && line[i + 1] === '"') { cur += '"'; i++; }
      else if (c === '"') q = false;
      else cur += c;
    } else {
      if (c === '"') q = true;
      else if (c === sep) { out.push(cur); cur = ""; }
      else cur += c;
    }
  }
  out.push(cur);
  return out;
}

function validate(rec: Record<string, unknown>): CanonicalVerse | string {
  const abbr = resolveAbbr(rec.abbr ?? rec.book ?? rec.livro);
  if (!abbr) return `abreviação desconhecida ("${String(rec.abbr ?? rec.book ?? rec.livro ?? "")}")`;
  const chapter = Number(rec.chapter ?? rec.cap ?? rec.capitulo);
  if (!Number.isInteger(chapter) || chapter < 1) return `capítulo inválido`;
  const verse = Number(rec.verse ?? rec.v ?? rec.versiculo ?? rec.versículo);
  if (!Number.isInteger(verse) || verse < 1) return `versículo inválido`;
  const text = String(rec.text ?? rec.texto ?? "").trim();
  if (!text) return `texto vazio`;
  return { abbr, chapter, verse, text };
}

/** Converte texto bruto para versos canônicos + lista de rejeitados. */
export function convertText(content: string, format: DumpFormat): { verses: CanonicalVerse[]; rejected: RejectedLine[] } {
  const verses: CanonicalVerse[] = [];
  const rejected: RejectedLine[] = [];

  const push = (rec: Record<string, unknown>, lineNo: number, raw: unknown) => {
    const r = validate(rec);
    if (typeof r === "string") rejected.push({ lineNumber: lineNo, reason: r, raw });
    else verses.push(r);
  };

  if (format === "json") {
    try {
      const arr = JSON.parse(content);
      if (!Array.isArray(arr)) {
        rejected.push({ lineNumber: 0, reason: "JSON precisa ser array", raw: null });
        return { verses, rejected };
      }
      arr.forEach((rec, i) => {
        if (typeof rec !== "object" || rec === null) rejected.push({ lineNumber: i + 1, reason: "elemento não é objeto", raw: rec });
        else push(rec as Record<string, unknown>, i + 1, rec);
      });
    } catch (e) {
      rejected.push({ lineNumber: 0, reason: `JSON inválido: ${(e as Error).message}`, raw: null });
    }
    return { verses, rejected };
  }

  if (format === "ndjson") {
    const lines = content.split(/\r?\n/);
    lines.forEach((line, i) => {
      const t = line.trim(); if (!t) return;
      try { push(JSON.parse(t) as Record<string, unknown>, i + 1, t); }
      catch (e) { rejected.push({ lineNumber: i + 1, reason: `JSON inválido: ${(e as Error).message}`, raw: t }); }
    });
    return { verses, rejected };
  }

  const sep = format === "tsv" ? "\t" : ",";
  const lines = content.split(/\r?\n/);
  let header: string[] | null = null;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (!line.trim()) continue;
    const cells = parseCsvLine(line, sep);
    if (!header) { header = cells.map((c) => c.toLowerCase().trim()); continue; }
    const rec: Record<string, unknown> = {};
    for (let j = 0; j < header.length; j++) rec[header[j]] = cells[j];
    push(rec, i + 1, line);
  }
  return { verses, rejected };
}

export function toCanonicalNDJSON(verses: CanonicalVerse[]): string {
  return verses.map((v) => JSON.stringify(v)).join("\n") + (verses.length ? "\n" : "");
}

export function rejectedToNDJSON(rejected: RejectedLine[]): string {
  return rejected.map((r) => JSON.stringify(r)).join("\n") + (rejected.length ? "\n" : "");
}
