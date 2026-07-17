/**
 * ReaderContent — contrato universal de conteúdo lido pelo Cathedra.
 *
 * Bíblia, Catecismo, Magistério, Padres, Santos, Concílios e Cânones
 * expõem tudo através desta shape. O `UniversalReader` (Sprint 2.0.4B-3)
 * saberá renderizar qualquer `ReaderContent` sem conhecer sua origem.
 */

import type { KnowledgeNodeId, KnowledgeNodeKind } from '@/core/knowledge';
import type { NavigationTarget } from './NavigationTarget';

/** Bloco atômico dentro do corpo de um documento. */
export interface ReaderSection {
  /** Ancoragem estável dentro do documento (ex.: "3:16", "1817"). */
  anchor?: string;
  /** Cabeçalho opcional do bloco. */
  heading?: string;
  /** Texto do bloco (texto puro; HTML sanitizado quando necessário). */
  body: string;
  /** Alvos de conhecimento citados/relacionados neste bloco. */
  crossRefs?: NavigationTarget[];
}

export interface ReaderMetadata {
  /** Autor humano (Papa, Padre, Santo, autor bíblico…). */
  author?: string;
  /** Ano ou intervalo de publicação. */
  publishedAt?: string;
  /** Nome legível da fonte primária. */
  source?: string;
  /** Referência canônica curta (ex.: "Jo 3:16", "CIC § 1817"). */
  canonicalRef?: string;
  /** Idioma do conteúdo (BCP 47). */
  language?: string;
}

export interface ReaderNavigation {
  previous?: NavigationTarget;
  next?: NavigationTarget;
  parent?: NavigationTarget;
}

export interface ReaderContent {
  /** ID canônico do nó (mesmo formato do Knowledge Engine). */
  id: KnowledgeNodeId;
  /** Natureza do conteúdo — decide o layout dentro do UniversalReader. */
  kind: KnowledgeNodeKind;
  /** Título principal exibido pelo leitor. */
  title: string;
  /** Subtítulo curto (opcional). */
  subtitle?: string;
  /** Metadados renderizados no cabeçalho e usados em compartilhamento. */
  metadata?: ReaderMetadata;
  /** Corpo do documento em ordem de leitura. */
  sections: ReaderSection[];
  /** Navegação canônica dentro da coleção (anterior/próximo/pai). */
  navigation?: ReaderNavigation;
}
