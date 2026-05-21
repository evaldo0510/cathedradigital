import { Button } from '@/components/ui/button';
import React, { useState, useEffect, useContext } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { prefetchRoute } from '@/lib/prefetch';
import { Icons } from '../../constants';
import { AppRoute, User } from '../../types';
import { LangContext } from '@/contexts/LangContext';
import { getCacheStats } from '@/lib/offlineCache';
import { useLang } from '@/hooks/useLang';
import { useReadingSettings } from '@/contexts/ReadingSettingsContext';

interface SidebarProps {
  onClose?: () => void;
  user: User | null;
  isDark?: boolean;
  onToggleDark?: () => void;
  isHighContrast?: boolean;
  onToggleHighContrast?: () => void;
  isSpeaking?: boolean;
  onToggleSpeak?: () => void;
  onSignOut?: () => void;
}

const Sidebar = React.memo(React.forwardRef<HTMLElement, SidebarProps>(({ onClose, user, isDark, onToggleDark, isHighContrast, onToggleHighContrast, isSpeaking, onToggleSpeak, onSignOut }, ref) => {
  const navigate = useNavigate();
  const location = useLocation();
  const currentPath = location.pathname;
  const { lang, t } = useLang();
  const [cacheCount, setCacheCount] = useState<number | null>(null);
  const { settings } = useReadingSettings();

  useEffect(() => {
    getCacheStats().then(stats => setCacheCount(stats.total));
    
    // Listen for cache updates
    const handleCacheUpdate = () => {
      getCacheStats().then(stats => setCacheCount(stats.total));
    };
    window.addEventListener('cathedra_cache_updated', handleCacheUpdate);
    return () => window.removeEventListener('cathedra_cache_updated', handleCacheUpdate);
  }, []);
  
  const sections = [
    ...(user?.role === 'admin' ? [{
      label: t('admin'),
      items: [
        { label: t('admin'), path: AppRoute.ADMIN, icon: <Icons.ShieldCheck className="w-5 h-5" /> },
        { label: 'Auditoria Visual', path: AppRoute.VISUAL_AUDIT, icon: <Icons.ShieldCheck className="w-5 h-5" /> },
        { label: 'Regressão Visual', path: AppRoute.VISUAL_REGRESSION, icon: <Icons.ShieldCheck className="w-5 h-5" /> },

      ]
    }] : []),
    {
      label: 'Núcleo Sagrado',
      items: [
        { label: t('home'), path: AppRoute.HOJE, icon: <Icons.Home className="w-5 h-5" /> },
        { label: t('bible'), path: AppRoute.BIBLE, icon: <Icons.Bible className="w-5 h-5" /> },
        { label: t('catechism'), path: AppRoute.CATECHISM, icon: <Icons.Catechism className="w-5 h-5" /> },
        { label: 'Magistério', path: AppRoute.MAGISTERIUM, icon: <Icons.ScrollText className="w-5 h-5" /> },
        { label: 'Logos IA', path: AppRoute.BUSCAR, icon: <Icons.Search className="w-5 h-5" /> },
      ]
    },
    {
      label: 'Em Breve',
      items: [
        { label: 'Jornadas Espirituais', path: AppRoute.JORNADAS, icon: <Icons.Journeys className="w-5 h-5 opacity-40" /> },
        { label: 'Comunidade Ativa', path: AppRoute.COMMUNITY, icon: <Icons.Users className="w-5 h-5 opacity-40" /> },
        { label: 'Painel do Peregrino', path: AppRoute.PROFILE, icon: <Icons.User className="w-5 h-5 opacity-40" /> },
      ]
    }


  ];

  const handleNav = (item: string | { path: string; onClick?: () => void }) => {
    const path = typeof item === 'string' ? item : item.path;
    if (typeof item !== 'string' && item.onClick) item.onClick();
    navigate(path);
    onClose?.();
  };

  return (
    <>
      <aside ref={ref} className="h-full w-[320px] bg-card border-r border-border/20 flex flex-col p-8 overflow-hidden">
        <div className="mb-10 px-2 flex items-center gap-4 cursor-pointer group hover:opacity-90 transition-opacity" onClick={() => handleNav(AppRoute.HOJE)}>
          <Icons.Logo className="w-10 h-10 flex-shrink-0" variant="blue" />
          <div className="space-y-1">
            <h1 className="text-xl font-display font-medium tracking-[0.1em] text-primary leading-none uppercase">CATHEDRA</h1>
            <p className="text-[10px] font-bold uppercase text-secondary/60 tracking-[0.4em]">
              Digital Sanctuarium
            </p>
          </div>
        </div>

        <nav className="flex-1 space-y-6 overflow-y-auto pb-4 no-scrollbar">
          {sections.map((section) => (section.items.length > 0 && (
            <div key={section.label}>
              <h3 className="text-[10px] font-bold uppercase tracking-[0.4em] text-muted-foreground/30 mb-5 px-4">{section.label}</h3>
              <ul className="space-y-1">
                {section.items.map((item, idx) => (
                  <li key={idx}>
                    <Button
                      variant="ghost"
                      onClick={() => handleNav(item.path)}
                      onMouseEnter={() => prefetchRoute(item.path)}
                      onTouchStart={() => prefetchRoute(item.path)}
                      aria-current={currentPath === item.path ? 'page' : undefined}
                      className={`w-full flex items-center justify-start gap-5 px-5 py-4 rounded-full text-xs font-bold transition-all focus-visible:ring-2 focus-visible:ring-primary/20 outline-none h-auto min-h-[52px] border-none shadow-none
                        ${currentPath === item.path
                          ? 'bg-primary text-primary-foreground shadow-premium hover:opacity-90'
                          : 'text-muted-foreground/60 hover:bg-primary/[0.03] hover:text-primary'}`}
                    >
                      <span className="opacity-70 flex-shrink-0">{item.icon}</span>
                      <span className="tracking-tight truncate">{item.label}</span>
                      {item.path === AppRoute.CACHE_MANAGER && cacheCount !== null && cacheCount > 0 && (
                        <span className="ml-auto bg-primary/20 text-primary text-premium-tiny font-black px-1.5 py-0.5 rounded-full flex-shrink-0">
                          {cacheCount}
                        </span>
                      )}
                      {(item as any).pro && <span className="ml-auto text-premium-tiny font-black uppercase tracking-widest text-primary bg-primary/10 px-1.5 py-0.5 rounded flex-shrink-0">PRO</span>}
                      {currentPath === item.path && item.path !== AppRoute.CACHE_MANAGER && <div className="ml-auto w-1 h-1 rounded-premium bg-primary flex-shrink-0" />}
                    </Button>
                  </li>
                ))}
              </ul>
            </div>
          )))}
        </nav>


        <div className="pt-4 pb-20 lg:pb-0 border-t border-border space-y-3">
          <div className="flex flex-col gap-2 mb-2 px-1">
            <div className="flex flex-wrap gap-2">
              <Button 
                variant="outline"
                size="sm"
                onClick={onToggleDark} 
                className="flex-1 min-w-[100px] h-12 rounded-full border border-border bg-muted flex items-center justify-center gap-2 transition-all active:scale-95 focus-visible:ring-2 focus-visible:ring-primary outline-none"
                aria-label={isDark ? "Mudar para modo claro" : "Mudar para modo escuro"}
              >
                {isDark ? <Icons.Sun className="w-5 h-5 text-primary" /> : <Icons.Moon className="w-5 h-5" />}
                <span className="text-premium-tiny font-black uppercase tracking-widest truncate">{isDark ? (lang === 'pt' ? 'Claro' : 'Light') : (lang === 'pt' ? 'Escuro' : 'Dark')}</span>
              </Button>

              <Button 
                variant={isHighContrast ? "default" : "outline"}
                size="sm"
                onClick={onToggleHighContrast} 
                className={`flex-1 min-w-[100px] h-12 rounded-full border border-border flex items-center justify-center gap-2 transition-all active:scale-95 focus-visible:ring-2 focus-visible:ring-primary outline-none ${
                  !isHighContrast ? 'bg-muted' : 'ring-2 ring-primary ring-offset-1'
                }`}
                aria-label={isHighContrast ? "Desativar alto contraste" : "Ativar alto contraste"}
              >
                <Icons.ShieldCheck className="w-5 h-5" />
                <span className="text-premium-tiny font-black uppercase tracking-widest truncate">{isHighContrast ? 'Contraste +' : 'Contraste'}</span>
              </Button>
            </div>

            {!settings.totalSilence && (
              <div className="flex gap-2">
                <Button 
                  variant={isSpeaking ? "default" : "outline"}
                  size="sm"
                  onClick={onToggleSpeak} 
                  className={`flex-1 h-12 rounded-full border border-border flex items-center justify-center gap-2 transition-all active:scale-95 focus-visible:ring-2 focus-visible:ring-primary outline-none ${
                    !isSpeaking ? 'bg-muted' : ''
                  }`}
                  aria-label={isSpeaking ? t('audio_stop') : t('audio_read')}
                >
                  {isSpeaking ? <Icons.Message className="w-5 h-5 animate-pulse" /> : <Icons.Volume2 className="w-5 h-5" />}
                  <span className="text-premium-tiny font-black uppercase tracking-widest">{isSpeaking ? t('audio_stop') : t('audio_read')}</span>
                </Button>
              </div>
            )}

            <div className="flex flex-wrap gap-1 mt-1">
              {(['pt', 'en', 'es', 'la', 'it', 'fr', 'de'] as const).map((l) => (
                <Button
                  key={l}
                  onClick={() => (window as any).dispatchEvent(new CustomEvent('change-lang', { detail: l }))}
                  aria-label={`Mudar idioma para ${l.toUpperCase()}`}
                  aria-pressed={lang === l}
                  className={`px-2 py-1 text-premium-tiny font-black uppercase rounded-full border transition-all focus-visible:ring-2 focus-visible:ring-primary outline-none ${
                    lang === l 
                      ? 'bg-primary text-white border-primary' 
                      : 'bg-muted text-muted-foreground border-border hover:border-primary/50'
                  }`}
                >
                  {l}
                </Button>

              ))}
            </div>
          </div>

          {user ? (
            <div 
              onClick={() => handleNav(AppRoute.PROFILE)} 
              className="w-full flex items-center gap-4 p-4 bg-muted/30 rounded-full hover:border-primary/20 border border-border/10 transition-all cursor-pointer shadow-soft group"
            >
              <div className="w-12 h-12 rounded-premium bg-primary flex items-center justify-center text-primary-foreground font-bold shadow-soft group-hover:scale-105 transition-transform">
                {user.avatar ? (
                  <img src={user.avatar} alt={user.name} className="w-full h-full object-cover rounded-premium" />
                ) : (
                  user.name.charAt(0).toUpperCase()
                )}
              </div>
              <div className="flex-1 min-w-0 text-left">
                <p className="text-sm font-bold truncate text-primary/80">{user.name}</p>
                <p className="text-[10px] uppercase text-secondary font-bold tracking-[0.2em] mt-0.5">{user.isPremium ? 'PRO' : 'Gratuito'}</p>
                {!user.isPremium && (
                  <div 
                    onClick={(e) => { e.stopPropagation(); handleNav(AppRoute.UPGRADE); }}
                    className="mt-1 inline-flex items-center gap-1 text-premium-tiny font-black uppercase tracking-widest bg-primary/10 text-primary px-1.5 py-0.5 rounded-full hover:bg-primary hover:text-white transition-colors animate-pulse"
                  >
                    Upgrade <Icons.ArrowRight className="w-2 h-2" />
                  </div>
                )}
              </div>
              <Button 
                onClick={(e) => { e.stopPropagation(); onSignOut?.(); }}
                className="p-2 text-muted-foreground hover:text-destructive transition-colors"
                title={t('exit_session')}
              >
                <Icons.LogOut className="w-4 h-4" />
              </Button>
            </div>
          ) : (
            <Button onClick={() => handleNav(AppRoute.LOGIN)} className="w-full py-4 bg-foreground text-background rounded-full font-black uppercase text-premium-tiny tracking-widest shadow-premium-hover hover:bg-primary hover:text-primary-foreground transition-all">
              {t('enter')}
            </Button>
          )}
        </div>
      </aside>
    </>
  );
}));

Sidebar.displayName = 'Sidebar';

export default Sidebar;
