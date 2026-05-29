import { Button } from '@/components/ui/button';
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { prefetchRoute } from '@/lib/prefetch';
import { Icons } from '../../constants';
import { AppRoute, User } from '../../types';
import { getCacheStats } from '@/lib/offlineCache';
import { useLang } from '@/hooks/useLang';
import { useReadingSettings } from '@/contexts/ReadingSettingsContext';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/useIsMobile';


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
  onSignOut?: () => void;
}

const Sidebar = React.memo(({ isOpen, onClose, user, isDark, onToggleDark, isHighContrast, onToggleHighContrast, isSpeaking, onToggleSpeak, onSignOut }: SidebarProps) => {
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
      label: 'Hoje',
      items: [
        { label: 'Hoje', path: AppRoute.HOJE, icon: <Icons.Sun /> },
        { label: 'Perfil Espiritual', path: '/spiritual-profile', icon: <Icons.User /> },
        { label: 'Diário Espiritual', path: AppRoute.DIARIO, icon: <Icons.BookOpen /> },
        { label: 'Favoritos', path: AppRoute.FAVORITES, icon: <Icons.Heart /> },
        { label: 'Conquistas', path: AppRoute.ACHIEVEMENTS, icon: <Icons.Award /> },
      ]
    },
    {
      label: 'Portal Sagrado',
      items: [
        { label: t('bible'), path: AppRoute.BIBLE, icon: <Icons.Bible /> },
        { label: t('catechism'), path: AppRoute.CATECHISM, icon: <Icons.Catechism /> },
        { label: 'Magistério', path: AppRoute.MAGISTERIUM, icon: <Icons.ScrollText /> },
        { label: 'Logos IA', path: AppRoute.LOGOS, icon: <Icons.Sparkles /> },
        { label: 'Estudo', path: AppRoute.STUDY_MODE, icon: <Icons.Feather /> },
        { label: 'Busca Global', path: AppRoute.BUSCAR, onClick: () => { onClose(); (window as any).dispatchEvent(new CustomEvent('open-command-center')); }, icon: <Icons.Search /> },
      ]
    },
    {
      label: 'Biblioteca',
      items: [
        { label: 'Biblioteca', path: AppRoute.BIBLIOTECA, icon: <Icons.Library /> },
        { label: 'Temas', path: AppRoute.TEMAS, icon: <Icons.Themes /> },
        { label: 'Enciclopédia', path: AppRoute.ENCYCLOPEDIA, icon: <Icons.Glossary /> },
        { label: 'Glossário', path: AppRoute.GLOSSARY, icon: <Icons.Type /> },
        { label: 'Aquinas Opera', path: AppRoute.AQUINAS_OPERA, icon: <Icons.Feather /> },
        { label: 'Guia de Módulos', path: AppRoute.MODULES_GUIDE, icon: <Icons.Compass /> },
      ]
    },
    {
      label: 'Santos & Devoções',
      items: [
        { label: 'Santos', path: AppRoute.SAINTS, icon: <Icons.Saints /> },
        { label: 'Papas', path: AppRoute.POPES, icon: <Icons.Creator /> },
        { label: 'Aparições', path: AppRoute.APARICOES, icon: <Icons.Sparkles /> },
        { label: 'Dogmas', path: AppRoute.DOGMAS, icon: <Icons.ShieldCheck /> },
      ]
    },
    {
      label: 'Liturgia & Oração',
      items: [
        { label: 'Liturgia', path: AppRoute.LITURGIA, icon: <Icons.ScrollText /> },
        { label: 'Calendário', path: AppRoute.LITURGICAL_CALENDAR, icon: <Icons.Calendar /> },
        { label: 'Missal', path: AppRoute.MISSAL, icon: <Icons.BookOpen /> },
        { label: 'Breviário', path: AppRoute.BREVIARY, icon: <Icons.Clock /> },
        { label: 'Rosário', path: AppRoute.ROSARY, icon: <Icons.Heart /> },
        { label: 'Via Crucis', path: AppRoute.VIA_CRUCIS, icon: <Icons.Cross /> },
        { label: 'Ladainhas', path: AppRoute.LITANIES, icon: <Icons.Music /> },
        { label: 'Oração', path: AppRoute.ORACAO, icon: <Icons.Oracao /> },
        { label: 'Lectio Divina', path: AppRoute.LECTIO_DIVINA, icon: <Icons.BookOpen /> },
        { label: 'Confissão', path: AppRoute.POENITENTIA, icon: <Icons.Feather /> },
      ]
    },
    {
      label: 'Jornadas',
      items: [
        { label: 'Jornadas', path: AppRoute.JORNADAS, icon: <Icons.Journeys /> },
        { label: 'Itineraria', path: AppRoute.ITINERARIA, icon: <Icons.Compass /> },
      ]
    },
    {
      label: 'Comunidade',
      items: [
        { label: 'Comunidade', path: AppRoute.COMMUNITY, icon: <Icons.Users /> },
        { label: 'Parceiros', path: AppRoute.PARTNERS, icon: <Icons.Heart /> },
        { label: 'Transparência', path: AppRoute.TRANSPARENCY, icon: <Icons.ShieldCheck /> },
      ]
    },
    {
      label: 'Conta',
      items: [
        { label: 'Pricing', path: AppRoute.PRICING, icon: <Icons.Award /> },
        { label: 'Sobre', path: AppRoute.ABOUT, icon: <Icons.Info /> },
        { label: 'Termos', path: AppRoute.TERMS, icon: <Icons.ShieldCheck /> },
        { label: 'Privacidade', path: AppRoute.PRIVACY, icon: <Icons.Lock /> },
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

  const isMobile = useIsMobile();

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Elegant Overlay Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            onClick={onClose}
            className="fixed inset-0 bg-neutral-950/20 backdrop-blur-sm z-[145]"
            aria-hidden="true"
          />

          {/* Premium Retractable Sidebar - Refined for a more elegant, floating feel */}
          <motion.aside
            ref={sidebarRef}
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={{ left: 0.05, right: 0 }}
            onDragEnd={(_, info) => {
              if (info.offset.x < -60 || info.velocity.x < -300) {
                onClose();
              }
            }}
            initial={{ x: '-100%', opacity: 0, scale: 0.98 }}
            animate={{ x: 0, opacity: 1, scale: 1 }}
            exit={{ x: '-100%', opacity: 0, scale: 0.98 }}
            transition={{ 
              duration: settings.reduceAnimations ? 0.3 : 0.6, 
              ease: [0.22, 1, 0.36, 1] 
            }}
            className={cn(
              "fixed top-6 left-6 bottom-6 w-[75vw] sm:w-[300px] bg-white/70 dark:bg-neutral-950/70 border border-black/[0.01] dark:border-white/[0.01] rounded-[3rem] flex flex-col p-10 z-[150] shadow-none overflow-hidden admin-hide touch-none pt-[calc(3rem+env(safe-area-inset-top,0px))] pb-[calc(2.5rem+env(safe-area-inset-bottom,0px))]",
              isMobile ? "backdrop-blur-xl" : "backdrop-blur-[60px]"
            )}
            role="dialog"
            aria-modal="true"
            aria-label={t('navigation_menu') || 'Menu de navegação'}
            tabIndex={-1}
          >

            {/* Mobile Header - More dedicated and sophisticated */}
            <header className="flex items-center justify-between mb-10">
              <div 
                className="flex items-center gap-4 cursor-pointer group outline-none" 
                onClick={() => handleNav('/')}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => e.key === 'Enter' && handleNav('/')}
              >
                <div className="w-10 h-10 rounded-[1.2rem] bg-primary/[0.02] dark:bg-white/[0.01] flex items-center justify-center p-2.5 group-hover:scale-105 transition-all duration-1000 border border-primary/[0.03] dark:border-white/[0.03]">
                  <Icons.Logo className="w-full h-full opacity-60 dark:opacity-40" variant={isDark ? "light" : "dark"} />
                </div>
                <div className="space-y-1">
                  <h1 className="text-[12px] font-display font-light tracking-[0.4em] text-primary leading-none uppercase">CATHEDRA</h1>
                  <p className="text-[6.5px] font-bold uppercase text-primary/30 tracking-[0.3em]">
                    Sacrum Archivum
                  </p>
                </div>
              </div>

              <Button
                ref={closeButtonRef}
                variant="ghost"
                size="icon"
                onClick={onClose}
                className="rounded-full w-8 h-8 text-muted-foreground/30 hover:text-primary hover:bg-primary/5 transition-all focus-visible:ring-1"
                aria-label="Fechar menu"
              >
                <Icons.X className="w-4 h-4" />
              </Button>
            </header>

            <nav className="flex-1 space-y-5 overflow-y-auto pb-6 no-scrollbar pr-2" role="navigation">
              {sections.map((section, sectionIdx) => (section.items.length > 0 && (
                <motion.div 
                  key={section.label}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ 
                    delay: settings.reduceAnimations ? 0 : 0.05 + (sectionIdx * 0.03), 
                    duration: settings.reduceAnimations ? 0.3 : 0.6, 
                    ease: [0.22, 1, 0.36, 1] 
                  }}
                  className="mb-5"
                >
                  <h3 className="text-[6.5px] font-black uppercase tracking-[0.4em] text-primary/15 dark:text-primary/20 mb-4 px-4">{section.label}</h3>
                  <ul className="space-y-1">
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
                            className={`w-full flex items-center justify-start gap-3.5 px-4 py-3 rounded-xl text-[8.5px] font-bold transition-all duration-700 outline-none h-auto min-h-[46px]
                              ${isActive
                                ? 'bg-primary/[0.03] dark:bg-white/[0.02] text-primary'
                                : 'text-muted-foreground/25 dark:text-muted-foreground/30 hover:bg-primary/[0.01] dark:hover:bg-white/[0.01] hover:text-primary'}`}

                          >
                            <span className={`transition-all duration-500 transform ${isActive ? 'opacity-100 scale-105' : 'opacity-30'}`}>
                              {React.cloneElement(item.icon as React.ReactElement, { size: 16, strokeWidth: isActive ? 1.2 : 0.8 })}
                            </span>
                            <span className="tracking-[0.02em] uppercase truncate opacity-80">{item.label}</span>
                            {item.path === AppRoute.CACHE_MANAGER && cacheCount !== null && cacheCount > 0 && (
                              <span className="ml-auto bg-primary/20 text-primary text-[7px] font-black px-1 py-0.5 rounded-full flex-shrink-0">
                                {cacheCount}
                              </span>
                            )}
                            {(item as any).pro && <span className="ml-auto text-[6px] font-black uppercase tracking-widest text-primary bg-primary/10 px-1.2 py-0.4 rounded-md flex-shrink-0">PRO</span>}
                            {isActive && <motion.div layoutId="sidebar-active" className="ml-auto w-1 h-1 rounded-full bg-primary flex-shrink-0" />}
                          </Button>
                        </li>
                      );
                    })}
                  </ul>
                </motion.div>
              )))}
            </nav>

            <div className="pt-4 mt-auto space-y-4">
              <div className="flex flex-col gap-2">
                <div className="grid grid-cols-2 gap-2">
                  <Button 
                    variant="ghost"
                    onClick={onToggleDark} 
                    className="h-9 rounded-xl border border-primary/[0.02] dark:border-white/[0.02] bg-primary/[0.01] dark:bg-white/[0.01] flex items-center justify-center gap-2 transition-all hover:bg-primary/5 dark:hover:bg-white/5"
                    aria-label={isDark ? "Modo Claro" : "Modo Escuro"}
                  >
                    {isDark ? <Icons.Sun className="w-3.5 h-3.5 text-primary/60" /> : <Icons.Moon className="w-3.5 h-3.5 opacity-30" />}
                    <span className="text-[7.5px] font-bold uppercase tracking-widest text-muted-foreground/50">{isDark ? 'Claro' : 'Escuro'}</span>
                  </Button>

                  <Button 
                    variant="ghost"
                    onClick={onToggleHighContrast} 
                    className={`h-9 rounded-xl border flex items-center justify-center gap-2 transition-all ${
                      isHighContrast 
                        ? 'bg-primary/10 border-primary/20 text-primary' 
                        : 'border-primary/[0.02] dark:border-white/[0.02] bg-primary/[0.01] dark:bg-white/[0.01] text-muted-foreground/30 hover:bg-primary/5'
                    }`}
                  >
                    <Icons.ShieldCheck className="w-3.5 h-3.5" />
                    <span className="text-[7.5px] font-bold uppercase tracking-widest">A11y</span>
                  </Button>
                </div>

                {!settings.totalSilence && (
                  <Button 
                    variant="ghost"
                    onClick={onToggleSpeak} 
                    className={`w-full h-9 rounded-xl border flex items-center justify-center gap-2 transition-all ${
                      isSpeaking 
                        ? 'bg-primary/10 border-primary/20 text-primary' 
                        : 'border-primary/[0.02] dark:border-white/[0.02] bg-primary/[0.01] dark:bg-white/[0.01] text-muted-foreground/30 hover:bg-primary/5'
                    }`}
                  >
                    {isSpeaking ? <Icons.MessageCircle className="w-3.5 h-3.5 animate-pulse" /> : <Icons.Volume2 className="w-3.5 h-3.5" />}
                    <span className="text-[7.5px] font-bold uppercase tracking-widest">{isSpeaking ? 'Parar' : 'Ouvir'}</span>
                  </Button>
                )}

                <div className="flex flex-wrap gap-1 justify-center mt-1">
                  {(['pt', 'en', 'es', 'la'] as const).map((l) => (
                    <button
                      key={l}
                      onClick={() => (window as any).dispatchEvent(new CustomEvent('change-lang', { detail: l }))}
                      className={`px-2 py-1 text-[6.5px] font-black uppercase rounded-lg border transition-all ${
                        lang === l 
                          ? 'bg-primary/10 border-primary/20 text-primary' 
                          : 'border-transparent text-muted-foreground/20 hover:text-primary/40'
                      }`}
                    >
                      {l}
                    </button>
                  ))}
                </div>
              </div>

              {user ? (
                <div className="p-4 bg-primary/[0.015] dark:bg-white/[0.01] rounded-[1.5rem] border border-primary/[0.02] dark:border-white/[0.02]">
                  <div 
                    onClick={() => handleNav(AppRoute.PROFILE)} 
                    className="flex items-center gap-2.5 cursor-pointer group"
                  >
                    <div className="w-8 h-8 rounded-lg bg-primary/5 flex items-center justify-center text-primary font-bold transition-transform group-hover:scale-105 overflow-hidden">
                      {user.avatar ? (
                        <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-[10px] opacity-40">{user.name.charAt(0).toUpperCase()}</span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[9px] font-bold truncate text-primary/70">{user.name}</p>
                      <p className="text-[6px] uppercase text-primary/30 font-black tracking-widest mt-0.5">{user.isPremium ? 'Premium' : 'Gratuito'}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between gap-2 mt-3">
                    {!user.isPremium && (
                      <Button 
                        onClick={() => handleNav(AppRoute.UPGRADE)}
                        className="flex-1 h-8 bg-primary/[0.04] text-primary/60 hover:bg-primary hover:text-primary-foreground rounded-lg text-[7px] font-black uppercase tracking-widest transition-all"
                      >
                        Upgrade
                      </Button>
                    )}
                    <Button 
                      variant="ghost"
                      size="icon"
                      onClick={onSignOut}
                      className="h-8 w-8 rounded-lg text-muted-foreground/15 hover:text-destructive/40 hover:bg-destructive/5 transition-colors"
                    >
                      <Icons.LogOut className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              ) : (
                <Button onClick={() => handleNav(AppRoute.LOGIN)} className="w-full h-10 bg-primary/80 hover:bg-primary text-primary-foreground rounded-xl font-bold uppercase text-[8px] tracking-[0.2em] transition-all">
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