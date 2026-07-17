/**
 * Hooks do Ambiente Átrio.
 * Fase 1: apenas o esqueleto. Estados reais e integração vêm nas Fases 4 e 6.
 */

import { useMemo } from 'react';
import type { AtriumSnapshot } from '../types';

/**
 * Fonte única de estado para o AtriumPage.
 * Fase 1: retorna null (nada renderizado ainda além do esqueleto).
 * Fase 4: retornará snapshot mockado por estado.
 * Fase 6: consumirá `AtriumService`.
 */
export function useAtriumState(): AtriumSnapshot | null {
  return useMemo(() => null, []);
}
