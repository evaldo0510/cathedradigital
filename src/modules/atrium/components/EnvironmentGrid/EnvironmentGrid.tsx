import React from 'react';
import BlockPlaceholder from '../_BlockPlaceholder';

const ENVIRONMENTS = ['Estudar', 'Rezar', 'Formar-se', 'Pesquisar', 'Minha Jornada'];

const EnvironmentGrid: React.FC = () => (
  <BlockPlaceholder
    priority="P4"
    title="Cinco Ambientes"
    hint="Sitemap 2.0 · saídas oficiais do Átrio"
  >
    <ul className="mt-3 grid grid-cols-5 gap-2 text-[10px] text-muted-foreground">
      {ENVIRONMENTS.map((e) => (
        <li key={e} className="border border-border/60 rounded py-2 text-center">
          {e}
        </li>
      ))}
    </ul>
  </BlockPlaceholder>
);

export default EnvironmentGrid;
