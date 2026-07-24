/**
 * resolveClosure — normaliza um row de conteúdo em props do EditorialClosure.
 *
 * Formato canônico (Constituição Editorial 1.0.0):
 *   {
 *     reflection: string,
 *     application: string,
 *     prayer: string,
 *     next?: { label, href, kicker? },
 *     nexus?: [{ kind|type, ref|id|slug, label|title, note? }],
 *     source?: string
 *   }
 *
 * FALLBACKS suportados (não quebrar leituras legadas):
 *   - `editorial_closure` como STRING contendo JSON → parseia
 *   - `editorial_closure` como STRING pura → vira `reflection`
 *   - Aliases PT-BR: reflexao/meditacao, aplicacao/acao, oracao/prece
 *   - Aliases genéricos: text/conclusion/closure → reflection
 *   - `next.url` ⇢ `next.href`
 *   - Campos parciais: renderiza os presentes; retorna null só se TUDO faltar
 *
 * Nunca lança exceção — retorna `null` quando o dado é irrecuperável.
 */
import type {
  EditorialClosureProps,
  EditorialClosureNexusItem,
} from '@/components/reader/EditorialClosure';
import type { NexusKind } from '@/types/nexus';

type ClosureLike = {
  editorial_closure?: unknown;
} & Record<string, unknown>;

const VALID_KINDS: NexusKind[] = [
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
];

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

function coerceToObject(raw: unknown): Record<string, unknown> | null {
  if (!raw) return null;
  if (typeof raw === 'string') {
    const trimmed = raw.trim();
    if (!trimmed) return null;
    // Tenta JSON; se falhar, trata como reflexão pura.
    if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
      try {
        const parsed = JSON.parse(trimmed);
        if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
          return parsed as Record<string, unknown>;
        }
      } catch {
        /* fallthrough */
      }
    }
    return { reflection: trimmed };
  }
  if (typeof raw === 'object' && !Array.isArray(raw)) {
    return raw as Record<string, unknown>;
  }
  return null;
}

function parseNexus(raw: unknown): EditorialClosureNexusItem[] | undefined {
  if (!Array.isArray(raw)) return undefined;
  const items: EditorialClosureNexusItem[] = [];
  for (const entry of raw) {
    if (!entry || typeof entry !== 'object') continue;
    const e = entry as Record<string, unknown>;
    const kind = e.kind ?? e.type;
    const ref = e.ref ?? e.id ?? e.slug;
    const label = e.label ?? e.title;
    if (
      typeof kind !== 'string' ||
      !VALID_KINDS.includes(kind as NexusKind) ||
      typeof ref !== 'string' ||
      !ref ||
      typeof label !== 'string' ||
      !label
    ) {
      continue;
    }
    const item: EditorialClosureNexusItem = { kind: kind as NexusKind, ref, label };
    if (typeof e.note === 'string') item.note = e.note;
    items.push(item);
  }
  return items.length > 0 ? items : undefined;
}

function parseNext(raw: unknown): EditorialClosureProps['next'] | undefined {
  if (!raw || typeof raw !== 'object') return undefined;
  const n = raw as Record<string, unknown>;
  const label = typeof n.label === 'string' ? n.label : typeof n.title === 'string' ? n.title : '';
  const href = typeof n.href === 'string' ? n.href : typeof n.url === 'string' ? n.url : '';
  if (!label || !href) return undefined;
  return {
    label,
    href,
    kicker: typeof n.kicker === 'string' ? n.kicker : undefined,
  };
}

export function resolveEditorialClosure(
  source: ClosureLike | null | undefined,
): EditorialClosureProps | null {
  try {
    const c = coerceToObject(source?.editorial_closure);
    if (!c) return null;

    const reflection = pickString(c, REFLECTION_KEYS);
    const application = pickString(c, APPLICATION_KEYS);
    const prayer = pickString(c, PRAYER_KEYS);

    const next = parseNext(c.next);
    const nexus = parseNexus(c.nexus);
    const closureSource = typeof c.source === 'string' ? c.source : undefined;

    // Só descarta se NADA aproveitável existir (nem texto, nem próxima, nem nexus).
    if (!reflection && !application && !prayer && !next && !nexus) return null;

    return { reflection, application, prayer, next, nexus, source: closureSource };
  } catch (err) {
    // Nunca deixa a leitura quebrar por causa de closure malformado.
    if (typeof console !== 'undefined') {
      console.warn('[resolveEditorialClosure] closure ignorado por erro:', err);
    }
    return null;
  }
}
