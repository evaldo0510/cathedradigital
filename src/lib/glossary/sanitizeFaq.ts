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

/* -------------------------------------------------------------------- */
/* JSON-LD builder + validação Zod                                      */
/* -------------------------------------------------------------------- */

import { z } from 'zod';

const nonEmptyString = z.string().trim().min(1);

export const FaqPageJsonLdSchema = z.object({
  '@type': z.literal('FAQPage'),
  mainEntity: z
    .array(
      z.object({
        '@type': z.literal('Question'),
        name: nonEmptyString,
        acceptedAnswer: z.object({
          '@type': z.literal('Answer'),
          text: nonEmptyString,
        }),
      }),
    )
    .min(1),
});

export type FaqPageJsonLd = z.infer<typeof FaqPageJsonLdSchema>;

/**
 * Constrói o objeto JSON-LD `FAQPage` a partir de itens já sanitizados,
 * aplicando `filterFaqForJsonLd` + validação Zod em runtime.
 *
 * Retorna `null` quando não há itens válidos (não emitir schema vazio).
 * Em dev, loga erro de validação; em prod, retorna `null` silenciosamente
 * para nunca enviar structured data malformado ao Google.
 */
export function buildFaqPageJsonLd(items: FaqItem[] | null | undefined): FaqPageJsonLd | null {
  const eligible = filterFaqForJsonLd(items);
  if (eligible.length === 0) return null;

  const candidate = {
    '@type': 'FAQPage' as const,
    mainEntity: eligible
      .map((f) => ({
        '@type': 'Question' as const,
        name: sanitizeAnswerForJsonLd(f.question),
        acceptedAnswer: {
          '@type': 'Answer' as const,
          text: sanitizeAnswerForJsonLd(f.answer),
        },
      }))
      .filter((q) => q.name.length > 0 && q.acceptedAnswer.text.length > 0),
  };
  if (candidate.mainEntity.length === 0) return null;

  const parsed = FaqPageJsonLdSchema.safeParse(candidate);
  if (!parsed.success) {
    const isDev =
      typeof import.meta !== 'undefined' &&
      (import.meta as any).env &&
      (import.meta as any).env.DEV;
    if (isDev) {
      console.error('[Glossary/FAQ] JSON-LD inválido — descartado', parsed.error.flatten());
    }
    return null;
  }
  return parsed.data;
}

