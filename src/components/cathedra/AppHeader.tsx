import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { AppRoute } from '@/types';
import { Icons, Logo } from '@/constants';

interface AppHeaderProps {
  user: any;
  isDark: boolean;
  onToggleDark: () => void;
  onSignOut: () => void;
  onOpenSidebar: () => void;
}

const AppHeader: React.FC<AppHeaderProps> = React.memo(({
  user, isDark, onToggleDark, onSignOut, onOpenSidebar
}) => {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const isDashboard = pathname === AppRoute.DASHBOARD;

  return (
    <header className="p-3 md:p-4 border-b border-border bg-card/90 backdrop-blur-2xl flex items-center justify-between sticky top-0 z-[140]">
      <div className="flex items-center gap-2">
        {!isDashboard ? (
          <button onClick={() => navigate(-1)} className="p-3 bg-foreground text-primary rounded-2xl flex items-center gap-2 pr-5 shadow-xl">
            <Icons.ArrowDown className="w-5 h-5 rotate-90" />
            <span className="text-[10px] font-black uppercase tracking-widest">Voltar</span>
          </button>
        ) : (
          <button onClick={onOpenSidebar} className="lg:hidden p-3 text-foreground">
            <Icons.Menu className="w-6 h-6" />
          </button>
        )}
        {isDashboard && (
          <div className="flex items-center gap-3 ml-2 cursor-pointer" onClick={() => navigate(AppRoute.DASHBOARD)}>
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
});

AppHeader.displayName = 'AppHeader';

export default AppHeader;
