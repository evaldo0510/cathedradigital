import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { AppRoute, Language } from '@/types';
import { Icons } from '@/constants';
import { Button } from '@/components/ui/button';
import { useLang } from '@/hooks/useLang';
import { useReadingSettings } from '@/contexts/ReadingSettingsContext';
import { cn } from '@/lib/utils';

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
        className="bg-background/40 backdrop-blur-2xl sticky top-0 z-[140] transition-all duration-1000 pt-[env(safe-area-inset-top,0px)] will-change-[transform,background-color] admin-hide header-reading-auto-hide"
        role="banner"
      >
        <div className="app-container flex items-center justify-between h-14 md:h-36 py-1 md:py-0">

          {/* Logo Section - Minimalist on Mobile */}
          <div 
            className="flex items-center gap-3 md:gap-6 cursor-pointer group focus-visible:ring-1 focus-visible:ring-primary/20 outline-none rounded-full p-1 md:p-2" 
            role="link" 
            aria-label="Ir para a página inicial do Cathedra"
            tabIndex={0} 
            onKeyDown={(e) => e.key === 'Enter' && navigate('/')} 
            onClick={() => navigate('/')}
          >
            <Icons.Logo className="w-6 h-6 md:w-14 md:h-14 transition-premium-slow group-hover:scale-105" variant="dark" />
            <div className="flex flex-col items-start min-w-0">
              <span className="text-[10px] md:text-2xl font-display font-light uppercase tracking-[0.4em] md:tracking-[0.6em] text-primary leading-none transition-premium-slow group-hover:text-primary/90">
                {pathname === '/' ? 'Cathedra' : (pathname.split('/')[1]?.charAt(0).toUpperCase() + pathname.split('/')[1]?.slice(1)) || 'Cathedra'}
              </span>
              <span className="hidden md:block h5 !text-[9px] !text-muted-foreground mt-2 group-hover:text-primary/40 transition-premium-slow">Biblioteca Digital</span>
            </div>
          </div>

          {/* Navigation & Controls Section */}
          <div className="flex items-center justify-end gap-2 md:gap-6">
            <div className="flex items-center gap-1.5 md:gap-4 lg:gap-6">

              {!isDashboard && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => navigate(-1)}
                  className="w-8 h-8 md:w-12 md:h-12 rounded-full border border-transparent md:border-primary/10 hover:bg-primary/[0.03] transition-all duration-500 tap-premium"
                  aria-label={t('back') || 'Voltar'}
                >
                  <Icons.ChevronLeft className="w-4 h-4 md:w-5 md:h-5 opacity-70" />
                </Button>
              )}

              <div className="flex items-center gap-1.5 md:gap-4">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => (window as any).dispatchEvent(new CustomEvent('open-command-center'))}
                  className="w-8 h-8 md:w-12 md:h-12 rounded-full hover:bg-primary/[0.03] transition-all duration-500 group tap-premium"
                  aria-label={t('search') || 'Buscar'}
                >
                  <Icons.Search className="w-3.5 h-3.5 md:w-5 md:h-5 opacity-50 group-hover:opacity-100 transition-opacity" />
                </Button>

                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onToggleDark}
                  className="w-10 h-10 md:w-12 md:h-12 rounded-full hover:bg-primary/[0.03] transition-all duration-500 group hidden md:flex"
                  aria-label={isDark ? "Ativar modo claro" : "Ativar modo escuro"}
                >
                  {isDark ? 
                    <Icons.Sun className="w-5 h-5 opacity-70" /> : 
                    <Icons.Moon className="w-5 h-5 opacity-70" />
                  }
                </Button>
              </div>

              <div className="flex items-center gap-2 md:gap-4">
                {/* Desktop-only Profile */}
                <div className="hidden md:block">
                  {user ? (
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => navigate(AppRoute.PROFILE)}
                      className="w-12 h-12 rounded-full border-primary/10 hover:border-primary/20 overflow-hidden bg-primary/[0.03] tap-premium"
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
                      className="h-12 px-8 rounded-full text-[10px] font-bold uppercase tracking-[0.3em] bg-primary text-primary-foreground hover:bg-primary/90 transition-all shadow-xl shadow-primary/10"
                    >
                      {t('enter')}
                    </Button>
                  )}
                </div>

                {/* Desktop-only Hamburger */}
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onOpenSidebar}
                  className="hidden md:flex w-12 h-12 rounded-full hover:bg-primary/[0.03] transition-all duration-500 group tap-premium"
                  aria-label="Abrir menu lateral"
                >
                  <Icons.Menu className="w-5 h-5 opacity-70 group-hover:opacity-100" />
                </Button>
              </div>
            </div>

            {/* Desktop Navigation Links */}
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