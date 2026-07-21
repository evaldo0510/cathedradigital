/**
 * Contratos para o meta contemplativo dos mistérios do Rosário.
 * Todo conteúdo vem de `prayer_mysteries.meta` — nunca hardcoded.
 * Schema completo (Sprint 4 · Onda C · Entrega 1) — todos os campos são
 * preenchidos no banco para os 20 mistérios. Nenhum fallback é aceitável.
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
  /** Motivo pelo qual este santo meditou/viveu especialmente este mistério. */
  reason?: string;
}

export interface MysteryMagisteriumRef {
  /** Ex.: "João Paulo II". */
  author: string;
  /** Ex.: "Rosarium Virginis Mariae". */
  work: string;
  /** Trecho curto (1–2 linhas). */
  quote: string;
  /** Numeração do parágrafo/artigo, se houver. */
  paragraph?: string | number;
}

export interface MysteryIconography {
  /** Descrição breve do que a tradição iconográfica costuma representar. */
  description: string;
  /** Elementos simbólicos recorrentes (pomba, lírio, cruz nua, luz…). */
  symbols?: string[];
  /** Obras/autores clássicos que representaram o mistério. */
  masterworks?: string[];
}

export interface MysteryBibliographyEntry {
  author: string;
  title: string;
  /** Ex.: "cap. IV" ou "§§ 149-152". */
  locus?: string;
}

export interface MysteryContemplativeMeta {
  contemplative_title?: string;
  primary_passage?: MysteryPassage;
  complementary_passages?: string[];
  /** Virtude central meditada no mistério. */
  virtue?: string;
  /** Fruto espiritual pedido (pode diferir da virtude — ex.: virtude=humildade, fruto=docilidade). */
  spiritual_fruit?: string;
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
  /** Múltiplas referências do Catecismo, quando pertinente. */
  catechism_refs?: MysteryCatechismRef[];
  patristic_ref?: MysteryPatristicRef | null;
  /** Padres da Igreja adicionais ao patristic_ref primário. */
  church_fathers?: MysteryPatristicRef[];
  /** Referências magisteriais (encíclicas, cartas apostólicas, exortações). */
  magisterium_refs?: MysteryMagisteriumRef[];
  related_saints?: MysterySaintRef[];
  /** Tradição iconográfica do mistério. */
  iconography?: MysteryIconography;
  /** Bibliografia recomendada para aprofundamento. */
  bibliography?: MysteryBibliographyEntry[];
  hero_gradient?: string;
  hero_image_path?: string;
}

export function readMysteryMeta(m: DBMystery | null | undefined): MysteryContemplativeMeta {
  if (!m || !m.meta || typeof m.meta !== 'object') return {};
  return m.meta as MysteryContemplativeMeta;
}
