/**
 * Sprint B.1 · Onda B.1.1 — Fundação da Biblioteca
 *
 * `LibraryItem` é o shape universal de qualquer conteúdo listável na Biblioteca.
 * Todos os adapters (glossário, bíblia, catecismo, santos, orações, coleções,
 * jornadas, magistério, patrística, liturgia) normalizam suas linhas para este
 * tipo — assim o `LibraryCard` é o único componente de card em toda a rota.
 */

export type LibraryModule =
  | 'glossary'
  | 'bible'
  | 'catechism'
  | 'saints'
  | 'prayers'
  | 'collections'
  | 'journeys'
  | 'magisterium'
  | 'patristics'
  | 'liturgy';

/**
 * Selo editorial derivado de `editorial_completeness` (quando existe na tabela
 * de origem). Sem score numérico nesta sprint — ICE Universal entra na C0.6.
 */
export type LibraryIce = 'draft' | 'review' | 'complete';

export interface LibraryItem {
  /** ID estável dentro do módulo (slug preferido). */
  id: string;
  module: LibraryModule;
  title: string;
  /** Slug/identificador usado para montar `href`. */
  slug: string;
  /** 1-3 frases. Vazio permitido; card lida com ausência. */
  summary?: string;
  category?: string;
  /** Nomes canônicos de tema (Deus, Trindade, …). */
  themes?: string[];
  /** Selo editorial (quando aplicável). */
  ice?: LibraryIce;
  /** Nº de referências Nexus conhecidas (quando aplicável). */
  nexusCount?: number;
  /** Estimativa em minutos. */
  readingMinutes?: number;
  /** URL interna SPA. */
  href: string;
  updatedAt?: string;
}

export interface LibraryAdapterListOptions {
  limit?: number;
  offset?: number;
  filters?: {
    themes?: string[];
    category?: string;
    ice?: LibraryIce[];
  };
}

export interface LibraryAdapter {
  module: LibraryModule;
  /** Label exibido no card (ex.: "Glossário"). */
  label: string;
  list(options?: LibraryAdapterListOptions): Promise<LibraryItem[]>;
  resolveHref(item: Pick<LibraryItem, 'slug' | 'module'>): string;
}
