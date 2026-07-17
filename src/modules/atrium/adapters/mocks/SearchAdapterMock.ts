/**
 * SearchAdapterMock — Fase 4A.
 * Origem única: SearchRegistry (Core). Projeta SearchResult → SearchSuggestion
 * (o Átrio só exibe chips de sugestão nesta sprint; a busca por texto será
 * exposta quando o componente evoluir).
 */

import type { SearchAdapter } from '../types';
import { SearchRegistry } from '@/core/navigation';

export const SearchAdapterMock: SearchAdapter = {
  async getSuggestions() {
    return SearchRegistry.suggestions(5).map((r) => ({
      id: r.id,
      label: r.label,
      hint: r.hint,
    }));
  },
};
