import React, { memo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { AppRoute, Language } from '@/types';
import { Icons } from '@/constants';
import { Button } from '@/components/ui/button';
import { useLang } from '@/hooks/useLang';

import { cn } from '@/lib/utils';

interface AppHeaderProps {
  user: any;
  isDark: boolean;
  onToggleDark: () => void;
  lang: Language;
  onChangeLang: (lang: Language) => void;
  onSignOut: () => void;
  onOpenSidebar: () => void;
  isLanding?: boolean;
}

const AppHeader: React.FC<AppHeaderProps> = memo(({
  user, isDark, onToggleDark, lang, onChangeLang, onSignOut, onOpenSidebar, isLanding = false
}) => {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { t } = useLang();
  
  
  const isDashboard = pathname === '/';

  return (
    <>
      <header 
        className={cn(
          "sticky top-0 z-[140] transition-all duration-700 pt-[env(safe-area-inset-top,0px)] will-change-[transform,opacity] admin-hide header-reading-auto-hide border-b border-primary/[0.005]",
          isLanding && !user ? "bg-transparent border-none py-spacing-lg" : "bg-background/20 backdrop-blur-3xl h-spacing-2xl md:h-spacing-3xl"
        )}
        role="banner"
      >
        <div className={cn("app-container flex items-center justify-between py-spacing-2xs", !isLanding || user ? "h-full" : "")}>

          {/* Logo Section - Minimalist on Mobile */}
          <div 
            className="flex items-center gap-spacing-xs md:gap-spacing-sm cursor-pointer group focus-visible:ring-1 focus-visible:ring-primary/20 outline-none rounded-full" 
            role="link" 
            aria-label="Ir para a página inicial do Cathedra"
            tabIndex={0} 
            onKeyDown={(e) => e.key === 'Enter' && navigate('/')} 
            onClick={() => navigate('/')}
          >
            <Icons.Logo className="w-spacing-md h-spacing-md md:w-spacing-md md:h-spacing-md transition-all group-hover:scale-110 opacity-30 group-hover:opacity-60" variant={isDark ? "light" : "dark"} />
            <div className="flex flex-col items-start min-w-0">
              <span className="text-[9px] md:text-[11px] font-black uppercase tracking-[0.6em] text-primary/10 leading-none transition-all group-hover:text-primary group-hover:tracking-[0.8em] duration-700">
                Cathedra
              </span>
            </div>
          </div>

          {/* Navigation & Controls Section */}
          <div className="flex items-center justify-end gap-spacing-2xs md:gap-spacing-lg">
            <div className="flex items-center gap-spacing-2xs md:gap-spacing-md lg:gap-spacing-lg">

              {!isDashboard && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => navigate(-1)}
                  className="w-spacing-xl h-spacing-xl md:w-spacing-xl md:h-spacing-xl rounded-full border border-primary/5 hover:bg-primary/[0.02] transition-all duration-300 tap-premium"
                  aria-label={t('back') || 'Voltar'}
                >
                  <Icons.ChevronLeft className="w-spacing-md h-spacing-md md:w-spacing-md md:h-spacing-md opacity-50 group-hover:opacity-100 transition-opacity" />
                </Button>
              )}

              <div className="flex items-center gap-spacing-2xs md:gap-spacing-md">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => (window as any).dispatchEvent(new CustomEvent('open-command-center'))}
                  className="w-spacing-lg h-spacing-lg md:w-spacing-2xl md:h-spacing-2xl rounded-full hover:bg-primary/[0.03] transition-all duration-300 group tap-premium"
                  aria-label={t('search') || 'Buscar'}
                >
                  <Icons.Search className="w-spacing-md h-spacing-md md:w-spacing-md md:h-spacing-md opacity-60 group-hover:opacity-100 transition-opacity" />
                </Button>

                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onToggleDark}
                  className="w-spacing-xl h-spacing-xl md:w-spacing-2xl md:h-spacing-2xl rounded-full hover:bg-primary/[0.03] transition-all duration-300 group hidden md:flex"
                  aria-label={isDark ? "Ativar modo claro" : "Ativar modo escuro"}
                >
                  {isDark ? 
                    <Icons.Sun className="w-spacing-md h-spacing-md opacity-70" /> : 
                    <Icons.Moon className="w-spacing-md h-spacing-md opacity-70" />
                  }
                </Button>
              </div>

              <div className="flex items-center gap-spacing-2xs md:gap-spacing-md">
                {/* Desktop-only Profile */}
                <div className="flex md:block">
                  {user ? (
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => navigate(AppRoute.PROFILE)}
                      className="w-spacing-xl h-spacing-xl md:w-spacing-2xl md:h-spacing-2xl rounded-full border-primary/10 hover:border-primary/20 overflow-hidden bg-primary/[0.03] tap-premium"
                    >
                      {user.avatar ? (
                        <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
                      ) : (
                        <Icons.User className="w-spacing-md h-spacing-md md:w-spacing-md md:h-spacing-md opacity-70" />
                      )}
                    </Button>
                  ) : (
                    <Button 
                      onClick={() => navigate(AppRoute.LOGIN)} 
                      className="h-spacing-xl md:h-spacing-2xl px-spacing-md md:px-spacing-xl rounded-full text-[8px] md:text-[10px] font-bold uppercase tracking-[0.2em] md:tracking-[0.3em] bg-primary text-primary-foreground hover:bg-primary/90 transition-all shadow-premium shadow-primary/10"
                    >
                      {t('enter')}
                    </Button>
                  )}
                </div>

              </div>
            </div>

            {/* Desktop Navigation Links - Hidden on Mobile and Tablet to avoid duplication with BottomNav */}
            {isDashboard && (
              <nav className="hidden lg:flex items-center gap-spacing-xs border-l border-primary/10 pl-spacing-xl ml-spacing-md" aria-label="Navegação principal">
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
                    className={`px-spacing-md py-spacing-xs h-auto text-[10px] font-bold uppercase tracking-[0.3em] transition-all relative group ${
                      pathname === item.route ? 'text-primary font-medium' : 'text-muted-foreground/60 hover:text-primary'
                    }`}
                  >
                    {item.label}
                    {pathname === item.route && (
                      <motion.div layoutId="nav-active" className="absolute -bottom-spacing-2xs left-spacing-2xs/2 -translate-x-1/2 w-spacing-2xs h-spacing-2xs rounded-full bg-primary" />
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