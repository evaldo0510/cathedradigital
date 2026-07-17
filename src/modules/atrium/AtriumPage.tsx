/**
 * AtriumPage — orquestrador do Ambiente Átrio.
 *
 * Responsabilidades:
 *   1. Ler perfil (mock na Fase 2 · real na Fase 6).
 *   2. Pedir a composição para `composition.ts`.
 *   3. Entregar a lista ao `AtriumShell`.
 *
 * NÃO conhece: CSS, layout, ordem de blocos, dados de bloco.
 *
 * Fundamentação: docs/cathedra-2.0/ATRIUM-CONTRACT.md v1.1
 */

import React from 'react';
import AtriumShell from './AtriumShell';
import { AtriumHeader, resolveComposition } from './composition';
import type { AtriumProfile } from './types';

const AtriumPage: React.FC = () => {
  // Fase 2: perfil fixo em "recurrent" (padrão do contrato §6b para autenticados sem declaração).
  // Fase 4: virá do useAtriumProfile mockado por estado.
  // Fase 6: virá do ProfileProvider.
  const profile: AtriumProfile = 'recurrent';
  const blocks = resolveComposition(profile);

  return (
    <AtriumShell>
      <AtriumHeader />
      {blocks.map((Block, i) => (
        <Block key={i} />
      ))}
    </AtriumShell>
  );
};

export default AtriumPage;
