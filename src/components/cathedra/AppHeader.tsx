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
  const isMainPage = [
    AppRoute.DASHBOARD,
    AppRoute.HOME,
    AppRoute.HOJE,
    AppRoute.JORNADAS,
    AppRoute.BIBLIOTECA,
    AppRoute.PROFILE,
    AppRoute.LITURGIA
  ].includes(pathname as AppRoute);
  const isDashboard = isMainPage;
  const { notifications, unreadCount, markAsRead, markAllRead } = useNotifications();
  const [showNotifs, setShowNotifs] = useState(false);

  return (
    <header className="px-4 py-2.5 sm:px-6 md:py-3.5 border-b border-border/5 bg-background/60 backdrop-blur-3xl flex items-center justify-between sticky top-0 z-[140] safe-area-top transition-all hover:bg-background/80 gap-3">
      <div className="flex items-center gap-4">
        {!isDashboard ? (
          <button 
            onClick={() => navigate(-1)} 
            className="p-1.5 sm:p-2 bg-background/50 backdrop-blur-xl text-foreground/80 border border-border/10 rounded-xl flex items-center gap-2 px-3 sm:px-4 shadow-[0_4px_12px_-2px_rgba(0,0,0,0.05)] active:scale-95 transition-all hover:bg-primary/10 hover:text-primary hover:border-primary/20 group hover:shadow-md"
          >
            <Icons.ChevronLeft className="w-5 h-5 group-hover:-translate-x-0.5 transition-transform" />
            <span className="text-[11px] sm:text-xs font-bold uppercase tracking-widest">Voltar</span>
          </button>
        ) : (
          <button 
            onClick={onOpenSidebar} 
            className="p-3 bg-muted text-foreground active:bg-primary rounded-full transition-all hover:scale-110 lg:hidden"
          >
            <Icons.Menu className="w-6 h-6" />
          </button>
        )}
        {isDashboard && (
          <div className="flex items-center gap-10">
            <div className="flex items-center gap-2 sm:gap-3 ml-1 sm:ml-2 cursor-pointer group" onClick={() => navigate(AppRoute.DASHBOARD)}>
              <div className="p-1.5 sm:p-2 bg-primary/5 rounded-2xl group-hover:bg-primary/15 transition-all group-hover:scale-110 group-hover:rotate-6 border border-primary/10">
                <Logo className="w-8 h-8 sm:w-10 sm:h-10" />
              </div>
              <span className="text-base sm:text-lg md:text-xl font-display font-black uppercase tracking-[0.2em] sm:tracking-[0.25em] text-foreground group-hover:text-primary transition-all">Cathedra</span>
            </div>
            
            <nav className="hidden xl:flex items-center gap-4 2xl:gap-6 border-l border-border pl-4 2xl:pl-6">
              {[
                { label: 'Bíblia', route: AppRoute.BIBLE },
                { label: 'Catecismo', route: AppRoute.CATECHISM },
                { label: 'Liturgia', route: AppRoute.LITURGIA },
                { label: 'Colloquium', route: AppRoute.STUDY_MODE },
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
                  className="text-[11px] font-black uppercase tracking-wider text-muted-foreground hover:text-primary transition-all whitespace-nowrap"
                >
                  {item.label}
                </button>
              ))}
            </nav>
          </div>
        )}
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        {/* Search Bar - Hidden on mobile, shown as icon on tablet, full on desktop */}
        <div className="hidden sm:flex items-center gap-2 px-3 py-2 bg-muted border border-border rounded-xl text-muted-foreground hover:border-primary/50 transition-all cursor-pointer group" onClick={() => (window as any).dispatchEvent(new CustomEvent('open-command-center'))}>
          <Icons.Search className="w-4 h-4 group-hover:text-primary transition-colors" />
          <span className="text-xs font-bold uppercase tracking-wider hidden lg:inline whitespace-nowrap">Buscar...</span>
          <kbd className="hidden lg:inline-flex px-1.5 py-0.5 rounded bg-background border border-border text-[10px] font-mono font-bold">⌘K</kbd>
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
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-primary text-primary-foreground text-xs font-black flex items-center justify-center rounded-full border-2 border-background animate-pulse">
                {unreadCount}
              </span>
            )}
          </button>
        )}
        
        {/* Notification Popover */}
        {showNotifs && user && (
          <div className="absolute top-full right-4 mt-2 w-80 bg-card border border-border rounded-3xl shadow-2xl z-[150] overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-4 border-b border-border flex items-center justify-between">
              <h3 className="text-xs font-black uppercase tracking-widest text-foreground">Notificações</h3>
              <button onClick={markAllRead} className="text-xs font-black uppercase tracking-widest text-primary hover:opacity-70">Marcar tudo como lido</button>
            </div>
            <div className="max-h-[60vh] overflow-y-auto custom-scrollbar">
              {notifications.length > 0 ? (
                notifications.map((n) => (
                  <div 
                    key={n.id} 
                    className={`p-4 border-b border-border/50 hover:bg-muted/50 transition-colors cursor-pointer ${!n.is_read ? 'bg-primary/5' : ''}`}
                    onClick={() => markAsRead(n.id)}
                  >
                    <p className="text-xs font-semibold text-foreground mb-1">{n.title}</p>
                    <p className="text-xs text-muted-foreground leading-relaxed">{n.message}</p>
                  </div>
                ))
              ) : (
                <div className="p-10 text-center">
                  <Icons.Message className="w-8 h-8 text-muted-foreground/20 mx-auto mb-3" />
                  <p className="text-xs font-black uppercase tracking-widest text-muted-foreground/40">Nenhuma notificação</p>
                </div>
              )}
            </div>
          </div>
        )}
        {user && user.role === 'admin' && (
          <button 
            onClick={() => navigate(AppRoute.ADMIN)} 
            className="flex px-3 py-2 text-[10px] sm:text-xs font-black uppercase tracking-widest text-primary hover:text-primary/80 transition-all items-center gap-2 bg-primary/10 rounded-xl border border-primary/20"
          >
            <Icons.Star className="w-4 h-4" />
            <span>Admin</span>
          </button>
        )}
        {user ? (
          <button onClick={onSignOut} className="hidden sm:flex px-3 py-2 text-xs font-black uppercase tracking-widest text-muted-foreground hover:text-foreground transition-all items-center gap-2">
            <span>Sair</span>
          </button>
        ) : (
          <button onClick={() => navigate(AppRoute.LOGIN)} className="px-4 py-2 bg-primary text-primary-foreground rounded-xl text-xs font-black uppercase tracking-widest hover:opacity-90 transition-all shadow-lg shadow-primary/20">
            Entrar
          </button>
        )}
        <button onClick={onToggleDark} className="hidden sm:flex p-3 bg-muted text-muted-foreground hover:text-primary rounded-2xl border border-border">
          {isDark ? <Icons.Star className="w-5 h-5 text-primary fill-current animate-pulse" /> : <Icons.History className="w-5 h-5" />}
        </button>
      </div>
    </header>
  );
});

AppHeader.displayName = 'AppHeader';

export default AppHeader;
