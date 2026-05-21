import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { AppRoute, Language } from '@/types';
import { Icons } from '@/constants';
import { Button } from '@/components/ui/button';
import GoogleSignInButton from '../auth/GoogleSignInButton';

import { useNotifications } from '@/hooks/useNotifications';
import { useLang } from '@/hooks/useLang';
import { useReadingSettings } from '@/contexts/ReadingSettingsContext';

interface AppHeaderProps {
  user: any;
  isDark: boolean;
  onToggleDark: () => void;
  isHighContrast?: boolean;
  onToggleHighContrast?: () => void;
  lang: Language;
  onChangeLang: (lang: Language) => void;
  isSpeaking?: boolean;
  onToggleSpeak?: () => void;
  onSignOut: () => void;
  onOpenSidebar: () => void;
}

const AppHeader: React.FC<AppHeaderProps> = React.memo(({
  user, isDark, onToggleDark, isHighContrast, onToggleHighContrast, lang, onChangeLang, isSpeaking, onToggleSpeak, onSignOut, onOpenSidebar
}) => {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { t } = useLang();
  const { settings } = useReadingSettings();
  
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
    <header className="border-b border-border/5 bg-background/40 backdrop-blur-3xl sticky top-0 z-[140] transition-all pt-[env(safe-area-inset-top,0px)]">
      <div className="app-container flex items-center justify-between h-24 sm:h-28">
        <div className="flex items-center gap-8 sm:gap-12 min-w-0">
          <div className="flex items-center gap-4 sm:gap-5 cursor-pointer group min-w-0 focus-visible:ring-2 focus-visible:ring-primary/20 outline-none" role="button" tabIndex={0} onKeyDown={(e) => e.key === 'Enter' && navigate(AppRoute.HOJE)} onClick={() => navigate(AppRoute.HOJE)}>
            <div className="relative">
              <div className="absolute inset-0 bg-primary/20 rounded-full blur-xl opacity-0 group-hover:opacity-40 transition-opacity duration-700" />
              <Icons.Logo className="w-10 h-10 sm:w-14 sm:h-14 flex-shrink-0 transition-all duration-700 group-hover:scale-105 relative z-10" variant="blue" />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-xl sm:text-2xl font-display font-medium uppercase tracking-[0.3em] text-primary leading-none truncate group-hover:tracking-[0.35em] transition-all duration-700">Cathedra</span>
              <span className="text-[9px] font-black uppercase tracking-[0.5em] text-secondary/40 mt-1.5 truncate">Digitalis</span>
            </div>
          </div>
          
          {!isDashboard && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate(-1)}
              className="h-10 sm:h-12 px-4 sm:px-6"
            >
              <Icons.ChevronLeft className="w-4 h-4 transition-transform group-hover:-translate-x-0.5" />
              <span className="text-premium-tiny font-black uppercase tracking-widest hidden sm:inline-block">{t('back')}</span>
            </Button>
          )}

          {isDashboard && (
            <nav className="hidden 2xl:flex items-center gap-2 border-l border-border/40 pl-8 ml-4 min-w-0">
              {[
                { label: t('bible'), route: AppRoute.BIBLE },
                { label: t('catechism'), route: AppRoute.CATECHISM },
                { label: 'Magistério', route: AppRoute.MAGISTERIUM },
                { label: 'Logos IA', route: AppRoute.BUSCAR },
              ].map(item => (
                <Button 
                  key={item.route} 
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate(item.route)}
                  className={`px-5 py-3 h-auto text-[10px] font-bold uppercase tracking-[0.35em] transition-all whitespace-nowrap relative group shadow-none border-none ${
                    pathname === item.route ? 'text-primary bg-primary/[0.04] rounded-full' : 'text-muted-foreground/50 hover:text-primary'
                  }`}
                  aria-label={item.label}
                  aria-current={pathname === item.route ? 'page' : undefined}
                >
                  {item.label}
                  <span className={`absolute -bottom-1 left-0 h-0.5 bg-primary transition-all ${pathname === item.route ? 'w-full' : 'w-0 group-hover:w-full'}`} />
                </Button>

              ))}
            </nav>
          )}
        </div>

        <div className="flex items-center gap-1.5 sm:gap-4 flex-shrink-0 app-header-actions">
          <Button
            variant="outline"
            size="icon"
            onClick={() => {
              localStorage.removeItem('cathedra_onboarding_done');
              navigate("/");

            }}
            className="w-10 h-10 sm:w-12 sm:h-12"
            title={t('ecosystem_guide') || "Guia do Ecossistema"}>
            <Icons.Compass className="w-5 h-5" />
          </Button>

          <Button
            variant="outline"
            size="icon"
            onClick={onToggleDark}
            className="w-10 h-10 sm:w-12 sm:h-12 flex lg:hidden"
            aria-label="Alternar tema">
            {isDark ? <Icons.Sun className="w-5 h-5" /> : <Icons.Moon className="w-5 h-5" />}
          </Button>

          <Button
            variant={isHighContrast ? "default" : "outline"}
            size="icon"
            onClick={() => (window as any).dispatchEvent(new CustomEvent('open-a11y-settings'))}
            className={`w-10 h-10 sm:w-12 sm:h-12 hidden sm:flex ${isHighContrast ? 'ring-2 ring-primary ring-offset-1' : ''}`}
            aria-label="Configurações de Acessibilidade">
            <Icons.ShieldCheck className="w-5 h-5" />
          </Button>

          <Button
            variant="outline"
            size="icon"
            onClick={() => (window as any).dispatchEvent(new CustomEvent('open-command-center'))}
            aria-label={t('search') || "Buscar"}
            className="w-10 h-10 sm:w-12 sm:h-12"
          >
            <Icons.Search className="w-5 h-5" />
          </Button>

          {user && (
            <Button
              variant={showNotifs ? "default" : "outline"}
              size="icon"
              onClick={() => setShowNotifs(!showNotifs)}
              className="relative w-10 h-10 sm:w-12 sm:h-12"
              aria-label={showNotifs ? t('close_notifications') : t('notifications_unread')}
              aria-expanded={showNotifs}>
              <Icons.Message className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-primary text-primary-foreground text-premium-tiny font-black flex items-center justify-center rounded-full border-2 border-background shadow-premium">
                  {unreadCount}
                </span>
              )}
            </Button>
          )}
          
          {showNotifs && user && (
            <div className="absolute top-full right-4 mt-4 w-80 bg-card border border-border rounded-premium shadow-premium-hover z-[150] overflow-hidden animate-in fade-in zoom-in duration-300">
              <div className="p-5 border-b border-border flex items-center justify-between bg-muted/30">
                <h3 className="text-premium-tiny font-black uppercase tracking-widest text-primary">{t('notifications')}</h3>
                <Button variant="ghost" size="xs" onClick={markAllRead} className="h-auto p-1 text-premium-tiny font-black uppercase tracking-widest text-secondary hover:opacity-70">{t('clear')}</Button>
              </div>
              <div className="max-h-[60vh] overflow-y-auto custom-scrollbar">
                {notifications.length > 0 ? (
                  notifications.map((n) => (
                    <div 
                      key={n.id} 
                      className={`p-5 border-b border-border/50 hover:bg-muted/50 transition-colors cursor-pointer ${!n.is_read ? 'bg-primary/5' : ''}`}
                      onClick={() => markAsRead(n.id)}
                    >
                      <p className="text-premium-small font-bold text-primary mb-1">{n.title}</p>
                      <p className="text-premium-tiny text-muted-foreground leading-relaxed">{n.message}</p>
                    </div>
                  ))
                ) : (
                  <div className="p-12 text-center">
                    <Icons.Message className="w-10 h-10 text-muted-foreground/20 mx-auto mb-4" />
                    <p className="text-premium-tiny font-black uppercase tracking-widest text-muted-foreground/40">{t('silence')}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {user && user.role === 'admin' && (
            <Button 
              variant="secondary"
              size="sm"
              onClick={() => navigate(AppRoute.ADMIN)} 
              className="hidden sm:flex lg:hidden h-10 px-4 items-center gap-2 rounded-full border border-secondary/30"
            >
              <Icons.Star className="w-4 h-4" />
              <span>{t('admin')}</span>
            </Button>
          )}

          {user ? (
            <Button 
              variant="ghost" 
              size="sm"
              onClick={onSignOut} 
              className="hidden sm:block lg:hidden h-10 text-muted-foreground hover:text-primary transition-all shadow-none"
            >
              {t('exit_session')}
            </Button>
          ) : (
            <div className="flex items-center gap-2">
              <div className="hidden md:block">
                <GoogleSignInButton 
                  className="h-10 px-4 rounded-full"
                  text="Google"
                />
              </div>
              <Button 
                onClick={() => navigate(AppRoute.LOGIN)} 
                className="h-10 px-4 sm:px-6 shadow-premium active:scale-95"
              >
                {t('enter')}
              </Button>
            </div>
          )}

          <div className="hidden sm:flex lg:hidden items-center gap-1.5 sm:gap-2">
            <select 
              value={lang} 
              onChange={(e) => onChangeLang(e.target.value as Language)}
              className="appearance-none bg-muted text-primary border border-border rounded-full px-2 py-1.5 text-premium-tiny font-black uppercase tracking-widest cursor-pointer hover:bg-primary hover:text-white transition-all outline-none"
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

          {!settings.totalSilence && (
            <Button
              variant={isSpeaking ? "default" : "outline"}
              size="icon"
              onClick={onToggleSpeak}
              className={`hidden sm:flex lg:hidden ${isSpeaking ? 'animate-pulse' : ''}`}
              title={isSpeaking ? t('audio_stop') : t('audio_read')}
              aria-label={isSpeaking ? t('audio_stop') : t('audio_read')}>
              {isSpeaking ? <Icons.Stop className="w-4 h-4" /> : <Icons.Volume2 className="w-4 h-4" />}
            </Button>
          )}

          <Button
            variant="outline"
            size="icon"
            onClick={onToggleDark}
            className="hidden lg:flex"
            aria-label="Alternar tema">
            {isDark ? <Icons.Sun className="w-4 h-4" /> : <Icons.Moon className="w-4 h-4" />}
          </Button>


        </div>
      </div>
    </header>
  );
});

AppHeader.displayName = 'AppHeader';

export default AppHeader;