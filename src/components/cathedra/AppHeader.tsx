import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { AppRoute } from '@/types';
import { Icons } from '@/constants';
import cathedraLogo from '@/assets/cathedra-logo.png';
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
    <header className="border-b border-border bg-background/90 backdrop-blur-xl sticky top-0 z-[140] transition-all pt-[env(safe-area-inset-top,0px)]">
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 md:px-8 lg:px-12 py-3 sm:py-4 flex items-center justify-between min-h-[56px] sm:min-h-[64px]">
        <div className="flex items-center gap-2 sm:gap-10">
        <div className="flex items-center gap-2 sm:gap-4 cursor-pointer group" onClick={() => navigate(AppRoute.DASHBOARD)}>
          <div className="flex flex-col">
            <span className="text-base sm:text-xl font-display font-black uppercase tracking-[0.2em] sm:tracking-[0.25em] text-primary leading-none">Cathedra</span>
            <span className="text-[8px] sm:text-[10px] font-bold uppercase tracking-[0.2em] sm:tracking-[0.3em] text-secondary opacity-80 mt-0.5 sm:mt-1">Digital</span>
          </div>
        </div>
        
        {!isDashboard && (
          <button 
            onClick={() => navigate(-1)} 
            className="p-2 sm:p-2.5 bg-muted text-primary border border-border rounded-xl flex items-center gap-2 px-3 sm:px-5 active:scale-95 transition-all hover:bg-primary hover:text-white group shadow-sm"
          >
            <Icons.ChevronLeft className="w-4 h-4 transition-transform group-hover:-translate-x-0.5" />
            <span className="text-[10px] font-black uppercase tracking-widest hidden sm:inline-block">Voltar</span>
          </button>
        )}

        {isDashboard && (
          <nav className="hidden xl:flex items-center gap-6 border-l border-border pl-8 ml-2">
            {[
              { label: 'Início', route: AppRoute.HOJE },
              { label: 'Jornada', route: AppRoute.JORNADAS },
              { label: 'Explorar', route: AppRoute.BIBLIOTECA },
              { label: 'Temas', route: AppRoute.TEMAS },
              { label: 'Comunidade', route: AppRoute.COMMUNITY },
              { label: 'Perfil', route: AppRoute.PROFILE },
            ].map(item => (

              <button 
                key={item.label} 
                onClick={() => navigate(item.route)}
                className={`text-[10px] font-black uppercase tracking-[0.2em] transition-all whitespace-nowrap relative group ${
                  pathname === item.route ? 'text-primary' : 'text-muted-foreground hover:text-primary'
                }`}
              >
                {item.label}
                <span className={`absolute -bottom-1 left-0 h-0.5 bg-primary transition-all ${pathname === item.route ? 'w-full' : 'w-0 group-hover:w-full'}`} />
              </button>
            ))}
          </nav>
        )}
      </div>

      <div className="flex items-center gap-1.5 sm:gap-4 flex-shrink-0">
        <button className="p-2.5 sm:p-3 bg-muted text-primary rounded-xl sm:rounded-2xl border border-border hover:bg-primary hover:text-white transition-all shadow-sm active:scale-95" onClick={() => (window as any).dispatchEvent(new CustomEvent('open-command-center'))}>
          <Icons.Search className="w-4.5 h-4.5 sm:w-5 sm:h-5" />
        </button>

        {user && (
          <button 
            onClick={() => setShowNotifs(!showNotifs)} 
            className="p-2.5 sm:p-3 bg-muted text-primary hover:bg-primary hover:text-white rounded-xl sm:rounded-2xl border border-border relative transition-all shadow-sm active:scale-95"
          >
            <Icons.Message className="w-4.5 h-4.5 sm:w-5 sm:h-5" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-secondary text-primary text-[10px] font-black flex items-center justify-center rounded-full border-2 border-background shadow-lg">
                {unreadCount}
              </span>
            )}
          </button>
        )}
        
        {showNotifs && user && (
          <div className="absolute top-full right-4 mt-4 w-80 bg-card border border-border rounded-3xl shadow-2xl z-[150] overflow-hidden animate-in fade-in zoom-in duration-300">
            <div className="p-5 border-b border-border flex items-center justify-between bg-muted/30">
              <h3 className="text-[10px] font-black uppercase tracking-widest text-primary">Notificações</h3>
              <button onClick={markAllRead} className="text-[10px] font-black uppercase tracking-widest text-secondary hover:opacity-70">Limpar</button>
            </div>
            <div className="max-h-[60vh] overflow-y-auto custom-scrollbar">
              {notifications.length > 0 ? (
                notifications.map((n) => (
                  <div 
                    key={n.id} 
                    className={`p-5 border-b border-border/50 hover:bg-muted/50 transition-colors cursor-pointer ${!n.is_read ? 'bg-primary/5' : ''}`}
                    onClick={() => markAsRead(n.id)}
                  >
                    <p className="text-xs font-bold text-primary mb-1">{n.title}</p>
                    <p className="text-[11px] text-muted-foreground leading-relaxed">{n.message}</p>
                  </div>
                ))
              ) : (
                <div className="p-12 text-center">
                  <Icons.Message className="w-10 h-10 text-muted-foreground/20 mx-auto mb-4" />
                  <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/40">Silêncio</p>
                </div>
              )}
            </div>
          </div>
        )}

        {user && user.role === 'admin' && (
          <button 
            onClick={() => navigate(AppRoute.ADMIN)} 
            className="hidden sm:flex px-4 py-2.5 text-[10px] font-black uppercase tracking-widest text-primary hover:bg-primary hover:text-white transition-all items-center gap-2 bg-secondary/20 rounded-xl border border-secondary/30 shadow-sm"
          >
            <Icons.Star className="w-4 h-4" />
            <span>Admin</span>
          </button>
        )}

        {user ? (
          <button onClick={onSignOut} className="px-4 py-2.5 text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:text-primary transition-all">
            Sair
          </button>
        ) : (
          <button onClick={() => navigate(AppRoute.LOGIN)} className="px-4 sm:px-6 py-2 sm:py-2.5 bg-primary text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:opacity-90 transition-all shadow-lg shadow-primary/20 active:scale-95">
            Entrar
          </button>
        )}

        <button onClick={onToggleDark} className="p-2.5 sm:p-3 bg-muted text-primary hover:bg-primary hover:text-white rounded-xl sm:rounded-2xl border border-border transition-all active:scale-95 shadow-sm">
          {isDark ? <Icons.Sun className="w-4.5 h-4.5 sm:w-5 sm:h-5" /> : <Icons.Moon className="w-4.5 h-4.5 sm:w-5 sm:h-5" />}
        </button>
      </div>
      </div>
    </header>
  );
});

AppHeader.displayName = 'AppHeader';

export default AppHeader;
