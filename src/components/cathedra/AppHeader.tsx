import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { AppRoute, Language } from '@/types';
import { Icons } from '@/constants';
import { cn } from '@/lib/utils';
import { Button } from './Button';
import GoogleSignInButton from '../auth/GoogleSignInButton';
import { CathedraIcon, IconSizePreset } from './CathedraIcon';
import { canUserAccess } from '@/utils/auth-utils';

import { useNotifications } from '@/hooks/useNotifications';
import { useLang } from '@/hooks/useLang';

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
    <header className="app-header border-b border-border/10 bg-background/40 backdrop-blur-2xl sticky top-0 z-[140] transition-all pt-[env(safe-area-inset-top,0px)]">
      <div className="app-container flex items-center justify-between py-4 sm:py-6 min-h-[70px] sm:min-h-[90px]">
        <div className="flex items-center gap-3 md:gap-4 lg:gap-12 min-w-0">
          <div className="flex lg:hidden items-center gap-2 sm:gap-3 md:gap-4 cursor-pointer group min-w-0 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 outline-none rounded-lg" role="button" tabIndex={0} onKeyDown={(e) => e.key === 'Enter' && navigate(AppRoute.HOJE)} onClick={() => navigate(AppRoute.HOJE)} aria-label="Ir para a página inicial Cathedra">
            <Icons.Logo className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 flex-shrink-0 transition-transform group-hover:scale-105" variant="blue" />
            <div className="flex flex-col min-w-0">
              <span className="text-lg sm:text-xl md:text-2xl font-display font-medium uppercase tracking-[0.2em] text-primary leading-none truncate">Cathedra</span>
              <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-[0.4em] text-secondary/60 mt-1 truncate">{t('digital')}</span>
            </div>
          </div>
          
          {!isDashboard && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate(-1)}
              className="h-10 sm:h-12 px-4 sm:px-6"
            >
              <CathedraIcon icon={Icons.ChevronLeft} size={IconSizePreset.TINY} containerClassName="bg-transparent border-none p-0 w-auto h-auto" />
              <span className="text-[10px] font-black uppercase tracking-widest hidden sm:inline-block ml-2">{t('back')}</span>
            </Button>
          )}

          {isDashboard && (
            <nav className="hidden lg:flex items-center gap-1 xl:gap-2 border-l border-border/40 pl-4 xl:pl-8 ml-2 xl:ml-4 min-w-0 overflow-x-auto no-scrollbar" role="navigation" aria-label="Navegação horizontal principal">
              {[
                { label: t('home'), route: AppRoute.HOJE },
                { label: t('logos'), route: AppRoute.LOGOS },
                { label: t('encyclopedia'), route: AppRoute.ENCYCLOPEDIA },
                { label: t('journeys'), route: AppRoute.JORNADAS },
                { label: t('explore'), route: AppRoute.BIBLIOTECA },
                { label: t('themes'), route: AppRoute.TEMAS },
                { label: t('favorites'), route: AppRoute.FAVORITES },
                { label: t('profile'), route: AppRoute.PROFILE },
              ].filter(item => canUserAccess(user?.role, item.route)).map(item => (
                <Button 
                  key={item.route} 
                  variant={pathname === item.route ? 'primary' : 'ghost'}
                  size="sm"
                  onClick={() => navigate(item.route)}
                  className={cn(
                    "px-3 xl:px-5 py-2 xl:py-3 h-auto whitespace-nowrap relative group text-[10px] xl:text-xs font-bold uppercase tracking-widest focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1 outline-none",
                    pathname === item.route ? 'bg-primary text-primary-foreground' : 'text-muted-foreground/50 hover:text-primary'
                  )}
                  aria-label={item.label}
                  aria-current={pathname === item.route ? 'page' : undefined}
                >
                  {item.label}
                </Button>

              ))}
            </nav>
          )}
        </div>

        <div className="flex items-center gap-1.5 sm:gap-4 flex-shrink-0">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              localStorage.removeItem('cathedra_onboarding_done');
              navigate(AppRoute.ONBOARDING);
            }}
            className="w-10 h-10 sm:w-12 sm:h-12 p-0 rounded-full"
            title={t('ecosystem_guide') || "Guia do Ecossistema"}>
            <CathedraIcon icon={Icons.Compass} size={IconSizePreset.ACTION} containerClassName="bg-transparent border-none p-0 w-auto h-auto" />
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={onToggleDark}
            className="w-10 h-10 sm:w-12 sm:h-12 p-0 rounded-full flex lg:hidden"
            aria-label="Alternar tema">
            {isDark ? <CathedraIcon icon={Icons.Sun} size={IconSizePreset.ACTION} containerClassName="bg-transparent border-none p-0 w-auto h-auto" /> : <CathedraIcon icon={Icons.Moon} size={IconSizePreset.ACTION} containerClassName="bg-transparent border-none p-0 w-auto h-auto" />}
          </Button>

          <Button
            variant={isHighContrast ? "primary" : "outline"}
            size="sm"
            onClick={() => (window as any).dispatchEvent(new CustomEvent('open-a11y-settings'))}
            className={cn(
              "w-10 h-10 sm:w-12 sm:h-12 p-0 rounded-full hidden sm:flex",
              isHighContrast && 'ring-2 ring-primary ring-offset-1'
            )}
            aria-label="Configurações de Acessibilidade">
            <CathedraIcon icon={Icons.ShieldCheck} size={IconSizePreset.ACTION} containerClassName="bg-transparent border-none p-0 w-auto h-auto" />
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => (window as any).dispatchEvent(new CustomEvent('open-command-center'))}
            aria-label={t('search') || "Buscar"}
            className="w-10 h-10 sm:w-12 sm:h-12 p-0 rounded-full"
          >
            <CathedraIcon icon={Icons.Search} size={IconSizePreset.ACTION} containerClassName="bg-transparent border-none p-0 w-auto h-auto" />
          </Button>

          {user && (
            <Button
              variant={showNotifs ? "primary" : "outline"}
              size="sm"
              onClick={() => setShowNotifs(!showNotifs)}
              className="relative w-10 h-10 sm:w-12 sm:h-12 p-0 rounded-full"
              aria-label={showNotifs ? t('close_notifications') : t('notifications_unread')}
              aria-expanded={showNotifs}>
              <CathedraIcon icon={Icons.Message} size={IconSizePreset.ACTION} containerClassName="bg-transparent border-none p-0 w-auto h-auto" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-primary text-primary-foreground text-[9px] font-black flex items-center justify-center rounded-full border-2 border-background shadow-soft">
                  {unreadCount}
                </span>
              )}
            </Button>
          )}
          
          {showNotifs && user && (
            <div className="absolute top-full right-4 mt-4 w-80 bg-card border border-border rounded-premium-sm shadow-premium z-[150] overflow-hidden animate-in fade-in zoom-in duration-300">
              <div className="p-5 border-b border-border flex items-center justify-between bg-muted/30">
                <h3 className="text-premium-tiny font-black uppercase tracking-widest text-primary">{t('notifications')}</h3>
                <Button variant="ghost" size="sm" onClick={markAllRead} className="h-auto p-1 text-[9px] font-black uppercase tracking-widest text-secondary hover:opacity-70">{t('clear')}</Button>
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

          {canUserAccess(user?.role, AppRoute.ADMIN) && (
            <Button 
              variant="secondary"
              size="sm"
              onClick={() => navigate(AppRoute.ADMIN)} 
              className="hidden sm:flex lg:hidden h-10 px-4 items-center gap-2 rounded-full border border-secondary/30"
            >
              <CathedraIcon icon={Icons.Star} size={IconSizePreset.TINY} variant="secondary" containerClassName="bg-transparent border-none p-0 w-auto h-auto" />
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
                className="h-10 px-4 sm:px-6 shadow-lg active:scale-95"
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

          <Button
            variant={isSpeaking ? "primary" : "outline"}
            size="sm"
            onClick={onToggleSpeak}
            className={cn(
              "hidden sm:flex lg:hidden w-10 h-10 sm:w-12 sm:h-12 p-0 rounded-full",
              isSpeaking && 'animate-pulse'
            )}
            title={isSpeaking ? t('audio_stop') : t('audio_read')}
            aria-label={isSpeaking ? t('audio_stop') : t('audio_read')}>
            {isSpeaking ? <CathedraIcon icon={Icons.Stop} size={IconSizePreset.ACTION} containerClassName="bg-transparent border-none p-0 w-auto h-auto" /> : <CathedraIcon icon={Icons.Volume2} size={IconSizePreset.ACTION} containerClassName="bg-transparent border-none p-0 w-auto h-auto" />}
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={onToggleDark}
            className="hidden lg:flex w-10 h-10 sm:w-12 sm:h-12 p-0 rounded-full"
            aria-label="Alternar tema">
            {isDark ? <CathedraIcon icon={Icons.Sun} size={IconSizePreset.ACTION} containerClassName="bg-transparent border-none p-0 w-auto h-auto" /> : <CathedraIcon icon={Icons.Moon} size={IconSizePreset.ACTION} containerClassName="bg-transparent border-none p-0 w-auto h-auto" />}
          </Button>


        </div>
      </div>
    </header>
  );
});

AppHeader.displayName = 'AppHeader';

export default AppHeader;