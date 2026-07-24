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
// 3+ quebras → parágrafo duplo
const EXCESS_BREAKS_RE = /\n{3,}/g;

// Marcadores comuns de lista: – • * — precedidos por quebra
const BULLET_INLINE_RE = /([.;:])\s*([–•●▪·])\s+/g;
// Item numerado colado a texto: "algo.1. Novo item"
const NUMBERED_INLINE_RE = /([.;:])\s*(\d{1,2})\.\s+(?=[A-ZÁÀÂÃÉÊÍÓÔÕÚÇ])/g;

// Falta espaço após pontuação (não em números decimais nem em §/n.)
const MISSING_SPACE_AFTER_PUNCT_RE = /([.,;:!?])(?=[A-ZÁÀÂÃÉÊÍÓÔÕÚÇ])/g;
// Espaço antes de pontuação
const SPACE_BEFORE_PUNCT_RE = /\s+([.,;:!?])/g;

// Notas de rodapé em sobrescrito coladas: "palavra12" → separar quando entre letra e dígito seguido de maiúscula ou espaço.
// Muito específico para não quebrar datas: aplicamos apenas quando o dígito vem depois de letra minúscula seguida por 1-3 dígitos e depois espaço/pontuação.
const FOOTNOTE_GLUED_RE = /([a-záàâãéêíóôõúç])(\d{1,3})(?=[\s.,;:)])/g;

// Aspas retas → curvas em português
function fixQuotes(text: string): string {
  // Substituição balanceada simples
  let open = true;
  return text.replace(/"/g, () => {
    const q = open ? '\u201C' : '\u201D';
    open = !open;
    return q;
  });
}

export interface NormalizeOptions {
  /** Converter marcadores de lista inline em quebras Markdown */
  extractInlineLists?: boolean;
  /** Corrigir notas de rodapé coladas (heurística) */
  fixFootnotes?: boolean;
  /** Normalizar aspas retas para curvas */
  normalizeQuotes?: boolean;
}

const DEFAULTS: Required<NormalizeOptions> = {
  extractInlineLists: true,
  fixFootnotes: true,
  normalizeQuotes: true,
};

export function normalizeCatechismText(
  input: string | null | undefined,
  options: NormalizeOptions = {}
): string {
  if (!input) return '';
  const opts = { ...DEFAULTS, ...options };
  let text = String(input);

  // 1. Line endings + invisíveis
  text = text.replace(CRLF_RE, '\n');
  text = text.replace(INVISIBLE_CHARS_RE, '');
  text = text.replace(NBSP_RE, ' ');

  // 2. Notas de rodapé antes de outras normalizações
  if (opts.fixFootnotes) {
    text = text.replace(FOOTNOTE_GLUED_RE, '$1');
  }

  // 3. Marcadores de lista inline → quebras
  if (opts.extractInlineLists) {
    text = text.replace(BULLET_INLINE_RE, '$1\n\n- ');
    text = text.replace(NUMBERED_INLINE_RE, '$1\n\n$2. ');
  }

  // 4. Pontuação
  text = text.replace(SPACE_BEFORE_PUNCT_RE, '$1');
  text = text.replace(MISSING_SPACE_AFTER_PUNCT_RE, '$1 ');

  // 5. Espaços por linha
  text = text.replace(TRAILING_WS_RE, '');
  text = text.replace(LEADING_WS_RE, (match, offset, str) => {
    // Preservar indentação de itens de lista markdown
    const lineStart = str.lastIndexOf('\n', offset) + 1;
    const rest = str.slice(offset);
    if (/^[-*]\s|^\d+\.\s/.test(rest.trimStart())) return match;
    return '';
  });
  text = text.replace(MULTI_SPACE_RE, ' ');

  // 6. Quebras de parágrafo
  text = text.replace(EXCESS_BREAKS_RE, '\n\n');

  // 7. Aspas
  if (opts.normalizeQuotes) {
    text = fixQuotes(text);
  }

  // 8. Trim final
  return text.trim();
}
