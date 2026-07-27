/**
 * Sanitização de FAQs vindos do banco/glossário.
 *
 * Regras:
 * - `question` deve ser string não-vazia (após trim); caso contrário o item é descartado.
 * - `answer` é normalizada: `undefined`/`null`/tipos inválidos viram `''` (item marcado como "normalizado").
 * - Retorna também contadores (dropped, normalized) para observabilidade em dev/testes.
 * - Para uso em JSON-LD, filtre apenas itens com `answer` não-vazia via `filterFaqForJsonLd`.
 */

export interface FaqItem {
  question: string;
  answer: string;
}

export interface SanitizeFaqStats {
  total: number;
  kept: number;
  dropped: number;
  normalized: number;
}

export interface SanitizeFaqResult {
  items: FaqItem[];
  stats: SanitizeFaqStats;
}

export function sanitizeFaqItemsDetailed(raw: unknown, slug?: string): SanitizeFaqResult {
  const stats: SanitizeFaqStats = { total: 0, kept: 0, dropped: 0, normalized: 0 };
  if (!Array.isArray(raw)) return { items: [], stats };

  stats.total = raw.length;
  const items: FaqItem[] = [];
  const isDev =
    typeof import.meta !== 'undefined' &&
    (import.meta as any).env &&
    (import.meta as any).env.DEV;

  raw.forEach((item, idx) => {
    if (!item || typeof item !== 'object') {
      stats.dropped += 1;
      if (isDev) {
        console.warn(`[Glossary/FAQ] item #${idx} inválido em "${slug ?? '?'}"`, item);
      }
      return;
    }
    const q = (item as any).question;
    const a = (item as any).answer;
    if (typeof q !== 'string' || !q.trim()) {
      stats.dropped += 1;
      if (isDev) {
        console.warn(`[Glossary/FAQ] item #${idx} sem question em "${slug ?? '?'}"`, item);
      }
      return;
    }

    let answer = '';
    if (typeof a === 'string') {
      answer = a;
    } else if (a !== undefined && a !== null) {
      stats.normalized += 1;
      if (isDev) {
        console.warn(
          `[Glossary/FAQ] item #${idx} answer de tipo inválido (${typeof a}) em "${slug ?? '?'}" — normalizado para ''`,
        );
      }
    } else if (a === undefined || a === null) {
      stats.normalized += 1;
      if (isDev) {
        console.warn(
          `[Glossary/FAQ] item #${idx} answer ausente em "${slug ?? '?'}" — normalizado para ''`,
        );
      }
    }

    items.push({ question: q.trim(), answer });
    stats.kept += 1;
  });

  if (isDev && (stats.dropped > 0 || stats.normalized > 0)) {
    console.info(
      `[Glossary/FAQ] sanitize "${slug ?? '?'}" — total=${stats.total} kept=${stats.kept} dropped=${stats.dropped} normalized=${stats.normalized}`,
    );
  }

  return { items, stats };
}

/** Wrapper simples que retorna apenas os itens sanitizados. */
export function sanitizeFaqItems(raw: unknown, slug?: string): FaqItem[] {
  return sanitizeFaqItemsDetailed(raw, slug).items;
}

/**
 * Filtra itens aptos ao JSON-LD FAQPage: exige `answer` não-vazia após trim.
 * O Google rejeita entradas com Answer vazio, então esse filtro garante
 * conformidade com o schema.org/FAQPage.
 */
export function filterFaqForJsonLd(items: FaqItem[] | null | undefined): FaqItem[] {
  if (!Array.isArray(items)) return [];
  return items.filter(
    (it) =>
      !!it &&
      typeof it.question === 'string' &&
      it.question.trim().length > 0 &&
      typeof it.answer === 'string' &&
      it.answer.trim().length > 0,
  );
}
