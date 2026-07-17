import React from 'react';
import { BookOpen, HandHeart, GraduationCap, SearchCode, Compass } from 'lucide-react';
import { ENVIRONMENT_ROUTES } from '../../constants';
import type { AtriumExit } from '../../types';

const ITEMS: { key: AtriumExit; label: string; Icon: React.ComponentType<{ className?: string }> }[] = [
  { key: 'estudar',       label: 'Estudar',        Icon: BookOpen },
  { key: 'rezar',         label: 'Rezar',          Icon: HandHeart },
  { key: 'formar-se',     label: 'Formar-se',      Icon: GraduationCap },
  { key: 'pesquisar',     label: 'Pesquisar',      Icon: SearchCode },
  { key: 'minha-jornada', label: 'Minha Jornada',  Icon: Compass },
];

const EnvironmentGrid: React.FC = () => {
  return (
    <section data-atrium-block="P4" aria-labelledby="atrium-envs">
      <h2 id="atrium-envs" className="text-xs uppercase tracking-[0.2em] text-muted-foreground mb-2">
        Ambientes
      </h2>
      <ul className="grid grid-cols-3 gap-2">
        {ITEMS.map(({ key, label, Icon }) => (
          <li key={key}>
            <a
              href={ENVIRONMENT_ROUTES[key]}
              className="flex flex-col items-center justify-center gap-1.5 p-3 rounded-md border border-border hover:bg-muted transition aspect-square"
            >
              <Icon className="w-5 h-5" />
              <span className="text-xs">{label}</span>
            </a>
          </li>
        ))}
      </ul>
    </section>
  );
};

export default EnvironmentGrid;
