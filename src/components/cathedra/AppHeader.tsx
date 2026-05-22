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
    <header className="border-b border-border/5 bg-background/60 backdrop-blur-3xl sticky top-0 z-[140] transition-all pt-[env(safe-area-inset-top,0px)] will-change-[transform,background-color]">
      <div className="app-container flex items-center justify-between h-20 sm:h-24">
        <div className="flex items-center gap-8 min-w-0">
          <div className="flex items-center gap-3 cursor-pointer group focus-visible:ring-2 focus-visible:ring-primary/20 outline-none" role="button" tabIndex={0} onKeyDown={(e) => e.key === 'Enter' && navigate('/')} onClick={() => navigate('/')}>
            <Icons.Logo className="w-10 h-10 transition-all duration-700 group-hover:scale-105" variant="blue" />
            <div className="flex flex-col min-w-0">
              <span className="text-xl font-display font-medium uppercase tracking-[0.4em] text-primary leading-none group-hover:tracking-[0.45em] transition-all duration-1000">Cathedra</span>
            </div>
          </div>
          
          {!isDashboard && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate(-1)}
              className="h-10 px-4 rounded-full border-border/10 hover:bg-primary/5"
            >
              <Icons.ChevronLeft className="w-4 h-4" />
              <span className="text-[10px] font-bold uppercase tracking-widest hidden sm:inline-block ml-2">{t('back')}</span>
            </Button>
          )}

          {isDashboard && (
            <nav className="hidden xl:flex items-center gap-2 border-l border-border/10 pl-8 ml-4">
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
                    pathname === item.route ? 'text-primary' : 'text-muted-foreground/40 hover:text-primary'
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
            className="w-10 h-10 sm:w-12 sm:h-12 rounded-full border-border/10"
          >
            <Icons.Search className="w-5 h-5 opacity-40" />
          </Button>

          <Button
            variant="outline"
            size="icon"
            onClick={onToggleDark}
            className="w-10 h-10 sm:w-12 sm:h-12 rounded-full border-border/10"
          >
            {isDark ? <Icons.Sun className="w-5 h-5 opacity-40" /> : <Icons.Moon className="w-5 h-5 opacity-40" />}
          </Button>

          {user ? (
            <Button
              variant="outline"
              size="icon"
              onClick={() => navigate(AppRoute.PROFILE)}
              className="w-10 h-10 sm:w-12 sm:h-12 rounded-full border-border/10 overflow-hidden"
            >
              {user.avatar ? (
                <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
              ) : (
                <Icons.User className="w-5 h-5 opacity-40" />
              )}
            </Button>
          ) : (
            <Button 
              onClick={() => navigate(AppRoute.LOGIN)} 
              className="h-10 px-6 rounded-full text-[10px] font-bold uppercase tracking-widest"
            >
              {t('enter')}
            </Button>
          )}

          <Button
            variant="outline"
            size="icon"
            onClick={onOpenSidebar}
            className="w-10 h-10 sm:w-12 sm:h-12 rounded-full border-border/10 lg:hidden"
          >
            <Icons.Menu className="w-5 h-5 opacity-40" />
          </Button>
        </div>
      </div>
    </header>
  );
});

AppHeader.displayName = 'AppHeader';

export default AppHeader;
