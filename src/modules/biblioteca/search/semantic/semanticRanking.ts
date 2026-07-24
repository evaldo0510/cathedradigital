/**
 * Sprint B.1 · Onda B.1.4 — Semantic ranking helpers.
 *
 * Infere `formationLevel` a partir do tipo/metadados do item — usado depois
 * pela Catequese (Sprint K) para montar trilhas iniciante → avançado sem
 * novos campos no banco.
 */
import type { LibraryResult } from '../types';

export type FormationLevel = 'fundamental' | 'intermediate' | 'advanced';

export function inferFormationLevel(result: LibraryResult): FormationLevel {
  switch (result.type) {
    case 'glossary':
    case 'bible':
    case 'prayers':
      return 'fundamental';
    case 'catechism': {
      const n = Number(result.id);
      if (Number.isFinite(n)) {
        if (n <= 1065) return 'fundamental'; // Credo — parte I
        if (n <= 2557) return 'intermediate'; // Sacramentos + Vida em Cristo
      }
      return 'intermediate';
    }
    case 'saints':
    case 'collections':
    case 'journeys':
    case 'liturgy':
      return 'intermediate';
    case 'magisterium':
    case 'patristics':
      return 'advanced';
    default:
      return 'intermediate';
  }
}
