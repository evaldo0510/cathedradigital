/**
 * Contratos dos adapters de conteúdo (Sprint 2.0.4B-1).
 *
 * Regras invioláveis:
 *   - Componentes NUNCA importam Supabase, fetch, React Query ou dados
 *     legados diretamente. Toda origem passa por um `ContentAdapter`.
 *   - Adapters são puros no formato de saída — devolvem `ReaderContent`
 *     e `SearchResult`, jamais shapes específicas de tabela/API.
 *   - Trocar Mock → real (Sprint 2.0.5+) não muda a assinatura.
 */

import type { KnowledgeNodeKind } from '@/core/knowledge';
import type { ReaderContent, SearchResult } from '../contracts';

/** Parâmetros genéricos usados por `ContentAdapter.get()`. */
export type ContentGetParams = Record<string, string | number>;

export interface ContentAdapter {
  /** Natureza servida por este adapter (bible, catechism, magisterium…). */
  readonly kind: KnowledgeNodeKind;
  /** Rótulo humano do adapter (para logs/dev tools). */
  readonly label: string;
  /**
   * Recupera um documento pelo conjunto de parâmetros canônicos.
   * Exemplos:
   *   BibleAdapter.get({ book: 'joao', chapter: 3 })
   *   CatechismAdapter.get({ paragraph: 1817 })
   *   MagisteriumAdapter.get({ doc: 'spe-salvi' })
   */
  get(params: ContentGetParams): Promise<ReaderContent | null>;
  /** Busca textual restrita ao domínio do adapter. */
  search(query: string, limit?: number): Promise<SearchResult[]>;
}

/** Registro único de adapters de conteúdo consumidos pelo ReaderService. */
export interface ContentAdapters {
  bible: ContentAdapter;
  catechism: ContentAdapter;
  magisterium: ContentAdapter;
}
