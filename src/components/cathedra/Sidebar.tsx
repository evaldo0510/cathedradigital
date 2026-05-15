import { Button } from '@/components/ui/button';
import React, { useState, useEffect, useContext } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { prefetchRoute } from '@/lib/prefetch';
import { Icons } from '../../constants';
import { AppRoute, User } from '../../types';
import { LangContext } from '@/contexts/LangContext';
import { getCacheStats } from '@/lib/offlineCache';
import { useLang } from '@/hooks/useLang';

interface SidebarProps {
  onClose?: () => void;
  user: User | null;
  isDark?: boolean;
  onToggleDark?: () => void;
  isSpeaking?: boolean;
  onToggleSpeak?: () => void;
  onSignOut?: () => void;
}

const Sidebar = React.memo(React.forwardRef<HTMLElement, SidebarProps>(({ onClose, user, isDark, onToggleDark, isSpeaking, onToggleSpeak, onSignOut }, ref) => {
  const navigate = useNavigate();
  const location = useLocation();
  const currentPath = location.pathname;
  const { lang, t } = useLang();
  const [cacheCount, setCacheCount] = useState<number | null>(null);

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
      ]
    }] : []),
    {
      label: 'Navegação',
      items: [
        { label: t('home'), path: AppRoute.HOJE, icon: <Icons.Home className="w-5 h-5" /> },
        { label: t('journeys'), path: AppRoute.JORNADAS, icon: <Icons.Journeys className="w-5 h-5" /> },
        { label: t('themes'), path: AppRoute.TEMAS, icon: <Icons.Themes className="w-5 h-5" /> },
        { label: t('explore'), path: AppRoute.BIBLIOTECA, icon: <Icons.Compass className="w-5 h-5" /> },
        { label: 'Busca Global', path: AppRoute.BUSCAR, icon: <Icons.Search className="w-5 h-5" /> },
        { label: t('community'), path: AppRoute.COMMUNITY, icon: <Icons.Users className="w-5 h-5" /> },
        { label: t('profile'), path: AppRoute.PROFILE, icon: <Icons.User className="w-5 h-5" /> },
        { label: 'Diário Espiritual', path: AppRoute.DIARIO, icon: <Icons.PenLine className="w-5 h-5" /> },
      ]
    },
    {
      label: 'Devocionário',
      items: [
        { label: t('bible'), path: AppRoute.BIBLE, icon: <Icons.Bible className="w-5 h-5" /> },
        { label: t('catechism'), path: AppRoute.CATECHISM, icon: <Icons.Catechism className="w-5 h-5" /> },
        { label: 'Explorar Catecismo', path: AppRoute.CATECHISM_EXPLORER, icon: <Icons.Search className="w-5 h-5" /> },
        { label: t('liturgy'), path: AppRoute.LITURGIA, icon: <Icons.Liturgy className="w-5 h-5" /> },
        { label: t('rosary') || 'Santo Rosário', path: AppRoute.ROSARY, icon: <Icons.Heart className="w-5 h-5" /> },
        { label: t('prayers'), path: AppRoute.ORACAO, icon: <Icons.Volume2 className="w-5 h-5" /> },
        { label: t('via_crucis') || 'Via Sacra', path: AppRoute.VIA_CRUCIS, icon: <Icons.Cross className="w-5 h-5" /> },
        { label: t('confession') || 'Confissão', path: AppRoute.POENITENTIA, icon: <Icons.Flame className="w-5 h-5" /> },
        { label: t('lectio_divina') || 'Lectio Divina', path: AppRoute.LECTIO_DIVINA, icon: <Icons.Lectio className="w-5 h-5" /> },
        { label: t('breviary') || 'Breviário', path: AppRoute.BREVIARY, icon: <Icons.Clock className="w-5 h-5" /> },
        { label: t('litanies') || 'Ladainhas', path: AppRoute.LITANIES, icon: <Icons.MessageCircle className="w-5 h-5" /> },
      ]
    },
    {
      label: 'Formação',
      items: [
        { label: 'Quiz da Fé', path: AppRoute.CERTAMEN, icon: <Icons.Trophy className="w-5 h-5" />, pro: false },
        { label: t('magisterium') || 'Magistério', path: AppRoute.MAGISTERIUM, icon: <Icons.ScrollText className="w-5 h-5" /> },
        { label: t('encyclopedia') || 'Enciclopédia', path: AppRoute.ENCYCLOPEDIA, icon: <Icons.Library className="w-5 h-5" /> },
        { label: t('dogmas') || 'Dogmas da Fé', path: AppRoute.DOGMAS, icon: <Icons.ScrollText className="w-5 h-5" /> },
        { label: t('apparitions') || 'Aparições', path: AppRoute.APARICOES, icon: <Icons.Heart className="w-5 h-5" /> },
        { label: t('az_faith') || 'A–Z da Fé', path: AppRoute.AZ_FAITH, icon: <Icons.AZ className="w-5 h-5" /> },
        { label: t('popes') || 'Os Papas', path: AppRoute.POPES, icon: <Icons.ShieldCheck className="w-5 h-5" /> },
        { label: t('aquinas') || 'Obras de Aquino', path: AppRoute.AQUINAS_OPERA, icon: <Icons.Aquinas className="w-5 h-5" /> },
      ]
    },
    {
      label: t('digital'),
      items: [
        { label: t('about') || 'Sobre', path: AppRoute.ABOUT, icon: <Icons.Creator className="w-5 h-5" /> },
        { label: t('partners') || 'Parceiros', path: AppRoute.PARTNERS, icon: <Icons.Handshake className="w-5 h-5" /> },
        { label: 'Guia de Módulos', path: AppRoute.MODULES_GUIDE, icon: <Icons.HelpCircle className="w-5 h-5" /> },
        { 
          label: 'Redefinir Onboarding', 
          path: AppRoute.ONBOARDING, 
          icon: <Icons.Compass className="w-5 h-5" />,
          onClick: () => {
            localStorage.removeItem('cathedra_onboarding_done');
          }
        },
        { label: 'Cache Local', path: AppRoute.CACHE_MANAGER, icon: <Icons.Library className="w-5 h-5" /> },
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
      <aside ref={ref} className="h-full w-[288px] bg-card border-r border-border/40 flex flex-col p-6 overflow-hidden">
        <div className="mb-4 px-2 flex items-center gap-3 cursor-pointer group hover:opacity-90 transition-opacity" onClick={() => handleNav(AppRoute.HOJE)}>
          <Icons.Logo className="w-8 h-8 flex-shrink-0" variant="blue" />
          <div>
            <h1 className="text-lg font-black tracking-[0.2em] text-foreground leading-none uppercase font-serif">CATHEDRA</h1>
            <p className="text-premium-tiny font-black uppercase text-primary/70 tracking-[0.3em] mt-1.5 flex items-center gap-1.5">
              <span className="w-1 h-1 rounded-full bg-primary animate-pulse" />
              Digital Sanctuarium
            </p>
          </div>
        </div>

        <nav className="flex-1 space-y-6 overflow-y-auto pb-4 no-scrollbar">
          {sections.map((section) => (section.items.length > 0 && (
            <div key={section.label}>
              <h3 className="text-premium-tiny font-black uppercase tracking-[0.3em] text-muted-foreground/50 mb-4 px-4">{section.label}</h3>
              <ul className="space-y-1">
                {section.items.map((item, idx) => (
                  <li key={idx}>
                    <Button
                      variant="ghost"
                      onClick={() => handleNav(item.path)}
                      onMouseEnter={() => prefetchRoute(item.path)}
                      onTouchStart={() => prefetchRoute(item.path)}
                      aria-current={currentPath === item.path ? 'page' : undefined}
                      className={`w-full flex items-center justify-start gap-4 px-4 py-3 rounded-full text-sm font-semibold transition-all focus-visible:ring-2 focus-visible:ring-primary outline-none h-auto min-h-[48px]
                        ${currentPath === item.path
                          ? 'bg-foreground text-background shadow-lg hover:bg-foreground/90'
                          : 'text-muted-foreground hover:bg-muted hover:text-foreground'}`}
                    >
                      <span className="opacity-70 flex-shrink-0">{item.icon}</span>
                      <span className="tracking-tight truncate">{item.label}</span>
                      {item.path === AppRoute.CACHE_MANAGER && cacheCount !== null && cacheCount > 0 && (
                        <span className="ml-auto bg-primary/20 text-primary text-premium-tiny font-black px-1.5 py-0.5 rounded-full flex-shrink-0">
                          {cacheCount}
                        </span>
                      )}
                      {(item as any).pro && <span className="ml-auto text-premium-tiny font-black uppercase tracking-widest text-primary bg-primary/10 px-1.5 py-0.5 rounded flex-shrink-0">PRO</span>}
                      {currentPath === item.path && item.path !== AppRoute.CACHE_MANAGER && <div className="ml-auto w-1 h-1 rounded-2xl bg-primary flex-shrink-0" />}
                    </Button>
                  </li>
                ))}
              </ul>
            </div>
          )))}
        </nav>


        <div className="pt-4 pb-20 lg:pb-0 border-t border-border space-y-3">
          <div className="flex flex-col gap-2 mb-2 px-1">
            <div className="flex gap-2">
              <Button 
                variant="outline"
                size="sm"
                onClick={onToggleDark} 
                className="flex-1 h-12 rounded-full border border-border bg-muted flex items-center justify-center gap-2 transition-all active:scale-95 focus-visible:ring-2 focus-visible:ring-primary outline-none lg:hidden"
                aria-label={isDark ? "Mudar para modo claro" : "Mudar para modo escuro"}
              >
                {isDark ? <Icons.Sun className="w-5 h-5 text-primary" /> : <Icons.Moon className="w-5 h-5" />}
                <span className="text-premium-tiny font-black uppercase tracking-widest">{isDark ? (lang === 'pt' ? 'Claro' : 'Light') : (lang === 'pt' ? 'Escuro' : 'Dark')}</span>
              </Button>


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
              className="w-full flex items-center gap-3 p-3 bg-muted rounded-full hover:border-primary border border-transparent transition-all cursor-pointer"
            >
              <div className="w-10 h-10 rounded-2xl bg-foreground flex items-center justify-center text-background font-black shadow-sm">
                {user.avatar ? (
                  <img src={user.avatar} alt={user.name} className="w-full h-full object-cover rounded-full" />
                ) : (
                  user.name.charAt(0).toUpperCase()
                )}
              </div>
              <div className="flex-1 min-w-0 text-left">
                <p className="text-xs font-bold truncate text-foreground">{user.name}</p>
                <p className="text-premium-tiny uppercase text-primary font-black tracking-widest">{user.isPremium ? 'PRO' : 'Gratuito'}</p>
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
            <Button onClick={() => handleNav(AppRoute.LOGIN)} className="w-full py-4 bg-foreground text-background rounded-full font-black uppercase text-premium-tiny tracking-widest shadow-xl hover:bg-primary hover:text-primary-foreground transition-all">
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
