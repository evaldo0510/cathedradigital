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
    <>
      <header 
        className="border-b border-primary/5 bg-background/60 backdrop-blur-3xl sticky top-0 z-[140] transition-all pt-[env(safe-area-inset-top,0px)] will-change-[transform,background-color] admin-hide"
        role="banner"
      >
        <div className="max-w-[1800px] mx-auto px-6 md:px-12 lg:px-20 flex flex-col md:flex-row landscape:flex-row md:items-center justify-between min-h-[140px] md:h-28 py-8 md:py-0 gap-8 md:gap-0 landscape:min-h-[90px] landscape:py-3">

          {/* Logo Section - Centralized on Mobile */}
          <div 
            className="flex flex-col items-center justify-center md:flex-row md:justify-start landscape:flex-row landscape:justify-start gap-4 md:gap-6 cursor-pointer group focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 outline-none rounded-lg w-full md:w-auto landscape:w-auto p-2" 
            role="link" 
            aria-label="Ir para a página inicial do Cathedra"
            tabIndex={0} 
            onKeyDown={(e) => e.key === 'Enter' && navigate('/')} 
            onClick={() => navigate('/')}
          >
            <Icons.Logo className="w-12 h-12 md:w-11 md:h-11 transition-all duration-1000 scale-110 md:scale-100" variant="dark" />
            <div className="flex flex-col items-center md:items-start min-w-0">
              <span className="text-xl md:text-xl font-display font-light uppercase tracking-[0.7em] md:tracking-[0.6em] text-primary leading-none group-hover:tracking-[0.8em] transition-all duration-1000">Cathedra</span>
              <span className="hidden md:block text-[8px] uppercase tracking-[0.4em] text-muted-foreground/40 mt-1">Biblioteca Digital</span>
            </div>
          </div>

          {/* Navigation & Controls Section */}
          <div className="flex items-center justify-center md:justify-end gap-6 sm:gap-8 w-full md:w-auto border-t border-primary/5 md:border-none pt-8 md:pt-0 landscape:pt-0 landscape:border-none">
            <div className="flex items-center gap-4 md:gap-4 lg:gap-6 w-full md:w-auto justify-center md:justify-end landscape:gap-4">


              {!isDashboard && (
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => navigate(-1)}
                  className="w-10 h-10 sm:w-12 sm:h-12 rounded-full border-primary/10 hover:bg-primary/5 focus-visible:ring-2 focus-visible:ring-primary"
                  aria-label={t('back') || 'Voltar'}
                >
                  <Icons.ChevronLeft className="w-4 h-4 opacity-70 group-hover:opacity-100" />
                </Button>
              )}

              <Button
                variant="outline"
                size="icon"
                onClick={() => (window as any).dispatchEvent(new CustomEvent('open-command-center'))}
                className="w-10 h-10 sm:w-12 sm:h-12 rounded-full border-primary/10 group focus-visible:ring-2 focus-visible:ring-primary"
                aria-label={t('search') || 'Buscar'}
              >
                <Icons.Search className="w-5 h-5 opacity-70 group-hover:opacity-100 transition-opacity" />
              </Button>

              <Button
                variant="outline"
                size="icon"
                onClick={onToggleDark}
                className="w-10 h-10 sm:w-12 sm:h-12 rounded-full border-primary/10 group focus-visible:ring-2 focus-visible:ring-primary"
                aria-label={isDark ? "Ativar modo claro" : "Ativar modo escuro"}
              >
                {isDark ? <Icons.Sun className="w-5 h-5 opacity-70 group-hover:opacity-100 transition-opacity" /> : <Icons.Moon className="w-5 h-5 opacity-70 group-hover:opacity-100 transition-opacity" />}
              </Button>

              {user ? (
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => navigate(AppRoute.PROFILE)}
                  className="w-10 h-10 sm:w-12 sm:h-12 rounded-full border-primary/10 overflow-hidden focus-visible:ring-2 focus-visible:ring-primary"
                  aria-label={t('profile') || 'Meu Perfil'}
                >
                  {user.avatar ? (
                    <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
                  ) : (
                    <Icons.User className="w-5 h-5 opacity-70" />
                  )}
                </Button>
              ) : (
                <Button 
                  onClick={() => navigate(AppRoute.LOGIN)} 
                  className="btn-premium-primary h-10 px-5 md:px-6 rounded-full text-[9px] md:text-[10px] font-bold uppercase tracking-widest focus-visible:ring-2 focus-visible:ring-primary"
                >
                  {t('enter')}
                </Button>
              )}

              <Button
                variant="outline"
                size="icon"
                onClick={onOpenSidebar}
                className="w-10 h-10 sm:w-12 sm:h-12 rounded-full border-primary/10 transition-all hover:bg-primary/5 group focus-visible:ring-2 focus-visible:ring-primary"
                aria-label="Abrir menu lateral"
              >
                <Icons.Menu className="w-5 h-5 opacity-70 group-hover:opacity-100 transition-opacity" />
              </Button>
            </div>



          {/* Desktop Navigation */}
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
      </div>
      </header>
    </>
  );
});

AppHeader.displayName = 'AppHeader';

export default AppHeader;
