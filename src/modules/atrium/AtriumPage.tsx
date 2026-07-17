/**
 * AtriumPage — orquestrador do Ambiente Átrio.
 *
 * Responsabilidades:
 *   1. Ler perfil via useAtriumProfile (adapter mockado na Fase 3, real na 2.0.6).
 *   2. Pedir a composição para `composition.ts`.
 *   3. Entregar a lista ao `AtriumShell`.
 *
 * NÃO conhece: CSS, layout, dados de bloco, infraestrutura.
 *
 * Fundamentação: docs/cathedra-2.0/ATRIUM-CONTRACT.md v1.1
 */

import React from 'react';
import AtriumShell from './AtriumShell';
import { AtriumHeader, resolveComposition } from './composition';
import { useAtriumProfile } from './hooks';

const AtriumPage: React.FC = () => {
  const user = useAtriumProfile();
  const blocks = resolveComposition(user.profile);

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
