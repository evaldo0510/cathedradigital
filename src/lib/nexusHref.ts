/**
 * nexusHref — resolução canônica de href para o Nexus Theologicus.
 *
 * REGRA INEGOCIÁVEL: toda referência do Nexus (Bíblia, CIC, santos, orações,
 * jornadas, glossário, liturgia, magistério, patrística) DEVE abrir dentro
 * do Cathedra por rota interna. Este módulo é a fonte única de verdade para
 * converter `(NexusKind, ref)` em URL interna.
 *
 * Consumidores devem SEMPRE usar `resolveNexusHref` — nunca duplicar
 * mapeamentos de rota. Novos kinds passam por aqui.
 *
 * Adapters de outros domínios (Coleções, Presets de canal) usam os helpers
 * `collectionKindToNexusKind` e `nexusChannelToListingHref` para atravessar
 * a fronteira sem reimplementar rotas.
 */
import type { NexusKind, NexusRef } from '@/types/nexus';
import type { NexusChannel } from '@/components/cathedra/nexus/nexusPresets';
import { catechismInternalPath } from '@/lib/nexusNavigation';

export type NexusRefLike =
  | NexusRef
  | Partial<NexusRef>
  | Record<string, unknown>
  | string
  | null
  | undefined;

/**
 * Extrai o identificador natural de um `NexusRef` (JSONB variável).
 * Aceita `slug`, `id` e `ref` — nessa ordem — e valores string diretos.
 */
export function extractNexusRefId(ref: NexusRefLike): string | null {
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
  ref: NexusRefLike,
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
      // Espera-se `autor/obra` (ex.: "agostinho/confissoes").
      return id.includes('/') ? `/biblioteca/escritos/${id}` : null;
    case 'other':
    default:
      return null;
  }
}

/**
 * Mapeamento CollectionItemType → NexusKind canônico.
 * Coleções usam nomes curtos historicamente distintos do schema Nexus;
 * este helper garante que o href passe pelo `resolveNexusHref`.
 */
const COLLECTION_TO_NEXUS: Record<string, NexusKind> = {
  glossary: 'glossary',
  prayer: 'prayer',
  saint: 'saint',
  saint_work: 'saint_work',
  bible: 'bible_verse',
  liturgy: 'liturgy',
  catechism: 'catechism_paragraph',
  magisterium: 'magisterium_doc',
  journey: 'journey',
};

export function collectionKindToNexusKind(kind: string): NexusKind | null {
  return COLLECTION_TO_NEXUS[kind] ?? null;
}

/**
 * Rota canônica de LISTAGEM (não de item) por canal editorial do Nexus.
 * Usada apenas pelo Átrio do Nexus, onde cada "voz" leva à sua seção.
 * NÃO substitui `resolveNexusHref` — este resolve entidades individuais.
 */
const CHANNEL_TO_LISTING: Record<NexusChannel, string> = {
  bible: '/bible',
  catechism: '/catechism',
  magisterium: '/magisterium',
  father: '/patristica',
  saint: '/santos',
  journey: '/jornadas',
  theme: '/buscar',
};

export function nexusChannelToListingHref(channel: NexusChannel): string {
  return CHANNEL_TO_LISTING[channel];
}
