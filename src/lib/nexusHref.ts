/**
 * nexusHref — resolução canônica de href por `NexusKind`.
 *
 * REGRA INEGOCIÁVEL: toda referência do Nexus Theologicus (Bíblia, CIC,
 * santos, orações, jornadas, glossário, liturgia, magistério, patrística)
 * DEVE abrir dentro do Cathedra por rota interna. Este módulo é a fonte
 * única de verdade para converter `(NexusKind, ref)` em URL interna.
 *
 * Consumidores devem SEMPRE usar `resolveNexusHref` — nunca duplicar
 * mapeamentos de rota. Novos kinds passam por aqui.
 */
import type { NexusKind, NexusRef } from '@/types/nexus';
import { catechismInternalPath } from '@/lib/nexusNavigation';

/**
 * Extrai o identificador natural de um `NexusRef` (JSONB variável).
 * Aceita `slug`, `id` e `ref` — nessa ordem — e valores string diretos.
 */
export function extractNexusRefId(ref: NexusRef | string | null | undefined): string | null {
  if (ref == null) return null;
  if (typeof ref === 'string') return ref.length > 0 ? ref : null;
  const obj = ref as Record<string, unknown>;
  for (const k of ['slug', 'id', 'ref'] as const) {
    const v = obj[k];
    if (typeof v === 'string' && v.length > 0) return v;
    if (typeof v === 'number' && Number.isFinite(v)) return String(v);
  }
  return null;
}

/**
 * Resolve o href interno canônico para uma referência do Nexus.
 * Retorna `null` quando o kind não é navegável ou o ref é inválido.
 */
export function resolveNexusHref(
  kind: NexusKind,
  ref: NexusRef | string | null | undefined,
): string | null {
  const id = extractNexusRefId(ref);
  if (!id) return null;

  switch (kind) {
    case 'saint':
      return `/santos/${id}`;
    case 'glossary':
      return `/glossario/${id}`;
    case 'prayer':
      return `/oracao/${id}`;
    case 'journey':
      return `/jornadas/${id}`;
    case 'catechism_paragraph': {
      const n = Number(id);
      return Number.isFinite(n) ? catechismInternalPath(n) : null;
    }
    case 'bible_verse':
      return `/bible?ref=${encodeURIComponent(id)}`;
    case 'magisterium_doc':
      return `/magisterium/${id}`;
    case 'patristic':
      return `/patristica/${id}`;
    case 'liturgy':
      return `/missal/${id}`;
    case 'saint_work':
    case 'other':
    default:
      return null;
  }
}
