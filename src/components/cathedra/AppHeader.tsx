import React from 'react';
import { AppRoute } from '@/types';
import { Icons, Logo } from '@/constants';

interface AppHeaderProps {
  route: AppRoute;
  user: any;
  isDark: boolean;
  onToggleDark: () => void;
  onBack: () => void;
  onOpenSidebar: () => void;
  onNavigate: (r: AppRoute) => void;
  onSignOut: () => void;
}

const AppHeader: React.FC<AppHeaderProps> = ({
  route, user, isDark, onToggleDark, onBack, onOpenSidebar, onNavigate, onSignOut
}) => (
  <header className="p-3 md:p-4 border-b border-border bg-card/90 backdrop-blur-2xl flex items-center justify-between sticky top-0 z-[140]">
    <div className="flex items-center gap-2">
      {route !== AppRoute.DASHBOARD ? (
        <button onClick={onBack} className="p-3 bg-foreground text-primary rounded-2xl flex items-center gap-2 pr-5 shadow-xl">
          <Icons.ArrowDown className="w-5 h-5 rotate-90" />
          <span className="text-[10px] font-black uppercase tracking-widest">Voltar</span>
        </button>
      ) : (
        <button onClick={onOpenSidebar} className="lg:hidden p-3 text-foreground">
          <Icons.Menu className="w-6 h-6" />
        </button>
      )}
      {route === AppRoute.DASHBOARD && (
        <div className="flex items-center gap-3 ml-2 cursor-pointer" onClick={() => onNavigate(AppRoute.DASHBOARD)}>
          <Logo className="w-9 h-9" />
          <span className="text-sm font-serif font-black uppercase tracking-[0.2em] text-foreground">Cathedra</span>
        </div>
      )}
    </div>
    <div className="flex items-center gap-2">
      {user && (
        <button onClick={onSignOut} className="px-3 py-2 text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:text-foreground transition-all">
          Sair
        </button>
      )}
      <button onClick={onToggleDark} className="p-3 bg-muted text-muted-foreground hover:text-primary rounded-2xl border border-border">
        {isDark ? <Icons.Star className="w-5 h-5 text-primary fill-current" /> : <Icons.History className="w-5 h-5" />}
      </button>
    </div>
  </header>
);

export default AppHeader;
