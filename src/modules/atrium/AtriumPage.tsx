/**
 * AtriumPage — entry point do Ambiente Átrio (Cathedra 2.0).
 *
 * Sprint 2.0.1 · Fase 1 — Estrutura.
 * Sem visual definitivo. Apenas confirma que o módulo nasceu isolado
 * e é renderizável quando (e se) for wired na Fase 6.
 *
 * Fundamentação: docs/cathedra-2.0/ATRIUM-CONTRACT.md v1.1
 */

import React from 'react';
import { useAtriumState } from './hooks';

const AtriumPage: React.FC = () => {
  const snapshot = useAtriumState();

  return (
    <main
      data-ambiente="atrio"
      data-sprint="2.0.1"
      data-fase="1-estrutura"
      className="min-h-dvh"
    >
      {/* Fase 2 renderizará aqui os 7 blocos na ordem definida por §6c. */}
      {snapshot === null ? null : null}
    </main>
  );
};

export default AtriumPage;
