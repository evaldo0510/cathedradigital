import { Button } from '@/components/ui/button';
import React, { useState, useEffect, useCallback, memo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { prefetchRoute } from '@/lib/prefetch';
import { Icons } from '../../constants';
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
  onSignOut?: () => void;
}

const Sidebar = memo(({ isOpen, onClose, user, isDark, onToggleDark, isHighContrast, onToggleHighContrast, isSpeaking, onToggleSpeak, onSignOut }: SidebarProps) => {
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
        { label: 'Magistério', path: AppRoute.MAGISTERIUM, icon: <Icons.Magisterium /> },
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
            className="fixed top-0 left-0 bottom-0 w-[min(280px,85vw)] bg-background/98 backdrop-blur-2xl border-r border-primary/[0.02] flex flex-col p-6 z-[170] shadow-none overflow-hidden admin-hide touch-none pt-[calc(1rem+env(safe-area-inset-top,0px))] pb-[calc(1rem+env(safe-area-inset-bottom,0px))] will-change-transform"
            role="dialog"
            aria-modal="true"
            aria-label={t('navigation_menu') || 'Menu de navegação'}
            tabIndex={-1}
          >
            {/* Mobile Header - Cinematic extension of the atmosphere */}
            <header className="flex items-center justify-between mb-4 pb-2 border-b border-primary/[0.01] dark:border-white/[0.01]">
              <div 
                className="flex items-center gap-4 cursor-pointer group outline-none" 
                onClick={() => handleNav('/')}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => e.key === 'Enter' && handleNav('/')}
              >
                <div className="w-10 h-10 rounded-2xl bg-primary/[0.01] dark:bg-white/[0.01] flex items-center justify-center p-2.5 group-hover:scale-105 transition-transform duration-[2000ms]">
                  <Icons.Logo className="w-full h-full opacity-40 dark:opacity-20" variant={isDark ? "light" : "dark"} />
                </div>
                <div className="space-y-0.5">
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
                className="rounded-full w-9 h-9 text-muted-foreground/10 hover:text-primary hover:bg-primary/[0.02] transition-all focus-visible:ring-1"
                aria-label="Fechar menu"
              >
                <Icons.X className="w-3.5 h-3.5" />
              </Button>
            </header>

            <nav className="flex-1 space-y-2 overflow-y-auto pb-4 no-scrollbar pr-1" role="navigation">
              {sections.map((section, sectionIdx) => (section.items.length > 0 && (
                <Collapsible key={section.label} defaultOpen={sectionIdx < 3}>
                  <CollapsibleTrigger asChild>
                    <button className="w-full flex items-center justify-between py-2 px-4 group/trigger hover:bg-primary/[0.02] rounded-xl transition-all">
                      <h3 className="text-[7px] font-black uppercase tracking-[0.8em] text-primary/30 group-hover/trigger:text-primary transition-colors italic">/ {section.label}</h3>
                      <Icons.ChevronDown className="w-3 h-3 text-primary/10 group-hover/trigger:text-primary transition-all group-data-[state=open]:rotate-180" strokeWidth={1} />
                    </button>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <motion.div 
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="overflow-hidden"
                    >
                      <ul className="space-y-1 mt-1">
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
                                className={`w-full flex items-center justify-start gap-4 px-4 py-1.5 rounded-xl text-[8.5px] font-bold transition-all duration-[1200ms] outline-none h-auto min-h-[40px]
                                  ${isActive
                                    ? 'bg-primary/[0.005] dark:bg-white/[0.005] text-primary shadow-none'
                                    : 'text-muted-foreground/10 dark:text-muted-foreground/5 hover:bg-primary/[0.001] dark:hover:bg-white/[0.001] hover:text-primary'}`}
                              >
                                <span className={`transition-all duration-700 transform ${isActive ? 'opacity-90 scale-105' : 'opacity-50'}`}>
                                  {React.cloneElement(item.icon as React.ReactElement, { size: 16, strokeWidth: isActive ? 1.5 : 1.2 })}
                                </span>
                                <span className={`tracking-[0.1em] uppercase truncate transition-opacity duration-700 ${isActive ? 'opacity-100' : 'opacity-60'}`}>{item.label}</span>
                                {item.path === AppRoute.CACHE_MANAGER && cacheCount !== null && cacheCount > 0 && (
                                  <span className="ml-auto bg-primary/10 text-primary text-[7px] font-black px-1.5 py-0.5 rounded-full flex-shrink-0">
                                    {cacheCount}
                                  </span>
                                )}
                                {(item as any).pro && <span className="ml-auto text-[6px] font-black uppercase tracking-widest text-primary/40 bg-primary/[0.03] px-1 py-0.5 rounded flex-shrink-0">PRO</span>}
                                {isActive && <motion.div layoutId="sidebar-active" className="ml-auto w-0.5 h-0.5 rounded-full bg-primary/40 flex-shrink-0" />}
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

            <div className="pt-4 mt-auto space-y-4">
              <div className="flex flex-col gap-3">
                <div className="grid grid-cols-2 gap-2">
                  <Button 
                    variant="ghost"
                    onClick={onToggleDark} 
                    className="h-10 rounded-xl border border-primary/[0.01] dark:border-white/[0.01] bg-primary/[0.01] dark:bg-white/[0.01] flex items-center justify-center gap-2 transition-all hover:bg-primary/5 dark:hover:bg-white/5 group/btn"
                    aria-label={isDark ? "Modo Claro" : "Modo Escuro"}
                  >
                    {isDark ? <Icons.Sun className="w-3.5 h-3.5 text-primary/40 group-hover/btn:text-primary transition-colors" /> : <Icons.Moon className="w-3.5 h-3.5 opacity-30 group-hover/btn:opacity-60 transition-opacity" />}
                    <span className="text-[7.5px] font-black uppercase tracking-widest text-muted-foreground/40 group-hover/btn:text-muted-foreground/80 transition-colors">{isDark ? 'Claro' : 'Escuro'}</span>
                  </Button>

                  <Button 
                    variant="ghost"
                    onClick={onToggleHighContrast} 
                    className={`h-10 rounded-xl border flex items-center justify-center gap-2 transition-all ${
                      isHighContrast 
                        ? 'bg-primary/10 border-primary/20 text-primary' 
                        : 'border-primary/[0.01] dark:border-white/[0.01] bg-primary/[0.01] dark:bg-white/[0.01] text-muted-foreground/30 hover:bg-primary/5'
                    }`}
                  >
                    <Icons.ShieldCheck className="w-3.5 h-3.5" />
                    <span className="text-[7.5px] font-black uppercase tracking-widest">A11y</span>
                  </Button>
                </div>

                {!settings.totalSilence && (
                  <Button 
                    variant="ghost"
                    onClick={onToggleSpeak} 
                    className={`w-full h-10 rounded-xl border flex items-center justify-center gap-3 transition-all ${
                      isSpeaking 
                        ? 'bg-primary/10 border-primary/20 text-primary' 
                        : 'border-primary/[0.01] dark:border-white/[0.01] bg-primary/[0.01] dark:bg-white/[0.01] text-muted-foreground/30 hover:bg-primary/5'
                    }`}
                  >
                    {isSpeaking ? <Icons.MessageCircle className="w-3.5 h-3.5 animate-pulse" /> : <Icons.Volume2 className="w-3.5 h-3.5" />}
                    <span className="text-[7.5px] font-black uppercase tracking-widest">{isSpeaking ? 'Parar' : 'Ouvir'}</span>
                  </Button>
                )}

                <div className="flex flex-wrap gap-1.5 justify-center mt-2">
                  {(['pt', 'en', 'es', 'la'] as const).map((l) => (
                    <button
                      key={l}
                      onClick={() => (window as any).dispatchEvent(new CustomEvent('change-lang', { detail: l }))}
                      className={`px-3 py-1 text-[7px] font-black uppercase rounded-lg border transition-all ${
                        lang === l 
                          ? 'bg-primary/5 text-primary border-primary/10 shadow-none' 
                          : 'bg-transparent text-muted-foreground/20 border-transparent hover:border-primary/5'
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
                <div className="p-5 bg-primary/[0.01] dark:bg-white/[0.005] rounded-[2rem] border border-primary/[0.01] dark:border-white/[0.01]">
                  <div 
                    onClick={() => handleNav(AppRoute.PROFILE)} 
                    className="flex items-center gap-3 cursor-pointer group"
                  >
                    <div className="w-10 h-10 rounded-xl bg-primary/90 flex items-center justify-center text-primary-foreground font-bold shadow-none group-hover:scale-105 transition-transform overflow-hidden">
                      {user.avatar ? (
                        <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-xs">{user.name.charAt(0).toUpperCase()}</span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] font-bold truncate text-primary/70">{user.name}</p>
                      <p className="text-[7px] uppercase text-primary/30 font-bold tracking-[0.1em] mt-0.5">{user.isPremium ? 'Membro Premium' : 'Conta Gratuita'}</p>
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