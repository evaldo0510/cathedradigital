import { Button   } from '@/components/cathedra/Button';
import React, { useState, useEffect, useContext, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { prefetchRoute } from '@/lib/prefetch';
import { Icons } from '../../constants';
import { AppRoute, User } from '../../types';
import { LangContext } from '@/contexts/LangContext';
import { getCacheStats } from '@/lib/offlineCache';
import { useLang } from '@/hooks/useLang';
import { CathedraIcon, IconSizePreset } from './CathedraIcon';
import { canUserAccess } from '@/utils/auth-utils';

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

  useEffect(() => {
    getCacheStats().then(stats => setCacheCount(stats.total));
    
    // Listen for cache updates
    const handleCacheUpdate = () => {
      getCacheStats().then(stats => setCacheCount(stats.total));
    };
    window.addEventListener('cathedra_cache_updated', handleCacheUpdate);
    return () => window.removeEventListener('cathedra_cache_updated', handleCacheUpdate);
  }, []);
  
  const sections = useMemo(() => {
    const rawSections = [
      {
        label: t('admin'),
        items: [
          { label: t('admin'), path: AppRoute.ADMIN, icon: Icons.ShieldCheck },
          { label: 'Auditoria Visual', path: AppRoute.VISUAL_AUDIT, icon: Icons.ShieldCheck },
          { label: 'Regressão Visual', path: AppRoute.VISUAL_REGRESSION, icon: Icons.ShieldCheck },
          { label: 'Auditoria A11y', path: AppRoute.A11Y_AUDIT, icon: Icons.ShieldCheck },
          { label: 'Auditoria de Segurança', path: AppRoute.SECURITY_AUDIT, icon: Icons.ShieldCheck },
          { label: 'Logs de Auditoria', path: AppRoute.AUDIT_LOGS, icon: Icons.Activity },
          { label: 'Transações', path: AppRoute.TRANSACTIONS, icon: Icons.CreditCard },
        ]
      },
      {
        label: 'Navegação',
        items: [
          { label: t('home'), path: AppRoute.HOJE, icon: Icons.Home },
          { label: 'Logos', path: AppRoute.STUDY_MODE, icon: Icons.Compass, pro: true },
          { label: t('journeys'), path: AppRoute.JORNADAS, icon: Icons.Journeys },
          { label: t('themes'), path: AppRoute.TEMAS, icon: Icons.Themes },
          { label: t('explore'), path: AppRoute.BIBLIOTECA, icon: Icons.Compass },
          { label: 'Busca Global', path: AppRoute.BUSCAR, icon: Icons.Search },
          { label: t('community'), path: AppRoute.COMMUNITY, icon: Icons.Users },
          { label: t('profile'), path: AppRoute.PROFILE, icon: Icons.User },
          { label: 'Diário Espiritual', path: AppRoute.DIARIO, icon: Icons.PenLine },
        ]
      },
      {
        label: 'Devocionário',
        items: [
          { label: t('bible'), path: AppRoute.BIBLE, icon: Icons.Bible },
          { label: t('catechism'), path: AppRoute.CATECHISM, icon: Icons.Catechism },
          { label: 'Explorar Catecismo', path: AppRoute.CATECHISM_EXPLORER, icon: Icons.Search },
          { label: t('liturgy'), path: AppRoute.LITURGIA, icon: Icons.Liturgy },
          { label: t('rosary') || 'Santo Rosário', path: AppRoute.ROSARY, icon: Icons.Heart },
          { label: t('prayers'), path: AppRoute.ORACAO, icon: Icons.Volume2 },
          { label: t('via_crucis') || 'Via Sacra', path: AppRoute.VIA_CRUCIS, icon: Icons.Cross },
          { label: t('confession') || 'Confissão', path: AppRoute.POENITENTIA, icon: Icons.Flame },
          { label: t('lectio_divina') || 'Lectio Divina', path: AppRoute.LECTIO_DIVINA, icon: Icons.Lectio },
          { label: t('breviary') || 'Breviário', path: AppRoute.BREVIARY, icon: Icons.Clock },
          { label: t('litanies') || 'Ladainhas', path: AppRoute.LITANIES, icon: Icons.MessageCircle },
        ]
      },
      {
        label: 'Formação',
        items: [
          { label: 'Quiz da Fé', path: AppRoute.CERTAMEN, icon: Icons.Trophy, pro: false },
          { label: t('magisterium') || 'Magistério', path: AppRoute.MAGISTERIUM, icon: Icons.ScrollText },
          { label: t('encyclopedia') || 'Enciclopédia', path: AppRoute.ENCYCLOPEDIA, icon: Icons.Library },
          { label: t('dogmas') || 'Dogmas da Fé', path: AppRoute.DOGMAS, icon: Icons.ScrollText },
          { label: t('apparitions') || 'Aparições', path: AppRoute.APARICOES, icon: Icons.Heart },
          { label: t('az_faith') || 'A–Z da Fé', path: AppRoute.AZ_FAITH, icon: Icons.AZ },
          { label: t('popes') || 'Os Papas', path: AppRoute.POPES, icon: Icons.ShieldCheck },
          { label: t('aquinas') || 'Obras de Aquino', path: AppRoute.AQUINAS_OPERA, icon: Icons.Aquinas },
        ]
      },
      {
        label: t('digital'),
        items: [
          { label: t('about') || 'Sobre', path: AppRoute.ABOUT, icon: Icons.Creator },
          { label: t('partners') || 'Parceiros', path: AppRoute.PARTNERS, icon: Icons.Handshake },
          { label: 'Guia de Módulos', path: AppRoute.MODULES_GUIDE, icon: Icons.HelpCircle },
          { label: t('transparency') || 'Transparência', path: AppRoute.TRANSPARENCY, icon: Icons.Info },
          { label: 'Status da Rede', path: AppRoute.OFFLINE, icon: Icons.Globe },
          { label: 'Gerenciar Cache', path: AppRoute.CACHE_MANAGER, icon: Icons.Database },
        ]
      }
    ];

    return rawSections.map(section => ({
      ...section,
      items: section.items.filter(item => canUserAccess(user?.role, item.path))
    })).filter(section => section.items.length > 0);
  }, [t, user?.role]);

  const handleNav = (item: string | { path: string; onClick?: () => void }) => {
    const path = typeof item === 'string' ? item : item.path;
    if (typeof item !== 'string' && item.onClick) item.onClick();
    navigate(path);
    onClose?.();
  };

  return (
    <>
      <aside ref={ref} className="h-full w-[280px] bg-card border-r border-border/20 flex flex-col p-6 overflow-hidden">
        <button 
          className="mb-8 px-1 flex items-center gap-3 cursor-pointer group hover:opacity-90 transition-opacity focus-visible:ring-2 focus-visible:ring-primary/20 rounded-lg outline-none" 
          onClick={() => handleNav(AppRoute.HOJE)}
          aria-label="Ir para a página inicial"
        >
          <Icons.Logo className="w-8 h-8 flex-shrink-0" variant="blue" />
          <div className="space-y-0.5">
            <h1 className="text-lg font-display font-medium tracking-[0.05em] text-primary leading-none uppercase">CATHEDRA</h1>
            <p className="text-[9px] font-bold uppercase text-secondary/60 tracking-[0.3em]">
              Digital Sanctuarium
            </p>
          </div>
        </button>

        <nav className="flex-1 space-y-6 overflow-y-auto pb-4 no-scrollbar">
          {sections.map((section) => (section.items.length > 0 && (
            <div key={section.label}>
              <h3 className="text-[9px] font-bold uppercase tracking-[0.3em] text-muted-foreground/30 mb-4 px-3">{section.label}</h3>
              <ul className="space-y-1">
                {section.items.map((item, idx) => (
                  <li key={idx}>
                    <Button
                      variant="ghost"
                      onClick={() => handleNav(item.path)}
                      onMouseEnter={() => prefetchRoute(item.path)}
                      onTouchStart={() => prefetchRoute(item.path)}
                      aria-current={currentPath === item.path ? 'page' : undefined}
                      className={`w-full flex items-center justify-start gap-4 px-4 py-3.5 rounded-xl text-xs font-bold transition-all focus-visible:ring-2 focus-visible:ring-primary/20 outline-none h-auto min-h-[48px] border-none shadow-none
                        ${currentPath === item.path
                          ? 'bg-primary text-primary-foreground shadow-premium hover:opacity-90'
                          : 'text-muted-foreground/60 hover:bg-primary/[0.03] hover:text-primary'}`}
                    >
                      <CathedraIcon icon={item.icon as any} size={IconSizePreset.TINY} variant="primary" containerClassName="bg-transparent border-none" className="opacity-70" />
                      <span className="tracking-tight truncate text-[11px] font-medium">{item.label}</span>
                      {item.path === AppRoute.CACHE_MANAGER && cacheCount !== null && cacheCount > 0 && (
                        <span className="ml-auto bg-primary/20 text-primary text-premium-tiny font-black px-1.5 py-0.5 rounded-full flex-shrink-0">
                          {cacheCount}
                        </span>
                      )}
                      {(item as any).pro && <span className="ml-auto text-premium-tiny font-black uppercase tracking-widest text-primary bg-primary/10 px-1.5 py-0.5 rounded flex-shrink-0">PRO</span>}
                      {currentPath === item.path && item.path !== AppRoute.CACHE_MANAGER && <div className="ml-auto w-1 h-1 rounded-premium-sm bg-primary flex-shrink-0" />}
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
                className="flex-1 min-w-[90px] h-10 rounded-xl border border-border bg-muted flex items-center justify-center gap-2 transition-all active:scale-95 focus-visible:ring-2 focus-visible:ring-primary outline-none"
                aria-label={isDark ? "Mudar para modo claro" : "Mudar para modo escuro"}
              >
                {isDark ? <Icons.Sun className="w-4 h-4 text-primary" /> : <Icons.Moon className="w-4 h-4" />}
                <span className="text-[9px] font-black uppercase tracking-widest truncate">{isDark ? (lang === 'pt' ? 'Claro' : 'Light') : (lang === 'pt' ? 'Escuro' : 'Dark')}</span>
              </Button>

              <Button 
                variant={isHighContrast ? "default" : "outline"}
                size="sm"
                onClick={onToggleHighContrast} 
                className={`flex-1 min-w-[90px] h-10 rounded-xl border border-border flex items-center justify-center gap-2 transition-all active:scale-95 focus-visible:ring-2 focus-visible:ring-primary outline-none ${
                  !isHighContrast ? 'bg-muted' : 'ring-2 ring-primary ring-offset-1'
                }`}
                aria-label={isHighContrast ? "Desativar alto contraste" : "Ativar alto contraste"}
              >
                <Icons.ShieldCheck className="w-5 h-5" />
                <span className="text-[9px] font-black uppercase tracking-widest truncate">{isHighContrast ? 'Contraste +' : 'Contraste'}</span>
              </Button>
            </div>

            <div className="flex gap-2">
              <Button 
                variant={isSpeaking ? "default" : "outline"}
                size="sm"
                onClick={onToggleSpeak} 
                className={`flex-1 h-10 rounded-xl border border-border flex items-center justify-center gap-2 transition-all active:scale-95 focus-visible:ring-2 focus-visible:ring-primary outline-none ${
                  !isSpeaking ? 'bg-muted' : ''
                }`}
                aria-label={isSpeaking ? t('audio_stop') : t('audio_read')}
              >
                {isSpeaking ? <Icons.Message className="w-4 h-4 animate-pulse" /> : <Icons.Volume2 className="w-4 h-4" />}
                <span className="text-[9px] font-black uppercase tracking-widest">{isSpeaking ? t('audio_stop') : t('audio_read')}</span>
              </Button>
            </div>

            <div className="flex flex-wrap gap-1 mt-1">
              {(['pt', 'en', 'es', 'la', 'it', 'fr', 'de'] as const).map((l) => (
                <Button
                  key={l}
                  onClick={() => (window as any).dispatchEvent(new CustomEvent('change-lang', { detail: l }))}
                  aria-label={`Mudar idioma para ${l.toUpperCase()}`}
                  aria-pressed={lang === l}
                  className={`px-2 py-1 text-[9px] font-black uppercase rounded-lg border transition-all focus-visible:ring-2 focus-visible:ring-primary outline-none ${
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
              className="w-full flex items-center gap-3 p-3 bg-muted/30 rounded-xl hover:border-primary/20 border border-border/10 transition-all cursor-pointer shadow-soft group"
            >
              <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center text-primary-foreground font-bold shadow-soft group-hover:scale-105 transition-transform text-xs">
                {user.avatar ? (
                  <img src={user.avatar} alt={user.name} className="w-full h-full object-cover rounded-premium-sm" />
                ) : (
                  user.name.charAt(0).toUpperCase()
                )}
              </div>
              <div className="flex-1 min-w-0 text-left">
                <p className="text-sm font-bold truncate text-primary/80">{user.name}</p>
                <p className="text-[9px] uppercase text-secondary font-bold tracking-[0.1em] mt-0.5">{user.isPremium ? 'PRO' : 'Gratuito'}</p>
                {!user.isPremium && (
                  <div 
                    onClick={(e) => { e.stopPropagation(); handleNav(AppRoute.UPGRADE); }}
                    className="mt-1 inline-flex items-center gap-1 text-[8px] font-black uppercase tracking-widest bg-primary/10 text-primary px-1.5 py-0.5 rounded-md hover:bg-primary hover:text-white transition-colors animate-pulse"
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
            <Button onClick={() => handleNav(AppRoute.LOGIN)} className="w-full h-11 bg-foreground text-background rounded-xl font-black uppercase text-[10px] tracking-widest shadow-premium hover:bg-primary hover:text-primary-foreground transition-all">
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
