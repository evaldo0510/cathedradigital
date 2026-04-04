import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { AppRoute } from '@/types';
import { Icons, Logo } from '@/constants';
import { useNotifications } from '@/hooks/useNotifications';

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
  const { notifications, unreadCount, markAsRead, markAllRead } = useNotifications();
  const [showNotifs, setShowNotifs] = useState(false);

  return (
    <header className="px-4 py-3 md:px-12 md:py-6 border-b border-border/5 bg-background/40 backdrop-blur-2xl flex items-center justify-between sticky top-0 z-[140] safe-area-top transition-all hover:bg-background/60">
      <div className="flex items-center gap-4">
        {!isDashboard ? (
          <button 
            onClick={() => navigate(-1)} 
            className="p-3 bg-foreground text-background rounded-full flex items-center gap-3 px-6 shadow-2xl active:scale-95 transition-all hover:bg-primary hover:text-primary-foreground group"
          >
            <Icons.ArrowDown className="w-4 h-4 rotate-90 group-hover:-translate-x-1 transition-transform" />
            <span className="text-[10px] font-black uppercase tracking-widest">Retornar</span>
          </button>
        ) : (
          <button 
            onClick={onOpenSidebar} 
            className="lg:hidden p-3 bg-muted text-foreground active:bg-primary rounded-full transition-all hover:scale-110"
          >
            <Icons.Menu className="w-6 h-6" />
          </button>
        )}
        {isDashboard && (
          <div className="flex items-center gap-10">
            <div className="flex items-center gap-3 ml-2 cursor-pointer group" onClick={() => navigate(AppRoute.DASHBOARD)}>
              <div className="p-1.5 bg-primary/10 rounded-xl group-hover:bg-primary/20 transition-all group-hover:scale-110">
                <Logo className="w-8 h-8" />
              </div>
              <span className="text-xl md:text-2xl font-serif font-black uppercase tracking-[0.25em] text-foreground group-hover:text-primary transition-all">Cathedra</span>
            </div>
            
            <nav className="hidden xl:flex items-center gap-6 border-l border-border pl-6">
              {[
                { label: 'Bíblia', route: AppRoute.BIBLE },
                { label: 'Catecismo', route: AppRoute.CATECHISM },
                { label: 'Liturgia', route: AppRoute.DAILY_LITURGY },
                { label: 'Colloquium IA', route: AppRoute.STUDY_MODE },
              ].map(item => (
                <button 
                  key={item.label} 
                  onClick={() => navigate(item.route)}
                  onMouseEnter={() => {
                    if (item.route === AppRoute.CATECHISM) {
                      import('@/components/cathedra/Catechism');
                    } else if (item.route === AppRoute.BIBLE) {
                      import('@/components/cathedra/Bible');
                    }
                  }}
                  className="text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:text-primary transition-all"
                >
                  {item.label}
                </button>
              ))}
            </nav>
          </div>
        )}
      </div>
      <div className="flex items-center gap-3">
        {/* Search Bar - Hidden on mobile, shown as icon on tablet, full on desktop */}
        <div className="hidden sm:flex items-center gap-2 px-4 py-2 bg-muted border border-border rounded-xl text-muted-foreground hover:border-primary/50 transition-all cursor-pointer group" onClick={() => (window as any).dispatchEvent(new CustomEvent('open-command-center'))}>
          <Icons.Search className="w-4 h-4 group-hover:text-primary transition-colors" />
          <span className="text-[10px] font-bold uppercase tracking-widest hidden lg:inline">Buscar Conteúdo...</span>
          <kbd className="hidden lg:inline-flex px-1.5 py-0.5 rounded bg-background border border-border text-[9px] font-mono font-bold">⌘K</kbd>
        </div>
        
        {/* Mobile Search Icon */}
        <button className="sm:hidden p-3 bg-muted text-muted-foreground rounded-2xl border border-border" onClick={() => (window as any).dispatchEvent(new CustomEvent('open-command-center'))}>
          <Icons.Search className="w-5 h-5" />
        </button>

        {/* Notification bell */}
        {user && (
          <button 
            onClick={() => setShowNotifs(!showNotifs)} 
            className="p-3 bg-muted text-muted-foreground hover:text-primary rounded-2xl border border-border relative transition-all"
          >
            <Icons.Message className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-primary text-primary-foreground text-[10px] font-black flex items-center justify-center rounded-full border-2 border-background animate-pulse">
                {unreadCount}
              </span>
            )}
          </button>
        )}
        {user ? (
          <button onClick={onSignOut} className="px-3 py-2 text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:text-foreground transition-all flex items-center gap-2">
            <span className="hidden sm:inline">Sair</span>
            <Icons.History className="w-4 h-4 sm:hidden" />
          </button>
        ) : (
          <button onClick={() => navigate(AppRoute.LOGIN)} className="px-4 py-2 bg-primary text-primary-foreground rounded-xl text-[10px] font-black uppercase tracking-widest hover:opacity-90 transition-all shadow-lg shadow-primary/20">
            Entrar
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
