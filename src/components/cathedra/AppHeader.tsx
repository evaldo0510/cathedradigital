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
    <header className="px-3 py-2 md:p-4 border-b border-border/10 bg-background/60 backdrop-blur-3xl flex items-center justify-between sticky top-0 z-[140] shadow-sm safe-area-top">
      <div className="flex items-center gap-2">
        {!isDashboard ? (
          <button 
            onClick={() => navigate(-1)} 
            className="p-2 sm:p-3 bg-foreground text-primary rounded-2xl flex items-center gap-2 pr-4 sm:pr-5 shadow-xl active:scale-95 transition-transform"
          >
            <Icons.ArrowDown className="w-4 h-4 sm:w-5 sm:h-5 rotate-90" />
            <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest">Voltar</span>
          </button>
        ) : (
          <button 
            onClick={onOpenSidebar} 
            className="lg:hidden p-2 text-foreground active:bg-muted rounded-full transition-colors"
          >
            <Icons.Menu className="w-6 h-6" />
          </button>
        )}
        {isDashboard && (
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-3 ml-2 cursor-pointer group" onClick={() => navigate(AppRoute.DASHBOARD)}>
              <Logo className="w-9 h-9" />
              <span className="text-sm font-serif font-black uppercase tracking-[0.2em] text-foreground group-hover:text-primary transition-colors">Cathedra</span>
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
        {/* Notifications removed for now */}
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
