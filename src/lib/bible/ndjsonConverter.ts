/**
 * Conversor + validador de dumps bíblicos para NDJSON canônico Cathedra.
 *
 * Saída canônica: { "abbr": "Gn", "chapter": 1, "verse": 1, "text": "..." }
 *
 * Usado por:
 *   - /admin/bible-import → preview client-side antes do upload.
 *   - testes unitários em src/lib/bible/__tests__/ndjsonConverter.test.ts
 *   - mirror Deno: supabase/functions/_shared/ndjsonConverter.ts
 *
 * Formatos detectados pela extensão:
 *   .ndjson | .jsonl  → 1 objeto JSON por linha
 *   .json             → array de objetos
 *   .csv | .tsv       → header obrigatório: book|abbr, chapter, verse, text
 *
 * Aliases derivam do canon oficial em src/lib/bibleCanon.ts; mapa adicional
 * cobre variantes católicas, inglês e USFM IDs comuns.
 */

import { BIBLE_CANON, normalizeAbbr } from "@/lib/bibleCanon";

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

export interface ConversionResult {
  verses: CanonicalVerse[];
  rejected: RejectedLine[];
}

export interface DumpPreview {
  format: DumpFormat;
  totalLines: number;
  validVerses: number;
  rejectedCount: number;
  uniqueBooks: number;
  uniqueChapters: number;
  byBook: Array<{ abbr: string; chapters: number; verses: number; missingFromCanon?: boolean }>;
  missingCanonBooks: string[]; // abbr esperados pelo canon e ausentes no dump
  rejected: RejectedLine[]; // todas as rejeições — caller decide se trunca
  warnings: string[];
}

// ---------------------- Alias map ----------------------
// Construído a partir do BIBLE_CANON (fonte de verdade) + variantes comuns.
const EXTRA_ALIASES: Record<string, string> = {
  // Pentateuco
  gen: "Gn", genesis: "Gn", "gênesis": "Gn", genese: "Gn",
  exo: "Ex", exodo: "Ex", "êxodo": "Ex", exodus: "Ex",
  lev: "Lv", levitico: "Lv", "levítico": "Lv", leviticus: "Lv",
  num: "Nm", numeros: "Nm", "números": "Nm", numbers: "Nm",
  deu: "Dt", deuteronomio: "Dt", "deuteronômio": "Dt", deuteronomy: "Dt",
  // Históricos
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
  jdt: "Jt", judite: "Jt", judith: "Jt",
  est: "Et", ester: "Et", esther: "Et",
  "1ma": "1Mc", "1macabeus": "1Mc", "1maccabees": "1Mc",
  "2ma": "2Mc", "2macabeus": "2Mc", "2maccabees": "2Mc",
  // Sapienciais
  job: "Jó",
  psa: "Sl", salmos: "Sl", psalms: "Sl", ps: "Sl",
  prv: "Pv", pro: "Pv", pr: "Pv", proverbios: "Pv", "provérbios": "Pv", proverbs: "Pv",
  ecl: "Ec", eclesiastes: "Ec", ecclesiastes: "Ec", qoh: "Ec",
  sng: "Ct", cantares: "Ct", canticos: "Ct", "cânticos": "Ct", songofsongs: "Ct",
  wis: "Sb", sabedoria: "Sb", wisdom: "Sb",
  sir: "Eclo", eclesiastico: "Eclo", "eclesiástico": "Eclo", sirach: "Eclo", "ben sira": "Eclo",
  // Proféticos
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
  hab: "Hab", habacuc: "Hab", habakkuk: "Hab",
  zep: "Sf", sofonias: "Sf", zephaniah: "Sf",
  hag: "Ag", ageu: "Ag", haggai: "Ag",
  zec: "Zc", zacarias: "Zc", zechariah: "Zc",
  mal: "Ml", malaquias: "Ml", malachi: "Ml",
  // NT
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
  php: "Fl", filipenses: "Fl", philippians: "Fl",
  col: "Cl", colossenses: "Cl", colossians: "Cl",
  "1th": "1Ts", "1tessalonicenses": "1Ts", "1thessalonians": "1Ts",
  "2th": "2Ts", "2tessalonicenses": "2Ts", "2thessalonians": "2Ts",
  "1ti": "1Tm", "1timoteo": "1Tm", "1timóteo": "1Tm", "1timothy": "1Tm",
  "2ti": "2Tm", "2timoteo": "2Tm", "2timóteo": "2Tm", "2timothy": "2Tm",
  tit: "Tt", tito: "Tt", titus: "Tt",
  phm: "Fm", filemon: "Fm", philemon: "Fm",
  heb: "Hb", hebreus: "Hb", hebrews: "Hb", hbr: "Hb",
  jas: "Tg", tiago: "Tg", james: "Tg",
  "1pe": "1Pd", "1pedro": "1Pd", "1peter": "1Pd",
  "2pe": "2Pd", "2pedro": "2Pd", "2peter": "2Pd",
  "1jn": "1Jo", "1joao": "1Jo", "1joão": "1Jo", "1john": "1Jo",
  "2jn": "2Jo", "2joao": "2Jo", "2joão": "2Jo", "2john": "2Jo",
  "3jn": "3Jo", "3joao": "3Jo", "3joão": "3Jo", "3john": "3Jo",
  jud: "Jd", judas: "Jd", jude: "Jd",
  rev: "Ap", apocalipse: "Ap", revelation: "Ap",
};

const ALIAS_TO_ABBR: Record<string, string> = (() => {
  const map: Record<string, string> = {};
  // 1) self + lowercase canon abbrs + canon name
  for (const b of BIBLE_CANON) {
    map[b.abbr.toLowerCase()] = b.abbr;
    map[b.name.toLowerCase()] = b.abbr;
    map[b.name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")] = b.abbr;
  }
  // 2) extras explícitos (preservam ordem e podem sobrescrever para casos católicos)
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

// ---------------------- Parsers ----------------------
function parseCsvLine(line: string, sep: string): string[] {
  const out: string[] = [];
  let cur = "";
  let q = false;
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
  if (!Number.isInteger(chapter) || chapter < 1) return `capítulo inválido (${String(rec.chapter ?? rec.cap ?? rec.capitulo)})`;
  const verse = Number(rec.verse ?? rec.v ?? rec.versiculo ?? rec.versículo);
  if (!Number.isInteger(verse) || verse < 1) return `versículo inválido (${String(rec.verse ?? rec.v ?? rec.versiculo)})`;
  const text = String(rec.text ?? rec.texto ?? "").trim();
  if (!text) return `texto vazio`;
  return { abbr, chapter, verse, text };
}

export function convertText(content: string, format: DumpFormat): ConversionResult {
  const verses: CanonicalVerse[] = [];
  const rejected: RejectedLine[] = [];

  function push(rec: Record<string, unknown>, lineNo: number, raw: unknown) {
    const r = validate(rec);
    if (typeof r === "string") rejected.push({ lineNumber: lineNo, reason: r, raw });
    else verses.push(r);
  }

  if (format === "json") {
    let arr: unknown;
    try { arr = JSON.parse(content); }
    catch (e) {
      rejected.push({ lineNumber: 0, reason: `JSON inválido: ${(e as Error).message}`, raw: null });
      return { verses, rejected };
    }
    if (!Array.isArray(arr)) {
      rejected.push({ lineNumber: 0, reason: "JSON precisa ser um array no topo", raw: null });
      return { verses, rejected };
    }
    arr.forEach((rec, i) => {
      if (typeof rec !== "object" || rec === null) rejected.push({ lineNumber: i + 1, reason: "elemento não é objeto", raw: rec });
      else push(rec as Record<string, unknown>, i + 1, rec);
    });
    return { verses, rejected };
  }

  if (format === "ndjson") {
    const lines = content.split(/\r?\n/);
    lines.forEach((line, i) => {
      const t = line.trim();
      if (!t) return;
      try {
        const rec = JSON.parse(t) as Record<string, unknown>;
        push(rec, i + 1, t);
      } catch (e) {
        rejected.push({ lineNumber: i + 1, reason: `JSON inválido: ${(e as Error).message}`, raw: t });
      }
    });
    return { verses, rejected };
  }

  // CSV / TSV
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

export function previewDump(content: string, filename: string): DumpPreview {
  const format = detectFormat(filename);
  const totalLines = content.split(/\r?\n/).filter((l) => l.trim()).length;
  const { verses, rejected } = convertText(content, format);
  const warnings: string[] = [];

  const byBookMap = new Map<string, { chapters: Set<number>; verses: number }>();
  for (const v of verses) {
    const st = byBookMap.get(v.abbr) ?? { chapters: new Set<number>(), verses: 0 };
    st.chapters.add(v.chapter); st.verses += 1;
    byBookMap.set(v.abbr, st);
  }

  const seenAbbrs = new Set(byBookMap.keys());
  const missingCanonBooks: string[] = BIBLE_CANON
    .filter((b) => !seenAbbrs.has(b.abbr))
    .map((b) => b.abbr);

  if (verses.length === 0) warnings.push("Nenhum versículo válido encontrado — verifique formato/colunas.");
  if (rejected.length > totalLines * 0.1) warnings.push(`Mais de 10% das linhas foram rejeitadas (${rejected.length}/${totalLines}).`);
  if (missingCanonBooks.length > 0 && verses.length > 0) {
    warnings.push(`${missingCanonBooks.length} livro(s) do canon ausentes no dump.`);
  }

  const byBook = Array.from(byBookMap.entries())
    .map(([abbr, st]) => ({ abbr, chapters: st.chapters.size, verses: st.verses }))
    .sort((a, b) => a.abbr.localeCompare(b.abbr));

  const uniqueChapters = byBook.reduce((sum, b) => sum + b.chapters, 0);

  return {
    format,
    totalLines,
    validVerses: verses.length,
    rejectedCount: rejected.length,
    uniqueBooks: byBook.length,
    uniqueChapters,
    byBook,
    missingCanonBooks,
    rejected,
    warnings,
  };
}

/** Reconstrói o NDJSON canônico a partir do dump bruto (usado no preview/download). */
export function toCanonicalNDJSON(verses: CanonicalVerse[]): string {
  return verses.map((v) => JSON.stringify(v)).join("\n") + (verses.length ? "\n" : "");
}

/** Serializa rejeitados em NDJSON para download/auditoria. */
export function rejectedToNDJSON(rejected: RejectedLine[]): string {
  return rejected.map((r) => JSON.stringify(r)).join("\n") + (rejected.length ? "\n" : "");
}
