/**
 * Biblioteca Patrística — Tipos canônicos.
 *
 * Toda leitura de obras dos santos passa por estes tipos.
 * Alinhados 1:1 com as tabelas `saint_works` e `saint_work_chapters`.
 */

export type SaintWorkCategory =
  | 'patristica'
  | 'escolastica'
  | 'mistica'
  | 'monastica'
  | 'carmelita'
  | 'franciscana'
  | 'dominicana'
  | 'doutor'
  | 'espiritualidade'
  | 'apologetica'
  | 'liturgica';

export type SaintWorkStatus = 'draft' | 'in_review' | 'published' | 'archived';

export const SAINT_WORK_CATEGORY_LABELS: Record<SaintWorkCategory, string> = {
  patristica: 'Padres da Igreja',
  escolastica: 'Escolástica',
  mistica: 'Mística',
  monastica: 'Monástica',
  carmelita: 'Carmelita',
  franciscana: 'Franciscana',
  dominicana: 'Dominicana',
  doutor: 'Doutores da Igreja',
  espiritualidade: 'Espiritualidade',
  apologetica: 'Apologética',
  liturgica: 'Litúrgica',
};

export interface SaintWork {
  id: string;
  saint_id: string;
  slug: string;
  title: string;
  original_title: string | null;
  language: string;
  original_language: string | null;
  category: SaintWorkCategory;
  year_written: number | null;
  abstract: string | null;
  cover_image_url: string | null;
  is_public_domain: boolean;
  license: string | null;
  source_url: string | null;
  translation_credit: string | null;
  status: SaintWorkStatus;
  editorial_score: number;
  chapter_count: number;
  total_reading_minutes: number;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
  published_at: string | null;
}

export interface SaintWorkChapter {
  id: string;
  work_id: string;
  order: number;
  title: string;
  subtitle: string | null;
  body_html: string;
  body_plain: string;
  reading_minutes: number;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface SaintWorkWithAuthor extends SaintWork {
  saint_name?: string;
  saint_slug?: string;
}
