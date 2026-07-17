/**
 * Helpers puros de bible-import-missing.
 * Extraídos do index.ts para permitir testes unitários sem bootar o handler HTTP.
 */

// Aceita códigos de tradução alfanuméricos maiúsculos (NVIPT, NAA, ARA…).
export const TRANSLATION_RE = /^[A-Z0-9]{2,10}$/;

export function normalizeTranslation(input: unknown): string {
  const raw = typeof input === 'string' ? input.trim().toUpperCase() : '';
  if (!TRANSLATION_RE.test(raw)) {
    throw new Error(`Código de tradução inválido: "${input}". Use letras/dígitos maiúsculos (ex.: NVIPT, NAA, ARA).`);
  }
  return raw;
}

export type Selection = Array<{ abbrev: string; chapters?: number[] }>;

export function normalizeSelection(input: unknown): Selection | null {
  if (!Array.isArray(input) || input.length === 0) return null;
  const out: Selection = [];
  for (const it of input) {
    if (!it || typeof it !== 'object') continue;
    const abbrev = String((it as any).abbrev ?? '').trim();
    if (!abbrev) continue;
    const rawCh = (it as any).chapters;
    let chapters: number[] | undefined;
    if (Array.isArray(rawCh)) {
      chapters = rawCh.map((n) => Number(n)).filter((n) => Number.isInteger(n) && n > 0);
      if (chapters.length === 0) chapters = undefined;
    }
    out.push({ abbrev, chapters });
  }
  return out.length > 0 ? out : null;
}

/**
 * Calcula os capítulos ausentes a partir de dados injetáveis — permite
 * testar idempotência (mesmos dados → plano vazio) sem tocar o banco.
 *
 *  - bollsBooks: cânon disponível na fonte (bollsId → { chapters })
 *  - existingChaptersByAbbrev: capítulos já presentes por abreviatura
 *  - canon: lista canônica {abbr, bollsId, deuterocanonical, name, testament}
 *  - skipAbbrs: livros com cânon próprio (Sl/Dn na versão católica)
 *  - selection: seleção manual (mesma semântica do normalizeSelection)
 */
export interface PlanCanonEntry {
  abbr: string;
  name: string;
  bollsId: number;
  deuterocanonical?: boolean;
  testament?: string;
}

export function planMissing(params: {
  canon: PlanCanonEntry[];
  bollsBooks: Map<number, { chapters: number }>;
  existingChaptersByAbbrev: Map<string, Set<number>>;
  skipAbbrs?: Set<string>;
  selection?: Selection | null;
}): Array<{ canon: PlanCanonEntry; bookId: number; chapters: number[] }> {
  const { canon, bollsBooks, existingChaptersByAbbrev, skipAbbrs = new Set(), selection = null } = params;
  const selMap = selection
    ? new Map(selection.map((s) => [s.abbrev, s.chapters ? new Set(s.chapters) : null]))
    : null;

  const plan: Array<{ canon: PlanCanonEntry; bookId: number; chapters: number[] }> = [];
  for (const c of canon) {
    if (c.deuterocanonical) continue;
    if (skipAbbrs.has(c.abbr)) continue;
    if (selMap && !selMap.has(c.abbr)) continue;
    const bolls = bollsBooks.get(c.bollsId);
    if (!bolls) continue;
    const existing = existingChaptersByAbbrev.get(c.abbr) ?? new Set<number>();
    const wanted = selMap?.get(c.abbr) ?? null;
    const missing: number[] = [];
    for (let n = 1; n <= bolls.chapters; n++) {
      if (wanted && !wanted.has(n)) continue;
      if (!existing.has(n)) missing.push(n);
    }
    if (missing.length > 0) plan.push({ canon: c, bookId: c.bollsId, chapters: missing });
  }
  return plan;
}
