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
        { label: 'Logos IA', path: '/logos', icon: <Icons.Sparkles /> },
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

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Elegant Overlay Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.5, ease: [0.22, 1, 0.36, 1] }}
            onClick={onClose}
            className="fixed inset-0 bg-neutral-950/20 backdrop-blur-md z-[145]"
            aria-hidden="true"
          />

          {/* Premium Retractable Sidebar - Refined for a more elegant, floating feel */}
          <motion.aside
            ref={sidebarRef}
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={{ left: 0.05, right: 0 }}
            onDragEnd={(_, info) => {
              if (info.offset.x < -80 || info.velocity.x < -400) {
                onClose();
              }
            }}
            initial={{ x: '-102%', opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: '-102%', opacity: 0 }}
            transition={{ 
              duration: settings.reduceAnimations ? 0.4 : 1.4, 
              ease: [0.16, 1, 0.3, 1] 
            }}
            className="fixed top-3 left-3 bottom-3 w-[88vw] sm:w-[340px] bg-white/80 dark:bg-neutral-950/80 backdrop-blur-[60px] border border-black/[0.02] dark:border-white/[0.02] rounded-[3rem] flex flex-col p-10 md:p-14 z-[150] shadow-premium overflow-hidden admin-hide touch-none pt-[calc(2.5rem+env(safe-area-inset-top,0px))] pb-[calc(2rem+env(safe-area-inset-bottom,0px))]"
            role="dialog"
            aria-modal="true"
            aria-label={t('navigation_menu') || 'Menu de navegação'}
            tabIndex={-1}
          >
            {/* Mobile Header - More dedicated and sophisticated */}
            <header className="flex items-center justify-between mb-16">
              <div 
                className="flex items-center gap-5 cursor-pointer group outline-none" 
                onClick={() => handleNav('/')}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => e.key === 'Enter' && handleNav('/')}
              >
                <div className="w-14 h-14 rounded-[1.5rem] bg-primary/[0.015] dark:bg-white/[0.01] flex items-center justify-center p-3.5 group-hover:scale-105 transition-all duration-[1200ms] border border-primary/[0.03] dark:border-white/[0.03]">
                  <Icons.Logo className="w-full h-full opacity-60 dark:opacity-40" variant={isDark ? "light" : "dark"} />
                </div>
                <div className="space-y-1.5">
                  <h1 className="text-[14px] font-display font-light tracking-[0.6em] text-primary leading-none uppercase">CATHEDRA</h1>
                  <p className="text-[7.5px] font-bold uppercase text-primary/30 tracking-[0.6em]">
                    Sacrum Archivum
                  </p>
                </div>
              </div>

              <Button
                ref={closeButtonRef}
                variant="ghost"
                size="icon"
                onClick={onClose}
                className="rounded-full w-10 h-10 text-muted-foreground/30 hover:text-primary hover:bg-primary/5 transition-all focus-visible:ring-1"
                aria-label="Fechar menu"
              >
                <Icons.X className="w-5 h-5" />
              </Button>
            </header>

            <nav className="flex-1 space-y-6 overflow-y-auto pb-6 no-scrollbar pr-2" role="navigation">
              {sections.map((section, sectionIdx) => (section.items.length > 0 && (
                <motion.div 
                  key={section.label}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ 
                    delay: settings.reduceAnimations ? 0 : 0.1 + (sectionIdx * 0.05), 
                    duration: settings.reduceAnimations ? 0.4 : 0.8, 
                    ease: [0.19, 1, 0.22, 1] 
                  }}
                  className="mb-6"
                >
                  <h3 className="text-[7.5px] font-black uppercase tracking-[0.6em] text-primary/15 dark:text-primary/30 mb-6 px-5">{section.label}</h3>
                  <ul className="space-y-1.5">
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
                            className={`w-full flex items-center justify-start gap-4 px-5 py-3.5 rounded-2xl text-[9px] font-bold transition-all duration-700 outline-none h-auto min-h-[52px]
                              ${isActive
                                ? 'bg-primary/[0.03] dark:bg-white/[0.02] text-primary'
                                : 'text-muted-foreground/30 dark:text-muted-foreground/40 hover:bg-primary/[0.01] dark:hover:bg-white/[0.01] hover:text-primary'}`}

                          >
                            <span className={`transition-all duration-500 transform ${isActive ? 'opacity-100 scale-110' : 'opacity-40'}`}>
                              {React.cloneElement(item.icon as React.ReactElement, { size: 18, strokeWidth: isActive ? 1.2 : 0.9 })}
                            </span>
                            <span className="tracking-[0.05em] uppercase truncate opacity-90">{item.label}</span>
                            {item.path === AppRoute.CACHE_MANAGER && cacheCount !== null && cacheCount > 0 && (
                              <span className="ml-auto bg-primary/20 text-primary text-[8px] font-black px-1.5 py-0.5 rounded-full flex-shrink-0">
                                {cacheCount}
                              </span>
                            )}
                            {(item as any).pro && <span className="ml-auto text-[7px] font-black uppercase tracking-widest text-primary bg-primary/10 px-1.5 py-0.5 rounded-md flex-shrink-0">PRO</span>}
                            {isActive && <motion.div layoutId="sidebar-active" className="ml-auto w-1 h-1 rounded-full bg-primary flex-shrink-0" />}
                          </Button>
                        </li>
                      );
                    })}
                  </ul>
                </motion.div>
              )))}
            </nav>

            <div className="pt-6 mt-auto space-y-6">
              <div className="flex flex-col gap-3">
                <div className="grid grid-cols-2 gap-2">
                  <Button 
                    variant="ghost"
                    onClick={onToggleDark} 
                    className="h-10 rounded-xl border border-primary/[0.03] dark:border-white/[0.03] bg-primary/[0.02] dark:bg-white/[0.02] flex items-center justify-center gap-2 transition-all hover:bg-primary/5 dark:hover:bg-white/5"
                    aria-label={isDark ? "Modo Claro" : "Modo Escuro"}
                  >
                    {isDark ? <Icons.Sun className="w-4 h-4 text-primary/60" /> : <Icons.Moon className="w-4 h-4 opacity-40" />}
                    <span className="text-[8px] font-bold uppercase tracking-widest text-muted-foreground/60">{isDark ? 'Claro' : 'Escuro'}</span>
                  </Button>

                  <Button 
                    variant="ghost"
                    onClick={onToggleHighContrast} 
                    className={`h-10 rounded-xl border flex items-center justify-center gap-2 transition-all ${
                      isHighContrast 
                        ? 'bg-primary/10 border-primary/20 text-primary' 
                        : 'border-primary/[0.03] dark:border-white/[0.03] bg-primary/[0.02] dark:bg-white/[0.02] text-muted-foreground/40 hover:bg-primary/5'
                    }`}
                  >
                    <Icons.ShieldCheck className="w-4 h-4" />
                    <span className="text-[8px] font-bold uppercase tracking-widest">A11y</span>
                  </Button>
                </div>

                {!settings.totalSilence && (
                  <Button 
                    variant="ghost"
                    onClick={onToggleSpeak} 
                    className={`w-full h-10 rounded-xl border flex items-center justify-center gap-3 transition-all ${
                      isSpeaking 
                        ? 'bg-primary/10 border-primary/20 text-primary' 
                        : 'border-primary/[0.03] dark:border-white/[0.03] bg-primary/[0.02] dark:bg-white/[0.02] text-muted-foreground/40 hover:bg-primary/5'
                    }`}
                  >
                    {isSpeaking ? <Icons.MessageCircle className="w-4 h-4 animate-pulse" /> : <Icons.Volume2 className="w-4 h-4" />}
                    <span className="text-[8px] font-bold uppercase tracking-widest">{isSpeaking ? 'Parar' : 'Ouvir'}</span>
                  </Button>
                )}

                <div className="flex flex-wrap gap-1.5 justify-center mt-2">
                  {(['pt', 'en', 'es', 'la'] as const).map((l) => (
                    <button
                      key={l}
                      onClick={() => (window as any).dispatchEvent(new CustomEvent('change-lang', { detail: l }))}
                      className={`px-3 py-1 text-[7px] font-black uppercase rounded-lg border transition-all ${
                        lang === l 
                          ? 'bg-primary/10 text-primary border-primary/20 shadow-sm' 
                          : 'bg-transparent text-muted-foreground/30 border-transparent hover:border-primary/10'
                      }`}
                    >
                      {l}
                    </button>
                  ))}
                </div>

                <div className="flex justify-center gap-6 py-2 mt-2">
                  <a href="#" className="text-muted-foreground/20 hover:text-primary/60 transition-colors"><Icons.Instagram size={14} /></a>
                  <a href="#" className="text-muted-foreground/20 hover:text-primary/60 transition-colors"><Icons.Youtube size={14} /></a>
                  <a href="#" className="text-muted-foreground/20 hover:text-primary/60 transition-colors"><Icons.Whatsapp size={14} /></a>
                </div>
              </div>

              {user ? (
                <div className="p-6 bg-primary/[0.02] dark:bg-white/[0.01] rounded-[2rem] border border-primary/[0.03] dark:border-white/[0.03]">
                  <div 
                    onClick={() => handleNav(AppRoute.PROFILE)} 
                    className="flex items-center gap-3 cursor-pointer group"
                  >
                    <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-primary-foreground font-bold shadow-sm group-hover:scale-105 transition-transform overflow-hidden">
                      {user.avatar ? (
                        <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-xs">{user.name.charAt(0).toUpperCase()}</span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] font-bold truncate text-primary/80">{user.name}</p>
                      <p className="text-[7px] uppercase text-primary/40 font-bold tracking-[0.1em] mt-0.5">{user.isPremium ? 'Membro Premium' : 'Conta Gratuita'}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between gap-2 mt-4">
                    {!user.isPremium && (
                      <Button 
                        onClick={() => handleNav(AppRoute.UPGRADE)}
                        className="flex-1 h-9 bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground rounded-lg text-[8px] font-bold uppercase tracking-widest transition-all"
                      >
                        Upgrade
                      </Button>
                    )}
                    <Button 
                      variant="ghost"
                      size="icon"
                      onClick={onSignOut}
                      className="h-9 w-9 rounded-lg text-muted-foreground/20 hover:text-destructive/60 hover:bg-destructive/5 transition-colors"
                    >
                      <Icons.LogOut className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              ) : (
                <Button onClick={() => handleNav(AppRoute.LOGIN)} className="w-full h-12 bg-primary/90 hover:bg-primary text-primary-foreground rounded-xl font-bold uppercase text-[9px] tracking-[0.2em] transition-all">
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