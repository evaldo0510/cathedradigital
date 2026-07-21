/**
 * Contratos para o meta contemplativo dos mistérios do Rosário.
 * Todo conteúdo vem de `prayer_mysteries.meta` — nunca hardcoded.
 */
import type { DBMystery } from '@/prayer-engine/loadPrayerHierarchy';

export interface MysteryPassage {
  ref: string;
  texto?: string;
}

export interface MysteryCatechismRef {
  paragraph: number;
  quote: string;
}

export interface MysteryPatristicRef {
  author: string;
  work?: string;
  quote: string;
}

export interface MysterySaintRef {
  name: string;
  slug?: string;
  reason?: string;
}

export interface MysteryMagisteriumRef {
  document: string;
  author?: string;
  locus?: string;
  quote?: string;
}

export interface MysteryIconography {
  description?: string;
  symbols?: string[];
  masterworks?: string[];
}

export interface MysteryBibliographyEntry {
  author: string;
  title: string;
  locus?: string;
}

export type MysteryArtworkCollection = 'classical' | 'byzantine' | 'contemporary';

export interface MysteryContemplativeMeta {
  contemplative_title?: string;
  primary_passage?: MysteryPassage;
  complementary_passages?: string[];
  virtue?: string;
  logos_meditation?: string;
  contemplation_question?: string;
  /** Frases curtas exibidas ANTES do Pai-Nosso, para o convite "Contemple". */
  contemplation_invitation?: string[];
  /** Pequena oração exibida no encerramento da dezena. */
  closing_prayer?: string;
  /** Ação concreta para o dia, exibida no encerramento da dezena. */
  concrete_action?: string;
  /** Fruto espiritual da dezena. */
  spiritual_fruit?: string;
  suggested_silence?: 0 | 10 | 20 | 30;
  recommended_intention?: string;
  /** Referências completas do Catecismo (preferir sobre `catechism_ref` legado). */
  catechism_refs?: MysteryCatechismRef[];
  catechism_ref?: MysteryCatechismRef | null;
  church_fathers?: MysteryPatristicRef[];
  patristic_ref?: MysteryPatristicRef | null;
  magisterium_refs?: MysteryMagisteriumRef[];
  related_saints?: MysterySaintRef[];
  iconography?: MysteryIconography;
  bibliography?: MysteryBibliographyEntry[];
  hero_gradient?: string;
  /** Identificador estável da obra de arte (independente da coleção). Ex.: `joyful-1`. */
  image_slug?: string;
  /** Coleção artística ativa. Permite trocar toda a arte sem alterar registros. */
  image_collection?: MysteryArtworkCollection;
  /** @deprecated Usar `image_slug`. Mantido para compatibilidade. */
  hero_image_path?: string;
}

export function readMysteryMeta(m: DBMystery | null | undefined): MysteryContemplativeMeta {
  if (!m || !m.meta || typeof m.meta !== 'object') return {};
  return m.meta as MysteryContemplativeMeta;
}

/**
 * Retorna o identificador da obra de arte a exibir, preferindo `image_slug`
 * (nova fonte de verdade) e caindo para `hero_image_path` legado.
 */
export function readMysteryImageSlug(meta: MysteryContemplativeMeta): string | undefined {
  return meta.image_slug ?? meta.hero_image_path ?? undefined;
}
