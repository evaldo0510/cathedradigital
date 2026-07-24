/**
 * Normaliza o texto oficial do Catecismo antes da renderização.
 *
 * Corrige artefatos comuns da extração HTML da Santa Sé:
 * - Caracteres invisíveis (BOM, zero-width, soft hyphen)
 * - NBSP e espaços múltiplos
 * - Quebras de linha inconsistentes (CRLF, LF único vs parágrafo)
 * - Espaçamento incorreto ao redor de pontuação
 * - Marcadores de lista colados (–, •, *, "1." glued)
 * - Notas de rodapé em sobrescrito coladas ao texto
 * - Aspas curvas quebradas / travessões inconsistentes
 */

const INVISIBLE_CHARS_RE = /[\u200B-\u200D\uFEFF\u00AD]/g;
const NBSP_RE = /[\u00A0\u202F\u2007]/g;
const MULTI_SPACE_RE = /[ \t]{2,}/g;
const CRLF_RE = /\r\n?/g;
const TRAILING_WS_RE = /[ \t]+$/gm;
const LEADING_WS_RE = /^[ \t]+/gm;
const EXCESS_BREAKS_RE = /\n{3,}/g;

const BULLET_INLINE_RE = /([.;:])\s*([–•●▪·])\s+/g;
const NUMBERED_INLINE_RE = /([.;:])\s*(\d{1,2})\.\s+(?=[A-ZÁÀÂÃÉÊÍÓÔÕÚÇ])/g;

const MISSING_SPACE_AFTER_PUNCT_RE = /([.,;:!?])(?=[A-ZÁÀÂÃÉÊÍÓÔÕÚÇ])/g;
const SPACE_BEFORE_PUNCT_RE = /\s+([.,;:!?])/g;

const FOOTNOTE_GLUED_RE = /([a-záàâãéêíóôõúç])(\d{1,3})(?=[\s.,;:)])/g;

function fixQuotes(text: string): string {
  let open = true;
  return text.replace(/"/g, () => {
    const q = open ? '\u201C' : '\u201D';
    open = !open;
    return q;
  });
}

export interface NormalizeOptions {
  extractInlineLists?: boolean;
  fixFootnotes?: boolean;
  normalizeQuotes?: boolean;
}

const DEFAULTS: Required<NormalizeOptions> = {
  extractInlineLists: true,
  fixFootnotes: true,
  normalizeQuotes: true,
};

export interface NormalizationChanges {
  invisibleCharsRemoved: number;
  nbspReplaced: number;
  multiSpacesCollapsed: number;
  crlfReplaced: number;
  excessBreaksCollapsed: number;
  bulletsExtracted: number;
  numberedExtracted: number;
  missingSpacesAfterPunct: number;
  spacesBeforePunctRemoved: number;
  footnotesSeparated: number;
  quotesConverted: number;
}

export interface NormalizationReport {
  text: string;
  changed: boolean;
  changes: NormalizationChanges;
  originalLength: number;
  normalizedLength: number;
  durationMs: number;
}

function countMatches(text: string, re: RegExp): number {
  let n = 0;
  const local = new RegExp(re.source, re.flags.includes('g') ? re.flags : re.flags + 'g');
  while (local.exec(text) !== null) n++;
  return n;
}

/**
 * Versão instrumentada — retorna texto normalizado + relatório detalhado.
 * Use em modo dev para auditoria. Em produção prefira `normalizeCatechismText`
 * (mesma lógica, sem overhead de contagem).
 */
export function normalizeCatechismTextWithReport(
  input: string | null | undefined,
  options: NormalizeOptions = {}
): NormalizationReport {
  const opts = { ...DEFAULTS, ...options };
  const originalLength = input?.length ?? 0;
  const t0 =
    typeof performance !== 'undefined' && performance.now
      ? performance.now()
      : Date.now();

  if (!input) {
    return {
      text: '',
      changed: false,
      changes: emptyChanges(),
      originalLength: 0,
      normalizedLength: 0,
      durationMs: 0,
    };
  }

  let text = String(input);
  const changes = emptyChanges();

  changes.crlfReplaced = countMatches(text, CRLF_RE);
  text = text.replace(CRLF_RE, '\n');

  changes.invisibleCharsRemoved = countMatches(text, INVISIBLE_CHARS_RE);
  text = text.replace(INVISIBLE_CHARS_RE, '');

  changes.nbspReplaced = countMatches(text, NBSP_RE);
  text = text.replace(NBSP_RE, ' ');

  if (opts.fixFootnotes) {
    changes.footnotesSeparated = countMatches(text, FOOTNOTE_GLUED_RE);
    text = text.replace(FOOTNOTE_GLUED_RE, '$1');
  }

  if (opts.extractInlineLists) {
    changes.bulletsExtracted = countMatches(text, BULLET_INLINE_RE);
    text = text.replace(BULLET_INLINE_RE, '$1\n\n- ');
    changes.numberedExtracted = countMatches(text, NUMBERED_INLINE_RE);
    text = text.replace(NUMBERED_INLINE_RE, '$1\n\n$2. ');
  }

  changes.spacesBeforePunctRemoved = countMatches(text, SPACE_BEFORE_PUNCT_RE);
  text = text.replace(SPACE_BEFORE_PUNCT_RE, '$1');

  changes.missingSpacesAfterPunct = countMatches(text, MISSING_SPACE_AFTER_PUNCT_RE);
  text = text.replace(MISSING_SPACE_AFTER_PUNCT_RE, '$1 ');

  text = text.replace(TRAILING_WS_RE, '');
  text = text.replace(LEADING_WS_RE, (match, offset, str) => {
    const rest = str.slice(offset);
    if (/^[-*]\s|^\d+\.\s/.test(rest.trimStart())) return match;
    return '';
  });

  changes.multiSpacesCollapsed = countMatches(text, MULTI_SPACE_RE);
  text = text.replace(MULTI_SPACE_RE, ' ');

  changes.excessBreaksCollapsed = countMatches(text, EXCESS_BREAKS_RE);
  text = text.replace(EXCESS_BREAKS_RE, '\n\n');

  if (opts.normalizeQuotes) {
    changes.quotesConverted = countMatches(text, /"/g);
    text = fixQuotes(text);
  }

  text = text.trim();

  const t1 =
    typeof performance !== 'undefined' && performance.now
      ? performance.now()
      : Date.now();

  const changed = text !== input;

  return {
    text,
    changed,
    changes,
    originalLength,
    normalizedLength: text.length,
    durationMs: t1 - t0,
  };
}

export function normalizeCatechismText(
  input: string | null | undefined,
  options: NormalizeOptions = {}
): string {
  return normalizeCatechismTextWithReport(input, options).text;
}

function emptyChanges(): NormalizationChanges {
  return {
    invisibleCharsRemoved: 0,
    nbspReplaced: 0,
    multiSpacesCollapsed: 0,
    crlfReplaced: 0,
    excessBreaksCollapsed: 0,
    bulletsExtracted: 0,
    numberedExtracted: 0,
    missingSpacesAfterPunct: 0,
    spacesBeforePunctRemoved: 0,
    footnotesSeparated: 0,
    quotesConverted: 0,
  };
}

export function totalChanges(c: NormalizationChanges): number {
  return Object.values(c).reduce((a, b) => a + b, 0);
}

// ============================================================================
// Cache LRU por parágrafo — evita recomputar quando o mesmo `content` volta.
// ============================================================================

interface CacheEntry {
  key: string;
  report: NormalizationReport;
}

const CACHE_MAX = 512;
const cache = new Map<string, CacheEntry>();
let cacheHits = 0;
let cacheMisses = 0;

function fnv1a(s: string): string {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = (h + ((h << 1) + (h << 4) + (h << 7) + (h << 8) + (h << 24))) >>> 0;
  }
  return h.toString(16);
}

function cacheKey(paragraph: number | string, input: string, options: NormalizeOptions): string {
  const optKey = `${options.extractInlineLists ?? 1}${options.fixFootnotes ?? 1}${options.normalizeQuotes ?? 1}`;
  return `${paragraph}:${optKey}:${input.length}:${fnv1a(input)}`;
}

/**
 * Versão com cache LRU indexada por `paragraph` + hash de conteúdo.
 * Retorna o mesmo objeto Report entre chamadas idênticas — não mutar!
 */
export function normalizeCatechismTextCached(
  paragraph: number | string,
  input: string | null | undefined,
  options: NormalizeOptions = {}
): NormalizationReport {
  if (!input) return normalizeCatechismTextWithReport(input, options);
  const key = cacheKey(paragraph, input, options);
  const hit = cache.get(key);
  if (hit) {
    cache.delete(key);
    cache.set(key, hit);
    cacheHits++;
    return hit.report;
  }
  cacheMisses++;
  const report = normalizeCatechismTextWithReport(input, options);
  cache.set(key, { key, report });
  if (cache.size > CACHE_MAX) {
    const oldest = cache.keys().next().value;
    if (oldest !== undefined) cache.delete(oldest);
  }
  return report;
}

export function getNormalizerCacheStats() {
  return { size: cache.size, max: CACHE_MAX, hits: cacheHits, misses: cacheMisses };
}

export function clearNormalizerCache() {
  cache.clear();
  cacheHits = 0;
  cacheMisses = 0;
}
