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
          isLanding && !user ? "bg-transparent border-none py-lg" : "bg-background/20 backdrop-blur-3xl h-2xl md:h-3xl"
        )}
        role="banner"
      >
        <div className={cn("app-container flex items-center justify-between py-2xs", !isLanding || user ? "h-full" : "")}>

          {/* Logo Section - Minimalist on Mobile */}
          <div 
            className="flex items-center gap-xs md:gap-sm cursor-pointer group focus-visible:ring-1 focus-visible:ring-primary/20 outline-none rounded-full" 
            role="link" 
            aria-label="Ir para a página inicial do Cathedra"
            tabIndex={0} 
            onKeyDown={(e) => e.key === 'Enter' && navigate('/')} 
            onClick={() => navigate('/')}
          >
            <Icons.Logo className="w-md h-md md:w-md md:h-md transition-all group-hover:scale-110 opacity-30 group-hover:opacity-60" variant={isDark ? "light" : "dark"} />
            <div className="flex flex-col items-start min-w-0">
              <span className="text-[9px] md:text-[11px] font-black uppercase tracking-[0.6em] text-primary/10 leading-none transition-all group-hover:text-primary group-hover:tracking-[0.8em] duration-700">
                Cathedra
              </span>
            </div>
          </div>

          {/* Navigation & Controls Section */}
          <div className="flex items-center justify-end gap-2xs md:gap-lg">
            <div className="flex items-center gap-2xs md:gap-md lg:gap-lg">

              {!isDashboard && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => navigate(-1)}
                  className="w-xl h-xl md:w-xl md:h-xl rounded-full border border-primary/5 hover:bg-primary/[0.02] transition-all duration-300 tap-premium"
                  aria-label={t('back') || 'Voltar'}
                >
                  <Icons.ChevronLeft className="w-md h-md md:w-md md:h-md opacity-50 group-hover:opacity-100 transition-opacity" />
                </Button>
              )}

              <div className="flex items-center gap-2xs md:gap-md">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => (window as any).dispatchEvent(new CustomEvent('open-command-center'))}
                  className="w-lg h-lg md:w-2xl md:h-2xl rounded-full hover:bg-primary/[0.03] transition-all duration-300 group tap-premium"
                  aria-label={t('search') || 'Buscar'}
                >
                  <Icons.Search className="w-md h-md md:w-md md:h-md opacity-60 group-hover:opacity-100 transition-opacity" />
                </Button>

                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onToggleDark}
                  className="w-xl h-xl md:w-2xl md:h-2xl rounded-full hover:bg-primary/[0.03] transition-all duration-300 group hidden md:flex"
                  aria-label={isDark ? "Ativar modo claro" : "Ativar modo escuro"}
                >
                  {isDark ? 
                    <Icons.Sun className="w-md h-md opacity-70" /> : 
                    <Icons.Moon className="w-md h-md opacity-70" />
                  }
                </Button>
              </div>

              <div className="flex items-center gap-2xs md:gap-md">
                {/* Desktop-only Profile */}
                <div className="flex md:block">
                  {user ? (
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => navigate(AppRoute.PROFILE)}
                      className="w-xl h-xl md:w-2xl md:h-2xl rounded-full border-primary/10 hover:border-primary/20 overflow-hidden bg-primary/[0.03] tap-premium"
                    >
                      {user.avatar ? (
                        <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
                      ) : (
                        <Icons.User className="w-md h-md md:w-md md:h-md opacity-70" />
                      )}
                    </Button>
                  ) : (
                    <Button 
                      onClick={() => navigate(AppRoute.LOGIN)} 
                      className="h-xl md:h-2xl px-md md:px-xl rounded-full text-[8px] md:text-[10px] font-bold uppercase tracking-[0.2em] md:tracking-[0.3em] bg-primary text-primary-foreground hover:bg-primary/90 transition-all shadow-premium shadow-primary/10"
                    >
                      {t('enter')}
                    </Button>
                  )}
                </div>

              </div>
            </div>

            {/* Desktop Navigation Links - Hidden on Mobile and Tablet to avoid duplication with BottomNav */}
            {isDashboard && (
              <nav className="hidden lg:flex items-center gap-xs border-l border-primary/10 pl-xl ml-md" aria-label="Navegação principal">
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
                    className={`px-md py-xs h-auto text-[10px] font-bold uppercase tracking-[0.3em] transition-all relative group ${
                      pathname === item.route ? 'text-primary font-medium' : 'text-muted-foreground/60 hover:text-primary'
                    }`}
                  >
                    {item.label}
                    {pathname === item.route && (
                      <motion.div layoutId="nav-active" className="absolute -bottom-2xs left-2xs/2 -translate-x-1/2 w-2xs h-2xs rounded-full bg-primary" />
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