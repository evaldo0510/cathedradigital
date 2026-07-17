import React from 'react';
import { Search, RotateCcw, User } from 'lucide-react';
import { useAtriumProfile, useLiturgyToday } from '../../hooks';

const Header: React.FC = () => {
  const user = useAtriumProfile();
  const liturgy = useLiturgyToday();

  return (
    <header
      data-atrium-block="HEADER"
      className="pt-6 pb-2 flex flex-col gap-2"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-baseline gap-2">
          <span className="text-lg font-serif tracking-tight">Cathedra</span>
          <span className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">2.0</span>
        </div>
        <div className="flex items-center gap-1 text-muted-foreground">
          <button
            aria-label="Buscar"
            className="inline-flex items-center justify-center min-h-11 min-w-11 rounded-md hover:bg-muted transition"
          >
            <Search aria-hidden="true" className="w-4 h-4" />
          </button>
          <button
            aria-label="Retomar"
            className="inline-flex items-center justify-center min-h-11 min-w-11 rounded-md hover:bg-muted transition"
          >
            <RotateCcw aria-hidden="true" className="w-4 h-4" />
          </button>
          <button
            aria-label="Perfil"
            className="inline-flex items-center justify-center min-h-11 min-w-11 rounded-md hover:bg-muted transition"
          >
            <User aria-hidden="true" className="w-4 h-4" />
          </button>
        </div>
      </div>
      <p className="text-xs text-muted-foreground">
        {liturgy
          ? <>Hoje · {liturgy.season} · {liturgy.weekday}{liturgy.saintOfDay ? ` · ${liturgy.saintOfDay.name}` : ''}</>
          : <>Hoje</>}
        {user.displayName && <> · <span className="text-foreground/80">{user.displayName}</span></>}
      </p>
    </header>
  );
};

export default Header;
