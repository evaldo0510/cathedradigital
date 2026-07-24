/**
 * Zod schema canônico do `editorial_closure` (Constituição 1.0.0).
 *
 * Fluxo de parsing tolerante a legado, com estratégia de "retries":
 *   1. Se input é objeto/JSON → tenta schema estrito.
 *   2. Se falha → normaliza aliases PT-BR + coerções → tenta de novo.
 *   3. Se ainda falha → tenta como reflexão-string pura.
 *   4. Se tudo falha → retorna { ok: false, warnings }.
 *
 * Nenhum caminho lança exceção — parsing defeituoso vira warning.
 */
import { z } from 'zod';

export const ClosureNexusItemSchema = z.object({
  kind: z.enum([
    'bible_verse',
    'catechism_paragraph',
    'magisterium_doc',
    'patristic',
    'saint',
    'saint_work',
    'glossary',
    'prayer',
    'journey',
    'liturgy',
    'other',
  ] as const),
  ref: z.string().min(1),
  label: z.string().min(1),
  note: z.string().optional(),
});

export const ClosureNextSchema = z.object({
  label: z.string().min(1),
  href: z.string().min(1),
  kicker: z.string().optional(),
});

export const EditorialClosureSchema = z
  .object({
    reflection: z.string().optional().default(''),
    application: z.string().optional().default(''),
    prayer: z.string().optional().default(''),
    next: ClosureNextSchema.optional(),
    nexus: z.array(ClosureNexusItemSchema).optional(),
    source: z.string().optional(),
  })
  .refine(
    (v) => !!(v.reflection || v.application || v.prayer || v.next || (v.nexus && v.nexus.length)),
    { message: 'closure_empty' },
  );

export type EditorialClosureValidated = z.infer<typeof EditorialClosureSchema>;

export interface ClosureValidationReport {
  ok: boolean;
  data: EditorialClosureValidated | null;
  warnings: string[];
  strategy: 'strict' | 'aliases' | 'string-fallback' | 'none';
}

const REFLECTION_KEYS = ['reflection', 'reflexao', 'reflexão', 'meditation', 'meditacao', 'meditação', 'text', 'conclusion', 'closure'];
const APPLICATION_KEYS = ['application', 'aplicacao', 'aplicação', 'action', 'acao', 'ação', 'practice', 'pratica', 'prática'];
const PRAYER_KEYS = ['prayer', 'oracao', 'oração', 'prece', 'oratio'];

function pickString(obj: Record<string, unknown>, keys: string[]): string {
  for (const k of keys) {
    const v = obj[k];
    if (typeof v === 'string' && v.trim()) return v.trim();
  }
  return '';
}

function normalizeAliases(raw: Record<string, unknown>, warnings: string[]): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  const reflection = pickString(raw, REFLECTION_KEYS);
  const application = pickString(raw, APPLICATION_KEYS);
  const prayer = pickString(raw, PRAYER_KEYS);
  if (reflection) out.reflection = reflection;
  if (application) out.application = application;
  if (prayer) out.prayer = prayer;

  if (raw.next && typeof raw.next === 'object') {
    const n = raw.next as Record<string, unknown>;
    const label = typeof n.label === 'string' ? n.label : typeof n.title === 'string' ? n.title : '';
    const href = typeof n.href === 'string' ? n.href : typeof n.url === 'string' ? n.url : '';
    if (label && href) {
      out.next = { label, href, kicker: typeof n.kicker === 'string' ? n.kicker : undefined };
      if (!('href' in n) && 'url' in n) warnings.push('next.url convertido para next.href (alias legado)');
    } else if (n) {
      warnings.push('next descartado: faltam label ou href');
    }
  }

  if (Array.isArray(raw.nexus)) {
    const items: unknown[] = [];
    raw.nexus.forEach((entry, idx) => {
      if (!entry || typeof entry !== 'object') {
        warnings.push(`nexus[${idx}] descartado: não é objeto`);
        return;
      }
      const e = entry as Record<string, unknown>;
      const kind = e.kind ?? e.type;
      const ref = e.ref ?? e.id ?? e.slug;
      const label = e.label ?? e.title;
      const parsed = ClosureNexusItemSchema.safeParse({
        kind,
        ref,
        label,
        note: typeof e.note === 'string' ? e.note : undefined,
      });
      if (!parsed.success) {
        warnings.push(`nexus[${idx}] descartado: ${parsed.error.issues[0]?.message ?? 'inválido'}`);
        return;
      }
      items.push(parsed.data);
    });
    if (items.length) out.nexus = items;
  }

  if (typeof raw.source === 'string') out.source = raw.source;
  return out;
}

function coerce(raw: unknown, warnings: string[]): Record<string, unknown> | string | null {
  if (raw == null) return null;
  if (typeof raw === 'string') {
    const t = raw.trim();
    if (!t) return null;
    if (t.startsWith('{') || t.startsWith('[')) {
      try {
        const parsed = JSON.parse(t);
        if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
          warnings.push('closure recebido como string JSON — convertido em objeto');
          return parsed as Record<string, unknown>;
        }
      } catch {
        warnings.push('closure aparentava JSON mas não parseou — tratado como texto');
      }
    }
    return t; // string pura
  }
  if (typeof raw === 'object' && !Array.isArray(raw)) {
    return raw as Record<string, unknown>;
  }
  warnings.push(`closure com tipo inesperado (${typeof raw}) — descartado`);
  return null;
}

/**
 * Ponto de entrada: valida qualquer input contra o schema canônico
 * com múltiplas tentativas de recuperação.
 */
export function validateEditorialClosure(raw: unknown): ClosureValidationReport {
  const warnings: string[] = [];
  const coerced = coerce(raw, warnings);
  if (coerced == null) {
    return { ok: false, data: null, warnings: [...warnings, 'closure vazio ou irrecuperável'], strategy: 'none' };
  }

  // Retry 3: string pura → reflection
  if (typeof coerced === 'string') {
    const r = EditorialClosureSchema.safeParse({ reflection: coerced });
    if (r.success) {
      warnings.push('closure interpretado como reflexão (string pura)');
      return { ok: true, data: r.data, warnings, strategy: 'string-fallback' };
    }
    return { ok: false, data: null, warnings: [...warnings, 'string vazia'], strategy: 'none' };
  }

  // Retry 1: schema estrito
  const strict = EditorialClosureSchema.safeParse(coerced);
  if (strict.success) {
    return { ok: true, data: strict.data, warnings, strategy: 'strict' };
  }

  // Retry 2: normaliza aliases e reencaminha
  const normalized = normalizeAliases(coerced, warnings);
  const retry = EditorialClosureSchema.safeParse(normalized);
  if (retry.success) {
    warnings.push('closure normalizado a partir de aliases legados');
    return { ok: true, data: retry.data, warnings, strategy: 'aliases' };
  }

  warnings.push(`schema falhou: ${retry.error.issues.map((i) => i.message).join('; ')}`);
  return { ok: false, data: null, warnings, strategy: 'none' };
}
