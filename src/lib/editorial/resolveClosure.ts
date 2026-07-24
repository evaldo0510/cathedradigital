/**
 * resolveClosure — normaliza um row de conteúdo em props do EditorialClosure.
 *
 * Toda tabela editorial (glossary, saints, prayers, catechism_official,
 * saint_works) recebeu a coluna `editorial_closure JSONB` no formato:
 *   { reflection, application, prayer, next?: { label, href, kicker? } }
 *
 * Este helper aceita qualquer objeto (row de banco, DTO, mock) e devolve
 * as props tipadas — ou `null` quando a peça ainda não tem closure editorial.
 * Assim os leitores renderizam `<EditorialClosure>` apenas quando existe
 * conteúdo curado (nunca placeholders vazios ou genéricos de IA).
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

export function resolveEditorialClosure(
  source: ClosureLike | null | undefined,
): EditorialClosureProps | null {
  const raw = source?.editorial_closure;
  if (!raw || typeof raw !== 'object') return null;

  const c = raw as Record<string, unknown>;
  const reflection = typeof c.reflection === 'string' ? c.reflection.trim() : '';
  const application = typeof c.application === 'string' ? c.application.trim() : '';
  const prayer = typeof c.prayer === 'string' ? c.prayer.trim() : '';

  if (!reflection || !application || !prayer) return null;

  const nextRaw = c.next as Record<string, unknown> | undefined;
  const next =
    nextRaw && typeof nextRaw.label === 'string' && typeof nextRaw.href === 'string'
      ? {
          label: nextRaw.label,
          href: nextRaw.href,
          kicker: typeof nextRaw.kicker === 'string' ? nextRaw.kicker : undefined,
        }
      : undefined;

  const nexus = parseNexus(c.nexus);
  const closureSource = typeof c.source === 'string' ? c.source : undefined;

  return { reflection, application, prayer, next, nexus, source: closureSource };
}
