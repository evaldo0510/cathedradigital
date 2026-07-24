/**
 * Biblioteca Católica — tipos unificados.
 *
 * Sprint Biblioteca Católica · Onda 1 (2026-07-24).
 * Consome a view `public.library_items_v1` e a RPC `public.search_library_items`.
 */

export type LibraryKind =
  | 'saint_work'
  | 'patristic'
  | 'doctor'
  | 'classic'
  | 'magisterium';

export const LIBRARY_KIND_LABELS: Record<LibraryKind, string> = {
  saint_work: 'Escritos dos Santos',
  patristic: 'Padres da Igreja',
  doctor: 'Doutores da Igreja',
  classic: 'Clássicos Católicos',
  magisterium: 'Magistério',
};

export const LIBRARY_KIND_DESCRIPTIONS: Record<LibraryKind, string> = {
  saint_work:
    'Obras espirituais, autobiografias e tratados de santos canonizados — a Tradição viva da Igreja em primeira pessoa.',
  patristic:
    'Padres da Igreja e monásticos — os primeiros mestres cristãos que consolidaram a fé e a exegese.',
  doctor:
    'Doutores da Igreja — teólogos e místicos reconhecidos por sua eminente sabedoria e santidade.',
  classic:
    'Clássicos católicos modernos — Newman, Chesterton, Guardini, Ratzinger e outras vozes que iluminam a fé no mundo contemporâneo.',
  magisterium:
    'Documentos do Magistério — encíclicas, exortações apostólicas, constituições conciliares e catequeses papais.',
};

export type LibraryFichaCompleteness = 'stub' | 'minimal' | 'complete';

export type LibraryAccessType = 'internal' | 'external' | 'summary_only';

export interface LibraryItem {
  library_kind: LibraryKind;
  id: string;
  slug: string;
  title: string;
  author_label: string;
  author_href: string;
  category: string;
  year: number | null;
  synopsis: string | null;
  themes: string[] | null;
  access_type: LibraryAccessType;
  cover_image_url: string | null;
  reading_minutes: number;
  chapter_count: number;
  ficha_completeness: LibraryFichaCompleteness;
  is_public_domain: boolean;
  language: string;
  href: string;
}

export interface LibraryFilter {
  query?: string;
  kinds?: LibraryKind[];
  access?: LibraryAccessType | null;
  completeness?: LibraryFichaCompleteness[];
  limit?: number;
  offset?: number;
}

export interface LibrarySearchResult {
  items: LibraryItem[];
  total: number;
}
