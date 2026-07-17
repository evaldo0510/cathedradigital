/**
 * AtriumShell — único responsável pelo layout do Ambiente Átrio.
 *
 * Regra: nenhum componente-bloco conhece grid, largura, safe-area ou espaçamento.
 * O AtriumPage entrega os blocos como children; o Shell os empilha.
 *
 * Fase 2 — Layout base. Sem estilo definitivo (isso é do Design System v2, Fase 7).
 */

import React from 'react';

interface Props {
  children: React.ReactNode;
}

const AtriumShell: React.FC<Props> = ({ children }) => {
  return (
    <div
      data-shell="atrium"
      className="min-h-dvh bg-background text-foreground pb-[env(safe-area-inset-bottom)]"
    >
      <div className="max-w-2xl mx-auto w-full px-4 flex flex-col gap-4 pb-16">
        {children}
      </div>
    </div>
  );
};

export default AtriumShell;
