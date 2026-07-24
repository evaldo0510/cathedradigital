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

/**
 * Modelo de acesso ao texto da obra.
 * - `internal`: leitor Cathedra (saint_work_chapters populados)
 * - `official_external`: fonte oficial fora do Cathedra (Vatican.va, ...)
 * - `public_domain`: fonte pública validada (CCEL, Documenta Catholica Omnia, ...)
 * - `licensed`: tradução licenciada (futuro)
 */
export type SaintWorkAccessType =
  | 'internal'
  | 'official_external'
  | 'public_domain'
  | 'licensed';

export const SAINT_WORK_ACCESS_LABELS: Record<SaintWorkAccessType, string> = {
  internal: 'Leitor Cathedra',
  official_external: 'Fonte oficial',
  public_domain: 'Domínio público',
  licensed: 'Tradução licenciada',
};

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

export type SaintWorkReadingLevel = 'beginner' | 'intermediate' | 'advanced';

export const SAINT_WORK_READING_LEVEL_LABELS: Record<SaintWorkReadingLevel, string> = {
  beginner: 'Iniciante',
  intermediate: 'Intermediário',
  advanced: 'Avançado',
};

export type SaintWorkFichaCompleteness = 'stub' | 'minimal' | 'complete';

export const SAINT_WORK_FICHA_COMPLETENESS_LABELS: Record<SaintWorkFichaCompleteness, string> = {
  stub: 'Rascunho',
  minimal: 'Ficha mínima',
  complete: 'Ficha completa',
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
  /** Modelo de acesso ao texto. Default `internal`. */
  access_type: SaintWorkAccessType;
  /** URL canônica externa (obrigatória quando access_type != 'internal'). */
  external_url: string | null;
  /** Rótulo humano da fonte externa (ex.: "Vatican.va", "CCEL"). */
  external_source_label: string | null;
  /* --- Ficha editorial mínima (Sprint SW-1.3) --- */
  synopsis: string | null;
  historical_context: string | null;
  why_it_matters: string | null;
  main_themes: string[] | null;
  recommended_audience: string | null;
  reading_level: SaintWorkReadingLevel | null;
  editorial_closure: Record<string, unknown> | null;
  ficha_completeness: SaintWorkFichaCompleteness;
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
