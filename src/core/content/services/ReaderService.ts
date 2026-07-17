/**
 * ReaderService — orquestrador único do domínio de conteúdo
 * (Sprint 2.0.4B-1).
 *
 * A partir da Sprint 2.0.4B-3, o `UniversalReader` consumirá **apenas**
 * este serviço. Ele mesmo não conhece Supabase, fetch, ou dados legados
 * — delega a um `ContentAdapter` selecionado pelo `kind` do alvo.
 */

import type { KnowledgeNodeKind } from '@/core/knowledge';
import type { ReaderContent, SearchResult } from '../contracts';
import {
  defaultContentAdapters,
  type ContentAdapter,
  type ContentAdapters,
  type ContentGetParams,
} from '../adapters';

/** Subset de `KnowledgeNodeKind` atendido pelo ReaderService nesta sprint. */
export type ReaderKind = 'bible' | 'catechism' | 'magisterium';

const READABLE_KINDS: readonly ReaderKind[] = ['bible', 'catechism', 'magisterium'] as const;

function isReaderKind(kind: KnowledgeNodeKind): kind is ReaderKind {
  return (READABLE_KINDS as readonly string[]).includes(kind);
}

function createReaderService(adapters: ContentAdapters) {
  function adapterFor(kind: ReaderKind): ContentAdapter {
    return adapters[kind];
  }

  return {
    /** Kinds atualmente atendidos pelo serviço. */
    readableKinds(): readonly ReaderKind[] {
      return READABLE_KINDS;
    },

    /** True se `kind` pode ser lido pelo ReaderService. */
    canRead(kind: KnowledgeNodeKind): kind is ReaderKind {
      return isReaderKind(kind);
    },

    /**
     * Recupera o documento canônico para um alvo de leitura.
     * Retorna `null` se o `kind` não for legível ou se o adapter não
     * encontrar o item.
     */
    async get(kind: KnowledgeNodeKind, params: ContentGetParams): Promise<ReaderContent | null> {
      if (!isReaderKind(kind)) return null;
      return adapterFor(kind).get(params);
    },

    /**
     * Busca unificada em todos os adapters registrados.
     * Resultados são achatados; `UniversalSearch` cuida da apresentação.
     */
    async search(query: string, limit = 20): Promise<SearchResult[]> {
      const q = query.trim();
      if (!q) return [];
      const perAdapter = await Promise.all(
        READABLE_KINDS.map((k) => adapterFor(k).search(q, limit)),
      );
      return perAdapter.flat().slice(0, limit);
    },

    /**
     * Busca restrita a um único adapter. Útil quando a UI já sabe o
     * domínio (ex.: barra de busca dentro do leitor do CIC).
     */
    async searchIn(kind: KnowledgeNodeKind, query: string, limit = 20): Promise<SearchResult[]> {
      if (!isReaderKind(kind)) return [];
      return adapterFor(kind).search(query, limit);
    },
  };
}

export type ReaderServiceInstance = ReturnType<typeof createReaderService>;

/** Instância default usada em produção — adapters mock nesta sprint. */
export const ReaderService: ReaderServiceInstance = createReaderService(defaultContentAdapters);

/** Fábrica para testes que precisam injetar adapters específicos. */
export function createReaderServiceWith(adapters: ContentAdapters): ReaderServiceInstance {
  return createReaderService(adapters);
}
