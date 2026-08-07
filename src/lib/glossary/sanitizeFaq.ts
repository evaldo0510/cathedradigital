import { trackEvent } from "@/lib/analytics";

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
import { reportSanitizationIssue, getSanitizePolicy } from './sanitizePolicy';

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
const JSON_LD_CACHE = new WeakMap<object, FaqPageJsonLd | null>();

export function buildFaqPageJsonLd(items: FaqItem[] | null | undefined): FaqPageJsonLd | null {
  if (Array.isArray(items) && JSON_LD_CACHE.has(items)) {
    return JSON_LD_CACHE.get(items)!;
  }

  const eligible = filterFaqForJsonLd(items);
  const store = (v: FaqPageJsonLd | null) => {
    if (Array.isArray(items)) JSON_LD_CACHE.set(items, v);
    return v;
  };

  if (eligible.length === 0) return store(null);

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
  if (candidate.mainEntity.length === 0) return store(null);

  const parsed = FaqPageJsonLdSchema.safeParse(candidate);
  if (!parsed.success) {
    const details = parsed.error.issues.map((iss) => ({
      path: iss.path.join('.'),
      code: iss.code,
      message: iss.message,
    }));
    // Política por ambiente controla severidade — mas a rejeição dos campos
    // obrigatórios do FAQPage é SEMPRE garantida (retorna null).
    reportSanitizationIssue(
      'Glossary/FAQ',
      'JSON-LD FAQPage rejeitado pelo schema Zod',
      {
        totalIssues: details.length,
        firstIssues: details.slice(0, 10),
        questionCount: candidate.mainEntity.length,
      },
    );
    return store(null);
  }
  return store(parsed.data);
}

/**
 * Validação em tempo real usada por painéis de preview.
 * Retorna estrutura enxuta para renderização em UI.
 */
export interface FaqJsonLdValidation {
  ok: boolean;
  jsonLd: FaqPageJsonLd | null;
  issues: Array<{ path: string; code: string; message: string }>;
  droppedIndices: number[];
  /** Versão da SanitizePolicy que produziu esse resultado. */
  policyVersion: string;
  /** Ambiente resolvido (dev/prod/test). */
  policyEnv: 'dev' | 'prod' | 'test';
  /** Instante em que a validação rodou (ISO). */
  appliedAt: string;
}

export function validateFaqJsonLdLive(items: FaqItem[] | null | undefined): FaqJsonLdValidation {
  const policy = getSanitizePolicy();
  const meta = {
    policyVersion: policy.version,
    policyEnv: policy.env,
    appliedAt: new Date().toISOString(),
  } as const;
  const raw = Array.isArray(items) ? items : [];
  const eligible = filterFaqForJsonLd(raw);
  const droppedIndices: number[] = [];
  raw.forEach((it, i) => {
    if (!eligible.includes(it)) droppedIndices.push(i);
  });
  const candidate = {
    '@type': 'FAQPage' as const,
    mainEntity: eligible.map((f) => ({
      '@type': 'Question' as const,
      name: sanitizeAnswerForJsonLd(f.question),
      acceptedAnswer: {
        '@type': 'Answer' as const,
        text: sanitizeAnswerForJsonLd(f.answer),
      },
    })),
  };
  if (candidate.mainEntity.length === 0) {
    return { ok: false, jsonLd: null, issues: [{ path: 'mainEntity', code: 'empty', message: 'nenhum item elegível' }], droppedIndices, ...meta };
  }
  const parsed = FaqPageJsonLdSchema.safeParse(candidate);
  if (!parsed.success) {
    trackEvent('glossary_faq_sanitized', { count: candidate.mainEntity.length });
    return {
      ok: false,
      jsonLd: null,
      issues: parsed.error.issues.map((i) => ({ path: i.path.join('.'), code: i.code, message: i.message })),
      droppedIndices,
      ...meta,
    };
  }
  return { ok: true, jsonLd: parsed.data, issues: [], droppedIndices, ...meta };
}

/**
 * Explica, por item, o que a sanitização removeu ou normalizou entre a
 * versão bruta e a versão emitida no JSON-LD. Usado apenas por painéis
 * de dev/QA — não deve ser importado em código de produção crítico.
 */
export interface FaqSanitizationDiff {
  index: number;
  rawQuestion: unknown;
  rawAnswer: unknown;
  sanitizedQuestion: string;
  sanitizedAnswer: string;
  questionChanged: boolean;
  answerChanged: boolean;
  removedFromQuestion: string[];
  removedFromAnswer: string[];
  dropped: boolean;
  reason?: string;
}

function collectRemoved(raw: unknown): string[] {
  if (typeof raw !== 'string') return [];
  const hits: string[] = [];
  for (const rx of [DANGEROUS_TAG_BLOCK, DANGEROUS_TAG_LOOSE, INLINE_EVENT_HANDLER, DANGEROUS_URI]) {
    const re = new RegExp(rx.source, rx.flags);
    const matches = raw.match(re);
    if (matches) hits.push(...matches);
  }
  if (/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/.test(raw)) hits.push('[control-chars]');
  return hits;
}

export function explainFaqSanitization(rawList: unknown): FaqSanitizationDiff[] {
  if (!Array.isArray(rawList)) return [];
  return rawList.map((item, index) => {
    const rawQuestion = (item && typeof item === 'object') ? (item as any).question : undefined;
    const rawAnswer = (item && typeof item === 'object') ? (item as any).answer : undefined;
    const sanitizedQuestion = sanitizeAnswerForJsonLd(rawQuestion);
    const sanitizedAnswer = sanitizeAnswerForJsonLd(rawAnswer);
    const dropped = sanitizedQuestion.length === 0 || sanitizedAnswer.length === 0;
    const reason = !sanitizedQuestion
      ? 'question vazia após sanitização'
      : !sanitizedAnswer
        ? 'answer vazia após sanitização'
        : undefined;
    return {
      index,
      rawQuestion,
      rawAnswer,
      sanitizedQuestion,
      sanitizedAnswer,
      questionChanged: typeof rawQuestion === 'string' && rawQuestion !== sanitizedQuestion,
      answerChanged: typeof rawAnswer === 'string' && rawAnswer !== sanitizedAnswer,
      removedFromQuestion: collectRemoved(rawQuestion),
      removedFromAnswer: collectRemoved(rawAnswer),
      dropped,
      reason,
    };
  });
}


/* -------------------------------------------------------------------- */
/* Sanitização de HTML e caracteres de controle para JSON-LD            */
/* -------------------------------------------------------------------- */

// Tags perigosas cujos conteúdos devem ser DESCARTADOS por inteiro
// (script/style/iframe podem executar código ou exfiltrar dados mesmo escapados
// se um consumidor decidir renderizar como HTML por engano).
const DANGEROUS_TAG_BLOCK = /<\s*(script|style|iframe|object|embed|noscript|template)\b[^>]*>[\s\S]*?<\s*\/\s*\1\s*>/gi;
// Também remove tags "solitárias" perigosas sem fechamento
const DANGEROUS_TAG_LOOSE = /<\s*\/?\s*(script|style|iframe|object|embed|noscript|template|link|meta|base|form|input|button|svg|math)\b[^>]*>/gi;
// Handlers inline (onerror=, onclick=, etc.) — mesmo após escape, evitamos deixar padrões suspeitos
const INLINE_EVENT_HANDLER = /\son[a-z]+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi;
// javascript:/data: URIs em atributos href/src
const DANGEROUS_URI = /(?:href|src)\s*=\s*(?:"|')?\s*(?:javascript|data|vbscript):[^"'>\s]*/gi;
// Caracteres de controle (exceto \t \n \r) — quebram JSON-LD e podem esconder payloads
const CONTROL_CHARS = /[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g;

function escapeHtmlEntities(input: string): string {
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Sanitiza um `answer`/`question` antes de emiti-lo dentro do JSON-LD `FAQPage`.
 *
 * Etapas:
 *  1. Remove blocos de tags perigosas (script/style/iframe...) incluindo o conteúdo.
 *  2. Remove qualquer tag perigosa solitária remanescente.
 *  3. Remove handlers inline (onerror=, onclick=) e URIs javascript:/data:.
 *  4. Remove caracteres de controle.
 *  5. Escapa entidades HTML restantes (`< > & " '`).
 *  6. Normaliza espaços e faz trim final.
 *
 * O objetivo é garantir que o `text` do `Answer` seja seguro para consumo
 * por buscadores e por qualquer renderer que trate o conteúdo como HTML.
 */
export function sanitizeAnswerForJsonLd(input: unknown): string {
  if (typeof input !== 'string') return '';
  let out = input;
  out = out.replace(DANGEROUS_TAG_BLOCK, ' ');
  out = out.replace(DANGEROUS_TAG_LOOSE, ' ');
  out = out.replace(INLINE_EVENT_HANDLER, '');
  out = out.replace(DANGEROUS_URI, '');
  out = out.replace(CONTROL_CHARS, '');
  out = escapeHtmlEntities(out);
  out = out.replace(/[ \t]+/g, ' ').replace(/\s+\n/g, '\n').trim();
  return out;
}
