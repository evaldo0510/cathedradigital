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
}

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
  suggested_silence?: 0 | 10 | 20 | 30;
  recommended_intention?: string;
  catechism_ref?: MysteryCatechismRef | null;
  patristic_ref?: MysteryPatristicRef | null;
  related_saints?: MysterySaintRef[];
  hero_gradient?: string;
  hero_image_path?: string;
}

export function readMysteryMeta(m: DBMystery | null | undefined): MysteryContemplativeMeta {
  if (!m || !m.meta || typeof m.meta !== 'object') return {};
  return m.meta as MysteryContemplativeMeta;
}
