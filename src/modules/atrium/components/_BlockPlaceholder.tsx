/**
 * Placeholder padrão de bloco do Átrio (Fase 2).
 * Um único componente visual, reutilizado por todos os blocos vazios.
 * Sai completamente na Fase 3, quando cada bloco recebe conteúdo real.
 */

import React from 'react';

interface Props {
  priority: 'P0' | 'P1' | 'P2' | 'P3' | 'P4' | 'P5' | 'P6' | 'HEADER';
  title: string;
  hint?: string;
  children?: React.ReactNode;
}

const BlockPlaceholder: React.FC<Props> = ({ priority, title, hint, children }) => {
  return (
    <section
      data-atrium-block={priority}
      className="border border-dashed border-border/70 rounded-md p-4"
    >
      <header className="flex items-baseline justify-between mb-2">
        <span className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground">
          {priority}
        </span>
        <span className="text-sm font-medium">{title}</span>
      </header>
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
      {children}
    </section>
  );
};

export default BlockPlaceholder;
