import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { AppRoute, Language } from '@/types';
import { Icons } from '@/constants';
import { Button } from '@/components/ui/button';
import { useLang } from '@/hooks/useLang';
import { useReadingSettings } from '@/contexts/ReadingSettingsContext';

interface AppHeaderProps {
  user: any;
  isDark: boolean;
  onToggleDark: () => void;
  lang: Language;
  onChangeLang: (lang: Language) => void;
  onSignOut: () => void;
  onOpenSidebar: () => void;
}

const AppHeader: React.FC<AppHeaderProps> = React.memo(({
  user, isDark, onToggleDark, lang, onChangeLang, onSignOut, onOpenSidebar
}) => {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { t } = useLang();
  const { settings } = useReadingSettings();
  
  const isDashboard = pathname === '/';

  return (
    <header className="border-b border-primary/5 bg-background/40 backdrop-blur-3xl sticky top-0 z-[140] transition-all pt-[env(safe-area-inset-top,0px)] will-change-[transform,background-color]">
      <div className="app-container flex items-center justify-between h-20 sm:h-24">
        <div className="flex items-center gap-8 min-w-0">
          <div className="flex items-center gap-4 cursor-pointer group focus-visible:ring-1 focus-visible:ring-primary/40 focus-visible:ring-offset-2 outline-none rounded-lg" role="button" tabIndex={0} onKeyDown={(e) => e.key === 'Enter' && navigate('/')} onClick={() => navigate('/')}>
            <Icons.Logo className="w-9 h-9 transition-all duration-1000" variant="dark" />
            <div className="flex flex-col min-w-0">
              <span className="text-lg font-display font-light uppercase tracking-[0.5em] text-primary leading-none group-hover:tracking-[0.55em] transition-all duration-1000">Cathedra</span>
            </div>
          </div>
          
          {!isDashboard && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate(-1)}
              className="h-10 px-4 rounded-full border-primary/20 hover:bg-primary/5 focus-visible:ring-primary/40"
            >
              <Icons.ChevronLeft className="w-4 h-4" />
              <span className="text-[10px] font-bold uppercase tracking-widest hidden sm:inline-block ml-2">{t('back')}</span>
            </Button>
          )}

          {isDashboard && (
            <nav className="hidden xl:flex items-center gap-2 border-l border-primary/10 pl-8 ml-4" aria-label="Navegação principal">
              {[
                { label: t('bible'), route: AppRoute.BIBLE },
                { label: t('catechism'), route: AppRoute.CATECHISM },
                { label: 'Magistério', route: AppRoute.MAGISTERIUM },
                { label: 'Logos IA', route: '/logos' },
              ].map(item => (
                <Button 
                  key={item.route} 
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate(item.route)}
                  className={`px-4 py-2 h-auto text-[10px] font-bold uppercase tracking-[0.3em] transition-all relative group ${
                    pathname === item.route ? 'text-primary font-medium' : 'text-muted-foreground/60 hover:text-primary'
                  }`}
                >
                  {item.label}
                  {pathname === item.route && (
                    <motion.div layoutId="nav-active" className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-primary" />
                  )}
                </Button>
              ))}
            </nav>
          )}
        </div>

        <div className="flex items-center gap-3 sm:gap-4">
          <Button
            variant="outline"
            size="icon"
            onClick={() => (window as any).dispatchEvent(new CustomEvent('open-command-center'))}
            className="w-10 h-10 sm:w-12 sm:h-12 rounded-full border-primary/10 group"
            aria-label={t('search') || 'Buscar'}
          >
            <Icons.Search className="w-5 h-5 opacity-60 group-hover:opacity-100 transition-opacity" />
          </Button>

          <Button
            variant="outline"
            size="icon"
            onClick={onToggleDark}
            className="w-10 h-10 sm:w-12 sm:h-12 rounded-full border-primary/10 group"
            aria-label={isDark ? "Ativar modo claro" : "Ativar modo escuro"}
          >
            {isDark ? <Icons.Sun className="w-5 h-5 opacity-60 group-hover:opacity-100 transition-opacity" /> : <Icons.Moon className="w-5 h-5 opacity-60 group-hover:opacity-100 transition-opacity" />}
          </Button>

          {user ? (
            <Button
              variant="outline"
              size="icon"
              onClick={() => navigate(AppRoute.PROFILE)}
              className="w-10 h-10 sm:w-12 sm:h-12 rounded-full border-primary/10 overflow-hidden"
              aria-label={t('profile') || 'Meu Perfil'}
            >
              {user.avatar ? (
                <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
              ) : (
                <Icons.User className="w-5 h-5 opacity-60" />
              )}
            </Button>
          ) : (
            <Button 
              onClick={() => navigate(AppRoute.LOGIN)} 
              className="btn-premium-primary h-10 px-6 rounded-full text-[10px] font-bold uppercase tracking-widest"
            >
              {t('enter')}
            </Button>
          )}

          <Button
            variant="outline"
            size="icon"
            onClick={onOpenSidebar}
            className="w-10 h-10 sm:w-12 sm:h-12 rounded-full border-primary/10 transition-all hover:bg-primary/5 group"
            aria-label="Abrir menu lateral"
          >
            <Icons.Menu className="w-5 h-5 opacity-60 group-hover:opacity-100 transition-opacity" />
          </Button>
        </div>
      </div>
    </header>
  );
});

AppHeader.displayName = 'AppHeader';

export default AppHeader;
