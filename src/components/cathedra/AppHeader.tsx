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
        className="border-b border-primary/5 bg-background/80 backdrop-blur-3xl sticky top-0 z-[140] transition-premium pt-[env(safe-area-inset-top,0px)] will-change-[transform,background-color] admin-hide header-reading-auto-hide"
        role="banner"
      >
        <div className="app-container flex flex-col md:flex-row md:items-center justify-between min-h-[160px] md:h-36 py-10 md:py-0 gap-8 md:gap-0">

          {/* Logo Section */}
          <div 
            className="flex flex-col items-center justify-center md:flex-row md:justify-start gap-5 md:gap-6 cursor-pointer group focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 outline-none rounded-premium w-full md:w-auto p-2" 
            role="link" 
            aria-label="Ir para a página inicial do Cathedra"
            tabIndex={0} 
            onKeyDown={(e) => e.key === 'Enter' && navigate('/')} 
            onClick={() => navigate('/')}
          >
            <Icons.Logo className="w-16 h-16 md:w-14 md:h-14 transition-premium-slow group-hover:scale-105" variant="dark" />
            <div className="flex flex-col items-center md:items-start min-w-0">
              <span className="text-3xl md:text-2xl font-display font-light uppercase tracking-[0.8em] md:tracking-[0.6em] text-primary leading-none group-hover:tracking-[0.7em] transition-premium-slow group-hover:text-primary/90">Cathedra</span>
              <span className="h5 !text-[9px] !text-muted-foreground mt-2.5 group-hover:text-primary/40 transition-premium-slow">Biblioteca Digital</span>
            </div>
          </div>

          {/* Navigation & Controls Section */}
          <div className="flex items-center justify-center md:justify-end gap-6 w-full md:w-auto border-t border-primary/5 md:border-none pt-10 md:pt-0">
            <div className="flex items-center gap-5 md:gap-4 lg:gap-6 w-full md:w-auto justify-between md:justify-end px-2 md:px-0">


              {!isDashboard && (
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => navigate(-1)}
                  className="w-12 h-12 rounded-full border-primary/10 hover:border-primary/20 bg-primary/[0.03] hover:bg-primary/[0.05] transition-all duration-500 focus-visible:ring-1 focus-visible:ring-primary/20 tap-premium"
                  aria-label={t('back') || 'Voltar'}
                >
                  <Icons.ChevronLeft className="w-5 h-5 opacity-90 group-hover:opacity-100 transition-opacity" />
                </Button>
              )}

              <div className="flex items-center gap-4">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => (window as any).dispatchEvent(new CustomEvent('open-command-center'))}
                  className="w-12 h-12 rounded-full border-primary/10 hover:border-primary/20 bg-primary/[0.03] hover:bg-primary/[0.05] transition-all duration-500 group focus-visible:ring-1 focus-visible:ring-primary/20 tap-premium"
                  aria-label={t('search') || 'Buscar'}
                >
                  <Icons.Search className="w-5 h-5 opacity-90 group-hover:opacity-100 transition-opacity" />
                </Button>

                <Button
                  variant="outline"
                  size="icon"
                  onClick={onToggleDark}
                  className="w-12 h-12 rounded-full border-primary/10 hover:border-primary/20 bg-primary/[0.03] hover:bg-primary/[0.05] transition-all duration-500 group focus-visible:ring-1 focus-visible:ring-primary/20 tap-premium"

                  aria-label={isDark ? "Ativar modo claro" : "Ativar modo escuro"}
                >
                  {isDark ? 
                    <Icons.Sun className="w-5 h-5 opacity-90 group-hover:opacity-100 transition-opacity" /> : 
                    <Icons.Moon className="w-5 h-5 opacity-90 group-hover:opacity-100 transition-opacity" />
                  }
                </Button>
              </div>

              <div className="flex items-center gap-4">
                {user ? (
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => navigate(AppRoute.PROFILE)}
                    className="w-12 h-12 rounded-full border-primary/10 hover:border-primary/20 overflow-hidden focus-visible:ring-1 focus-visible:ring-primary/20 bg-primary/[0.03] tap-premium"
                    aria-label={t('profile') || 'Meu Perfil'}
                  >
                    {user.avatar ? (
                      <img src={user.avatar} alt={user.name} className="w-full h-full object-cover opacity-90 hover:opacity-100 transition-opacity" />
                    ) : (
                      <Icons.User className="w-5 h-5 opacity-90" />
                    )}
                  </Button>
                ) : (
                  <Button 
                    onClick={() => navigate(AppRoute.LOGIN)} 
                    className="h-12 px-8 rounded-full text-[10px] font-bold uppercase tracking-[0.3em] bg-primary text-primary-foreground hover:bg-primary/90 transition-all duration-500 focus-visible:ring-1 focus-visible:ring-primary/20 shadow-xl shadow-primary/10"
                  >
                    {t('enter')}
                  </Button>
                )}

                <Button
                  variant="outline"
                  size="icon"
                  onClick={onOpenSidebar}
                  className="w-12 h-12 rounded-full border-primary/10 hover:border-primary/20 bg-primary/[0.03] hover:bg-primary/[0.05] transition-all duration-500 group focus-visible:ring-1 focus-visible:ring-primary/20 tap-premium"
                  aria-label="Abrir menu lateral"
                >
                  <Icons.Menu className="w-5 h-5 opacity-90 group-hover:opacity-100 transition-opacity" />
                </Button>
              </div>
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
