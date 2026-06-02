import { Button } from '@/components/ui/button';
import React, { useState, useEffect, useCallback, memo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { prefetchRoute } from '@/lib/prefetch';
import { Icons, NAV_ITEMS } from '../../constants';
import { AppRoute, User } from '../../types';
import { getCacheStats } from '@/lib/offlineCache';
import { useLang } from '@/hooks/useLang';
import { useReadingSettings } from '@/contexts/ReadingSettingsContext';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
  isDark?: boolean;
  onToggleDark?: () => void;
  isHighContrast?: boolean;
  onToggleHighContrast?: () => void;
  isSpeaking?: boolean;
  onToggleSpeak?: () => void;
  onOpenA11y?: () => void;
  onSignOut?: () => void;
}

const Sidebar = memo(({ isOpen, onClose, user, isDark, onToggleDark, isHighContrast, onToggleHighContrast, isSpeaking, onToggleSpeak, onOpenA11y, onSignOut }: SidebarProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const currentPath = location.pathname;
  const { lang, t } = useLang();
  const [cacheCount, setCacheCount] = useState<number | null>(null);
  const { settings } = useReadingSettings();

  const sidebarRef = React.useRef<HTMLElement>(null);
  const closeButtonRef = React.useRef<HTMLButtonElement>(null);

  useEffect(() => {
    getCacheStats().then(stats => setCacheCount(stats.total));
    
    const handleCacheUpdate = () => {
      getCacheStats().then(stats => setCacheCount(stats.total));
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      if (e.key === 'Escape') {
        onClose();
        return;
      }

      const focusableElements = sidebarRef.current?.querySelectorAll(
        'button:not([disabled]), [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      
      if (!focusableElements || focusableElements.length === 0) return;

      const firstElement = focusableElements[0] as HTMLElement;
      const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;
      const currentIndex = Array.from(focusableElements).indexOf(document.activeElement as HTMLElement);

      // Focus Trap
      if (e.key === 'Tab') {
        if (e.shiftKey) {
          if (document.activeElement === firstElement) {
            lastElement.focus();
            e.preventDefault();
          }
        } else {
          if (document.activeElement === lastElement) {
            firstElement.focus();
            e.preventDefault();
          }
        }
      }

      // Arrow Key Navigation
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault();
        let nextIndex = e.key === 'ArrowDown' ? currentIndex + 1 : currentIndex - 1;
        
        if (nextIndex >= focusableElements.length) nextIndex = 0;
        if (nextIndex < 0) nextIndex = focusableElements.length - 1;
        
        (focusableElements[nextIndex] as HTMLElement).focus();
      }
    };

    window.addEventListener('cathedra_cache_updated', handleCacheUpdate);
    window.addEventListener('keydown', handleKeyDown);

    if (isOpen) {
      document.body.style.overflow = 'hidden';
      // Focus close button on open for immediate exit capability
      setTimeout(() => {
        closeButtonRef.current?.focus();
      }, 100);
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      window.removeEventListener('cathedra_cache_updated', handleCacheUpdate);
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);
  
  const sections = [
    ...(user?.role === 'admin' ? [{
      label: t('admin'),
      items: [
        { label: 'Painel Administrativo', path: AppRoute.ADMIN, icon: <Icons.ShieldCheck /> },
        { label: 'Segurança & Logs', path: '/admin/security', icon: <Icons.Lock /> },

      ]

    }] : []),
    {
      label: 'Peregrinação',
      items: [
        { label: 'O Meu Dia', path: AppRoute.HOJE, icon: <Icons.Sun /> },
        { label: 'Minha Jornada', path: AppRoute.DIARIO, icon: <Icons.BookOpen /> },
        { label: 'Favoritos', path: AppRoute.FAVORITES, icon: <Icons.Heart /> },
      ]
    },
    {
      label: 'Portal Sagrado',
      items: [
        { label: 'Bíblia Sagrada', path: AppRoute.BIBLE, icon: <Icons.Bible /> },
        { label: 'Catecismo', path: AppRoute.CATECHISM, icon: <Icons.Catechism /> },
        { label: 'Logos IA', path: '/logos', icon: <Icons.Sparkles /> },
        { label: 'Magistério', path: AppRoute.MAGISTERIUM, icon: <Icons.Magisterium /> },
      ]
    },
    {
      label: 'Tesouros da Fé',
      items: [
        { label: 'Santos & Papas', path: AppRoute.SAINTS, icon: <Icons.Saints /> },
        { label: 'Liturgia & Missal', path: AppRoute.LITURGIA, icon: <Icons.ScrollText /> },
        { label: 'Biblioteca', path: AppRoute.BIBLIOTECA, icon: <Icons.Library /> },
        { label: 'Temas', path: AppRoute.TEMAS, icon: <Icons.Themes /> },
      ]
    },
    {
      label: 'Sistema',
      items: [
        { label: 'Pricing', path: AppRoute.PRICING, icon: <Icons.Award /> },
        { label: 'Configurações', path: '/settings', icon: <Icons.Settings /> },
        { label: 'Sobre o Cathedra', path: AppRoute.ABOUT, icon: <Icons.Info /> },
      ]
    }


  ];

  const handleNav = useCallback((target: string | { path: string; onClick?: () => void }) => {
    if (typeof target === 'object' && target.onClick) {
      target.onClick();
    } else {
      const path = typeof target === 'string' ? target : target.path;
      if (path !== '#') {
        navigate(path);
        onClose();
      }
    }
  }, [navigate, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Elegant Overlay Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8, ease: [0.19, 1, 0.22, 1] }}
            onClick={onClose}
            className="fixed inset-0 bg-background/20 backdrop-blur-md z-[165] will-change-opacity"
            aria-hidden="true"
          />

          {/* Premium Retractable Sidebar - Refined for a more elegant, floating feel */}
          <motion.aside
            ref={sidebarRef}
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={{ left: 0.1, right: 0 }}
            onDragEnd={(_, info) => {
              if (info.offset.x < -100 || info.velocity.x < -500) {
                onClose();
              }
            }}
            initial={{ x: '-100%', opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: '-100%', opacity: 0 }}
            transition={{ 
              duration: settings.reduceAnimations ? 0.3 : 0.6, 
              ease: [0.16, 1, 0.3, 1] 
            }}
            className="fixed top-spacing-0 left-0 bottom-spacing-0 w-[min(280px,85vw)] bg-background/98 backdrop-blur-2xl border-r border-primary/[0.02] flex flex-col p-spacing-lg z-[170] shadow-premium-none overflow-hidden admin-hide touch-none pt-[calc(1rem+env(safe-area-inset-top,0px))] pb-[calc(1rem+env(safe-area-inset-bottom,0px))] will-change-transform"
            role="dialog"
            aria-modal="true"
            aria-label={t('navigation_menu') || 'Menu de navegação'}
            tabIndex={-1}
          >
            {/* Mobile Header - Cinematic extension of the atmosphere */}
            <header className="flex items-center justify-between mb-spacing-md pb-spacing-xs border-b border-primary/[0.01] dark:border-white/[0.01]">
              <div 
                className="flex items-center gap-spacing-md cursor-pointer group outline-none" 
                onClick={() => handleNav('/')}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => e.key === 'Enter' && handleNav('/')}
              >
                <div className="w-spacing-xl h-spacing-xl rounded-premium bg-primary/[0.01] dark:bg-white/[0.01] flex items-center justify-center p-spacing-xs group-hover:scale-105 transition-transform duration-2000">
                  <Icons.Logo className="w-full h-full opacity-40 dark:opacity-20" variant={isDark ? "light" : "dark"} aria-hidden="true" />
                </div>
                <div className="space-y-spacing-3xs">
                  <h1 className="text-[10px] font-display font-light tracking-[0.5em] text-primary/40 leading-none uppercase">CATHEDRA</h1>
                  <p className="text-[6.5px] font-bold uppercase text-primary/10 tracking-[0.6em]">
                    Sacrum Archivum
                  </p>
                </div>
              </div>

              <Button
                ref={closeButtonRef}
                variant="ghost"
                size="icon"
                onClick={onClose}
                className="rounded-premium-full w-spacing-xl h-spacing-xl text-muted-foreground/10 hover:text-primary hover:bg-primary/[0.02] transition-all focus-visible:ring-1"
                aria-label="Fechar menu"
              >
                <Icons.X className="w-spacing-sm h-spacing-sm" />
              </Button>
            </header>

            <nav className="flex-1 space-y-spacing-xs overflow-y-auto pb-spacing-md no-scrollbar pr-spacing-2xs" role="navigation">
              {sections.map((section, sectionIdx) => (section.items.length > 0 && (
                <Collapsible key={section.label} defaultOpen={sectionIdx < 3}>
                  <CollapsibleTrigger asChild>
                    <button className="w-full flex items-center justify-between py-spacing-xs px-spacing-md group/trigger hover:bg-primary/[0.02] rounded-premium transition-all">
                      <h3 className="text-[7px] font-black uppercase tracking-[0.8em] text-primary/30 group-hover/trigger:text-primary transition-colors italic">/ {section.label}</h3>
                      <Icons.ChevronDown className="w-spacing-sm h-spacing-sm text-primary/10 group-hover/trigger:text-primary transition-all group-data-[state=open]:rotate-180" strokeWidth={1} />
                    </button>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <motion.div 
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="overflow-hidden"
                    >
                      <ul className="space-y-spacing-2xs mt-spacing-2xs">
                        {section.items.map((item, idx) => {
                          const isActive = currentPath === item.path || (item.path !== '/' && currentPath.startsWith(item.path));
                          return (
                            <li key={idx}>
                              <Button
                                variant="ghost"
                                onClick={() => handleNav(item)}
                                onMouseEnter={() => prefetchRoute(item.path)}
                                onTouchStart={() => prefetchRoute(item.path)}
                                 aria-current={isActive ? 'page' : undefined}
                                 aria-label={`${item.label}${isActive ? ', página atual' : ''}`}
                                className={`w-full flex items-center justify-start gap-spacing-md px-spacing-md py-spacing-2xs rounded-premium text-[8.5px] font-bold transition-all duration-1200 outline-none h-auto min-h-[40px]
                                  ${isActive
                                    ? 'bg-primary/[0.005] dark:bg-white/[0.005] text-primary shadow-premium-none'
                                    : 'text-muted-foreground/10 dark:text-muted-foreground/5 hover:bg-primary/[0.001] dark:hover:bg-white/[0.001] hover:text-primary'}`}
                              >
                                  <span className={`transition-all duration-700 transform ${isActive ? 'opacity-90 scale-105' : 'opacity-50'}`}>
                                    {React.cloneElement(item.icon as React.ReactElement, { size: 20, strokeWidth: isActive ? 1.5 : 1.2, "aria-hidden": "true" })}
                                  </span>
                                <span className={`tracking-[0.1em] uppercase truncate transition-opacity duration-700 ${isActive ? 'opacity-100' : 'opacity-60'}`}>{item.label}</span>
                                {item.path === AppRoute.CACHE_MANAGER && cacheCount !== null && cacheCount > 0 && (
                                  <span className="ml-auto bg-primary/10 text-primary text-[7px] font-black px-spacing-2xs py-spacing-3xs rounded-premium-full flex-shrink-0">
                                    {cacheCount}
                                  </span>
                                )}
                                {(item as any).pro && <span className="ml-auto text-[6px] font-black uppercase tracking-widest text-primary/40 bg-primary/[0.03] px-spacing-2xs py-spacing-3xs rounded flex-shrink-0">PRO</span>}
                                {isActive && <motion.div layoutId="sidebar-active" className="ml-auto w-spacing-3xs h-spacing-3xs rounded-premium-full bg-primary/40 flex-shrink-0" />}
                              </Button>
                            </li>
                          );
                        })}
                      </ul>
                    </motion.div>
                  </CollapsibleContent>
                </Collapsible>
              )))}
            </nav>

            <div className="pt-spacing-md mt-auto space-y-spacing-md">
              <div className="flex flex-col gap-spacing-sm">
                <div className="grid grid-cols-2 gap-spacing-xs">
                  <Button 
                    variant="ghost"
                    onClick={onToggleDark} 
                    className="h-spacing-xl rounded-premium border border-primary/[0.01] dark:border-white/[0.01] bg-primary/[0.01] dark:bg-white/[0.01] flex items-center justify-center gap-spacing-xs transition-all hover:bg-primary/5 dark:hover:bg-white/5 group/btn"
                    aria-label={isDark ? "Modo Claro" : "Modo Escuro"}
                  >
                    {isDark ? <Icons.Sun className="w-spacing-sm h-spacing-sm text-primary/40 group-hover/btn:text-primary transition-colors" /> : <Icons.Moon className="w-spacing-sm h-spacing-sm opacity-30 group-hover/btn:opacity-60 transition-opacity" />}
                    <span className="text-[7.5px] font-black uppercase tracking-widest text-muted-foreground/40 group-hover/btn:text-muted-foreground/80 transition-colors">{isDark ? 'Claro' : 'Escuro'}</span>
                  </Button>

                  <Button 
                    variant="ghost"
                    data-testid="a11y-trigger"
                    onClick={onOpenA11y} 
                    className={`h-spacing-xl rounded-premium border flex items-center justify-center gap-spacing-xs transition-all ${
                      isHighContrast 
                        ? 'bg-primary/10 border-primary/20 text-primary' 
                        : 'border-primary/[0.01] dark:border-white/[0.01] bg-primary/[0.01] dark:bg-white/[0.01] text-muted-foreground/30 hover:bg-primary/5'
                    }`}
                  >
                    <Icons.ShieldCheck className="w-spacing-sm h-spacing-sm" />
                    <span className="text-[7.5px] font-black uppercase tracking-widest">A11y</span>
                  </Button>
                </div>

                {!settings.totalSilence && (
                  <Button 
                    variant="ghost"
                    onClick={onToggleSpeak} 
                    className={`w-full h-spacing-xl rounded-premium border flex items-center justify-center gap-spacing-sm transition-all ${
                      isSpeaking 
                        ? 'bg-primary/10 border-primary/20 text-primary' 
                        : 'border-primary/[0.01] dark:border-white/[0.01] bg-primary/[0.01] dark:bg-white/[0.01] text-muted-foreground/30 hover:bg-primary/5'
                    }`}
                  >
                    {isSpeaking ? <Icons.MessageCircle className="w-spacing-sm h-spacing-sm animate-pulse" /> : <Icons.Volume2 className="w-spacing-sm h-spacing-sm" />}
                    <span className="text-[7.5px] font-black uppercase tracking-widest">{isSpeaking ? 'Parar' : 'Ouvir'}</span>
                  </Button>
                )}

                <div className="flex flex-wrap gap-spacing-2xs justify-center mt-spacing-xs">
                  {(['pt', 'en', 'es', 'la'] as const).map((l) => (
                    <button
                      key={l}
                      onClick={() => (window as any).dispatchEvent(new CustomEvent('change-lang', { detail: l }))}
                      className={`px-spacing-sm py-spacing-2xs text-[7px] font-black uppercase rounded-premium-lg border transition-all ${
                        lang === l 
                          ? 'bg-primary/5 text-primary border-primary/10 shadow-premium-none' 
                          : 'bg-transparent text-muted-foreground/20 border-transparent hover:border-primary/5'
                      }`}
                    >
                      {l}
                    </button>
                  ))}
                </div>

                <div className="flex justify-center gap-spacing-lg py-spacing-xs mt-spacing-xs">
                  <a href="#" className="text-muted-foreground/20 hover:text-primary/60 transition-colors"><Icons.Instagram size={14} /></a>
                  <a href="#" className="text-muted-foreground/20 hover:text-primary/60 transition-colors"><Icons.Youtube size={14} /></a>
                  <a href="#" className="text-muted-foreground/20 hover:text-primary/60 transition-colors"><Icons.Whatsapp size={14} /></a>
                </div>
              </div>

              {user ? (
                <div className="p-spacing-md bg-primary/[0.01] dark:bg-white/[0.005] rounded-[2rem] border border-primary/[0.01] dark:border-white/[0.01]">
                  <div 
                    onClick={() => handleNav(AppRoute.PROFILE)} 
                    className="flex items-center gap-spacing-sm cursor-pointer group"
                  >
                    <div className="w-spacing-xl h-spacing-xl rounded-premium bg-primary/90 flex items-center justify-center text-primary-foreground font-bold shadow-premium-none group-hover:scale-105 transition-transform overflow-hidden">
                      {user.avatar ? (
                        <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-premium-xs">{user.name.charAt(0).toUpperCase()}</span>
                      )}
                    </div>
                    <div className="flex-1 min-w-spacing-0">
                      <p className="text-[10px] font-bold truncate text-primary/70">{user.name}</p>
                      <p className="text-[7px] uppercase text-primary/30 font-bold tracking-[0.1em] mt-spacing-3xs">{user.isPremium ? 'Membro Premium' : 'Conta Gratuita'}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between gap-spacing-xs mt-spacing-md">
                    {!user.isPremium && (
                      <Button 
                        onClick={() => handleNav(AppRoute.UPGRADE)}
                        className="flex-1 h-spacing-xl bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground rounded-premium-lg text-[8px] font-bold uppercase tracking-widest transition-all"
                      >
                        Upgrade
                      </Button>
                    )}
                    <Button 
                      variant="ghost"
                      size="icon"
                      onClick={onSignOut}
                      className="h-spacing-xl w-spacing-xl rounded-premium-lg text-muted-foreground/20 hover:text-destructive/60 hover:bg-destructive/5 transition-colors"
                    >
                      <Icons.LogOut className="w-spacing-sm h-spacing-sm" />
                    </Button>
                  </div>
                </div>
              ) : (
                <Button onClick={() => handleNav(AppRoute.LOGIN)} className="w-full h-spacing-2xl bg-primary/90 hover:bg-primary text-primary-foreground rounded-premium font-bold uppercase text-[9px] tracking-[0.2em] transition-all">
                  {t('enter')}
                </Button>
              )}
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
});

Sidebar.displayName = 'Sidebar';

export default Sidebar;