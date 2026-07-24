/**
 * Sprint B.1 · Onda B.1.2 — Contratos da Busca Unificada.
 *
 * `LibraryResult` é o shape ÚNICO que a UI da Biblioteca consome. Todos os
 * searchers de módulo normalizam para este tipo e o `LibraryCard` renderiza
 * qualquer item sem ifs específicos.
 */
import type { LucideIcon } from 'lucide-react';
import type { LibraryIce, LibraryModule } from '../types';

export interface LibraryResult {
  type: LibraryModule;
  id: string;
  title: string;
  subtitle?: string;
  excerpt?: string;

  /** 0-100 (opcional). Usado no ranking e no `IceBadge`. */
  ice?: number;
  editorialStatus?: LibraryIce;

  /** URL SPA absoluta (`/glossario/...`). */
  href: string;

  /** Ícone canônico do módulo (Lucide). */
  icon: LucideIcon;

  /** Nexus relacionados (preenchido pelo enricher). */
  nexus?: {
    total: number;
    byKind: Partial<Record<LibraryModule, number>>;
  };

  /** Score final composto (relevância + doutrina + ICE + nexus). */
  score: number;

  /** Relevância textual bruta (0-100), usada em diagnóstico. */
  textRelevance?: number;

  /** Estimativa de leitura em minutos (quando disponível). */
  readingMinutes?: number;

  // ── Campos AI-ready (B.1.4). Preenchidos pelo semantic adapter. ──
  /** Similaridade semântica (0-1) vinda do adapter MCP/embeddings. */
  semanticScore?: number;
  /** Justificativa curta ("Aparece em §§ 232-267 do CIC"). */
  reason?: string;
  /** Conceitos teológicos detectados no match. */
  matchedConcepts?: string[];
  /** Sinônimos/aliases da entidade. */
  aliases?: string[];
  /** Nível de formação sugerido (usado pela Catequese na Sprint K). */
  formationLevel?: 'fundamental' | 'intermediate' | 'advanced';
}


export interface LibrarySearchOptions {
  query: string;
  /** Se vazio ou "all", pesquisa todos os módulos. */
  types?: LibraryModule[] | 'all';
  /** Máx. de resultados por módulo antes da fusão. */
  perModule?: number;
  /** Se true, enriquece cada resultado com nexus_relations. */
  withNexus?: boolean;
}

export interface LibrarySearchResponse {
  query: string;
  results: LibraryResult[];
  countsByType: Partial<Record<LibraryModule, number>>;
  totalFound: number;
  durationMs: number;
}
