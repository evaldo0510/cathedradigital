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
    <header className="p-3 md:p-4 border-b border-border bg-black/90 backdrop-blur-2xl flex items-center justify-between sticky top-0 z-[140]">
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
          <div className="relative">
            <button onClick={() => setShowNotifs(!showNotifs)} className="p-3 bg-muted text-muted-foreground hover:text-primary rounded-2xl border border-border relative">
              <Icons.Message className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-primary text-primary-foreground text-[9px] font-black flex items-center justify-center">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>

            {/* Dropdown */}
            {showNotifs && (
              <>
                <div className="fixed inset-0 z-[139]" onClick={() => setShowNotifs(false)} />
                <div className="absolute right-0 top-full mt-2 w-80 bg-card border border-border rounded-2xl shadow-2xl overflow-hidden z-[140]">
                  <div className="flex items-center justify-between px-4 py-3 border-b border-border">
                    <h3 className="text-xs font-black uppercase tracking-widest text-foreground">Notificações</h3>
                    {unreadCount > 0 && (
                      <button onClick={markAllRead} className="text-[9px] font-bold text-primary hover:underline">
                        Marcar todas como lidas
                      </button>
                    )}
                  </div>
                  <div className="max-h-80 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <p className="text-center text-sm text-muted-foreground py-8 italic">Nenhuma notificação.</p>
                    ) : (
                      notifications.map(n => (
                        <button
                          key={n.id}
                          onClick={() => {
                            markAsRead(n.id);
                            if (n.link) navigate(n.link);
                            setShowNotifs(false);
                          }}
                          className={`w-full text-left px-4 py-3 border-b border-border/50 transition-colors hover:bg-muted ${
                            !n.is_read ? 'bg-primary/5' : ''
                          }`}
                        >
                          <div className="flex items-start gap-2">
                            {!n.is_read && <div className="w-2 h-2 rounded-full bg-primary mt-1.5 shrink-0" />}
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-bold text-foreground truncate">{n.title}</p>
                              <p className="text-[10px] text-muted-foreground line-clamp-2">{n.message}</p>
                              <p className="text-[9px] text-muted-foreground mt-1">
                                {new Date(n.created_at).toLocaleDateString('pt-BR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                              </p>
                            </div>
                          </div>
                        </button>
                      ))
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        )}
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
