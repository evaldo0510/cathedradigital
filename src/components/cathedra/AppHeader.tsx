import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { AppRoute, Language } from '@/types';
import { Icons } from '@/constants';

import { useNotifications } from '@/hooks/useNotifications';
import { useLang } from '@/hooks/useLang';

interface AppHeaderProps {
  user: any;
  isDark: boolean;
  onToggleDark: () => void;
  lang: Language;
  onChangeLang: (lang: Language) => void;
  isSpeaking?: boolean;
  onToggleSpeak?: () => void;
  onSignOut: () => void;
  onOpenSidebar: () => void;
}

const AppHeader: React.FC<AppHeaderProps> = React.memo(({
  user, isDark, onToggleDark, lang, onChangeLang, isSpeaking, onToggleSpeak, onSignOut, onOpenSidebar
}) => {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { t } = useLang();
  
  const isMainPage = [
    AppRoute.DASHBOARD,
    AppRoute.HOJE,
    AppRoute.JORNADAS,
    AppRoute.BIBLIOTECA,
    AppRoute.PROFILE,
    AppRoute.LITURGIA,
    AppRoute.TEMAS,
    AppRoute.COMMUNITY,
    AppRoute.ENCYCLOPEDIA,
    AppRoute.AZ_FAITH
  ].includes(pathname as AppRoute);
  
  const isDashboard = isMainPage;
  const { notifications, unreadCount, markAsRead, markAllRead } = useNotifications();
  const [showNotifs, setShowNotifs] = useState(false);

  return (
    <header className="border-b border-border bg-background/90 backdrop-blur-xl sticky top-0 z-[140] transition-all pt-[env(safe-area-inset-top,0px)]">
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 md:px-8 lg:px-12 py-3 sm:py-4 flex items-center justify-between min-h-[56px] sm:min-h-[64px]">
        <div className="flex items-center gap-2 sm:gap-10 min-w-0">
          <div className="flex lg:hidden items-center gap-2 sm:gap-4 cursor-pointer group min-w-0 focus-visible:ring-2 focus-visible:ring-primary outline-none" role="button" tabIndex={0} onKeyDown={(e) => e.key === 'Enter' && navigate(AppRoute.DASHBOARD)} onClick={() => navigate(AppRoute.DASHBOARD)}>
            <Icons.Logo className="w-8 h-8 sm:w-10 sm:h-10 flex-shrink-0" variant="blue" />
            <div className="flex flex-col min-w-0">
              <span className="text-xs sm:text-xl font-display font-black uppercase tracking-[0.1em] sm:tracking-[0.25em] text-primary leading-none truncate">Cathedra</span>
              <span className="text-[8px] sm:text-[10px] font-bold uppercase tracking-[0.1em] sm:tracking-[0.3em] text-secondary opacity-80 mt-0.5 sm:mt-1 truncate">{t('digital')}</span>
            </div>
          </div>
          
          {!isDashboard && (
            <button 
              onClick={() => navigate(-1)} 
              className="p-2 sm:p-2.5 bg-muted text-primary border border-border rounded-xl flex items-center gap-2 px-3 sm:px-5 active:scale-95 transition-all hover:bg-primary hover:text-white group shadow-sm focus-visible:ring-2 focus-visible:ring-primary outline-none"
            >
              <Icons.ChevronLeft className="w-4 h-4 transition-transform group-hover:-translate-x-0.5" />
              <span className="text-[10px] font-black uppercase tracking-widest hidden sm:inline-block">{t('back')}</span>
            </button>
          )}

          {isDashboard && (
            <nav className="hidden 2xl:flex items-center gap-5 border-l border-border pl-6 ml-2 min-w-0">
              {[
                { label: t('home'), route: AppRoute.HOJE },
                { label: 'Enciclopédia', route: AppRoute.ENCYCLOPEDIA },
                { label: t('journeys'), route: AppRoute.JORNADAS },
                { label: t('explore'), route: AppRoute.BIBLIOTECA },
                { label: t('themes'), route: AppRoute.TEMAS },
                { label: t('community'), route: AppRoute.COMMUNITY },
                { label: t('profile'), route: AppRoute.PROFILE },
              ].map(item => (
                <button 
                  key={item.route} 
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
          <button 
            className="p-2.5 sm:p-3 bg-muted text-primary rounded-xl sm:rounded-2xl border border-border hover:bg-primary hover:text-white transition-all shadow-sm active:scale-95 flex items-center gap-2" 
            onClick={() => {
              localStorage.removeItem('cathedra_onboarding_done');
              navigate(AppRoute.ONBOARDING);
            }}
            title="Guia do Ecossistema"
          >
            <Icons.Compass className="w-4 h-4" />
            <span className="hidden md:inline text-[9px] font-black uppercase tracking-widest">Guia</span>
          </button>

          <button className="p-2.5 sm:p-3 bg-muted text-primary rounded-xl sm:rounded-2xl border border-border hover:bg-primary hover:text-white transition-all shadow-sm active:scale-95" onClick={() => (window as any).dispatchEvent(new CustomEvent('open-command-center'))}>
            <Icons.Search className="w-4 h-4" />
          </button>

          {user && (
            <button 
              onClick={() => setShowNotifs(!showNotifs)} 
              className="p-2.5 sm:p-3 bg-muted text-primary hover:bg-primary hover:text-white rounded-xl sm:rounded-2xl border border-border relative transition-all shadow-sm active:scale-95"
            >
              <Icons.Message className="w-4 h-4" />
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
                <h3 className="text-[10px] font-black uppercase tracking-widest text-primary">{t('notifications')}</h3>
                <button onClick={markAllRead} className="text-[10px] font-black uppercase tracking-widest text-secondary hover:opacity-70">{t('clear')}</button>
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
                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/40">{t('silence')}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {user && user.role === 'admin' && (
            <button 
              onClick={() => navigate(AppRoute.ADMIN)} 
              className="hidden sm:flex lg:hidden px-4 py-2.5 text-[10px] font-black uppercase tracking-widest text-primary hover:bg-primary hover:text-white transition-all items-center gap-2 bg-secondary/20 rounded-xl border border-secondary/30 shadow-sm"
            >
              <Icons.Star className="w-4 h-4" />
              <span>{t('admin')}</span>
            </button>
          )}

          {user ? (
            <button onClick={onSignOut} className="hidden sm:block lg:hidden px-4 py-2.5 text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:text-primary transition-all">
              {t('exit_session')}
            </button>
          ) : (
            <button onClick={() => navigate(AppRoute.LOGIN)} className="px-4 sm:px-6 py-2 sm:py-2.5 bg-foreground text-background rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-primary hover:text-primary-foreground transition-all shadow-lg active:scale-95">
              {t('enter')}
            </button>
          )}

          <div className="hidden sm:flex lg:hidden items-center gap-1.5 sm:gap-2">
            <select 
              value={lang} 
              onChange={(e) => onChangeLang(e.target.value as Language)}
              className="appearance-none bg-muted text-primary border border-border rounded-xl px-2 py-1.5 text-[10px] font-black uppercase tracking-widest cursor-pointer hover:bg-primary hover:text-white transition-all outline-none"
            >
              <option value="pt">PT</option>
              <option value="en">EN</option>
              <option value="es">ES</option>
              <option value="la">LA</option>
              <option value="it">IT</option>
              <option value="fr">FR</option>
              <option value="de">DE</option>
            </select>
          </div>

          <button 
            onClick={onToggleSpeak} 
            className={`hidden sm:flex lg:hidden p-2.5 sm:p-3 rounded-xl sm:rounded-2xl border border-border transition-all active:scale-95 shadow-sm items-center justify-center ${isSpeaking ? 'bg-primary text-white animate-pulse' : 'bg-muted text-primary hover:bg-primary hover:text-white'}`}
            title={isSpeaking ? t('audio_stop') : t('audio_read')}
          >
            {isSpeaking ? <Icons.Stop className="w-4 h-4" /> : <Icons.Volume2 className="w-4 h-4" />}
          </button>

          <button onClick={onToggleDark} className="hidden sm:flex lg:hidden p-2.5 sm:p-3 bg-muted text-primary hover:bg-primary hover:text-white rounded-xl sm:rounded-2xl border border-border transition-all active:scale-95 shadow-sm items-center justify-center">
            {isDark ? <Icons.Sun className="w-4 h-4" /> : <Icons.Moon className="w-4 h-4" />}
          </button>

          <button onClick={onOpenSidebar} className="sm:hidden p-2.5 bg-muted text-primary hover:bg-primary hover:text-white rounded-xl border border-border transition-all active:scale-95 shadow-sm flex items-center justify-center">
            <Icons.Menu className="w-4.5 h-4.5" />
          </button>
        </div>
      </div>
    </header>
  );
});

AppHeader.displayName = 'AppHeader';

export default AppHeader;