import React, { useState, useEffect, useContext } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { prefetchRoute } from '@/lib/prefetch';
import { Icons } from '../../constants';
import { AppRoute, User } from '../../types';
import { LangContext } from '@/contexts/LangContext';

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
        { label: t('explore'), path: AppRoute.BIBLIOTECA, icon: <Icons.Search className="w-5 h-5" /> },
        { label: 'Busca Global', path: AppRoute.BUSCAR, icon: <Icons.Globe className="w-5 h-5" /> },
        { label: t('community'), path: AppRoute.COMMUNITY, icon: <Icons.Users className="w-5 h-5" /> },
        { label: t('profile'), path: AppRoute.PROFILE, icon: <Icons.User className="w-5 h-5" /> },
      ]
    },
    {
      label: 'Devocionário',
      items: [
        { label: 'Bíblia Sagrada', path: AppRoute.BIBLE, icon: <Icons.Bible className="w-5 h-5" /> },
        { label: 'Catecismo', path: AppRoute.CATECHISM, icon: <Icons.Catechism className="w-5 h-5" /> },
        { label: 'Liturgia Diária', path: AppRoute.LITURGIA, icon: <Icons.Liturgy className="w-5 h-5" /> },
        { label: 'Santo Rosário', path: AppRoute.ROSARY, icon: <Icons.Heart className="w-5 h-5" /> },
        { label: 'Orações', path: AppRoute.ORACAO, icon: <Icons.Volume2 className="w-5 h-5" /> },
        { label: 'Via Sacra', path: AppRoute.VIA_CRUCIS, icon: <Icons.Cross className="w-5 h-5" /> },
        { label: 'Confissão', path: AppRoute.POENITENTIA, icon: <Icons.Flame className="w-5 h-5" /> },
        { label: 'Lectio Divina', path: AppRoute.LECTIO_DIVINA, icon: <Icons.Lectio className="w-5 h-5" /> },
      ]
    },
    {
      label: 'Formação',
      items: [
        { label: 'Quiz da Fé', path: AppRoute.CERTAMEN, icon: <Icons.Trophy className="w-5 h-5" />, pro: false },
        { label: 'Magistério', path: AppRoute.MAGISTERIUM, icon: <Icons.ScrollText className="w-5 h-5" /> },
        { label: 'Enciclopédia', path: AppRoute.ENCYCLOPEDIA, icon: <Icons.Library className="w-5 h-5" /> },
        { label: 'Dogmas da Fé', path: AppRoute.DOGMAS, icon: <Icons.ScrollText className="w-5 h-5" /> },
        { label: 'Aparições', path: AppRoute.APARICOES, icon: <Icons.Heart className="w-5 h-5" /> },
        { label: t('az_faith') || 'A–Z da Fé', path: AppRoute.AZ_FAITH, icon: <Icons.AZ className="w-5 h-5" /> },
        { label: 'Os Papas', path: AppRoute.POPES, icon: <Icons.ShieldCheck className="w-5 h-5" /> },
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
      <aside ref={ref} className="h-full w-72 bg-card border-r border-border flex flex-col p-5 overflow-hidden">
        <div className="mb-4 px-2 flex items-center gap-3 cursor-pointer group hover:opacity-90 transition-opacity" onClick={() => handleNav(AppRoute.DASHBOARD)}>
          <Icons.Logo className="w-8 h-8 flex-shrink-0" variant="blue" />
          <div>
            <h1 className="text-lg font-black tracking-[0.2em] text-foreground leading-none uppercase font-serif">CATHEDRA</h1>
            <p className="text-[9px] font-black uppercase text-primary/70 tracking-[0.3em] mt-1.5 flex items-center gap-1.5">
              <span className="w-1 h-1 rounded-full bg-primary animate-pulse" />
              Digital Sanctuarium
            </p>
          </div>
        </div>

        <nav className="flex-1 space-y-6 overflow-y-auto pb-4 no-scrollbar">
          {sections.map((section) => (section.items.length > 0 && (
            <div key={section.label}>
              <h3 className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground mb-4 px-4">{section.label}</h3>
              <ul className="space-y-1">
                {section.items.map((item, idx) => (
                  <li key={idx}>
                    <button
                      onClick={() => handleNav(item.path)}
                      onMouseEnter={() => prefetchRoute(item.path)}
                      onTouchStart={() => prefetchRoute(item.path)}
                      className={`w-full flex items-center gap-4 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all
                        ${currentPath === item.path
                          ? 'bg-foreground text-background shadow-lg'
                          : 'text-muted-foreground hover:bg-muted hover:text-foreground'}`}
                    >
                      <span className="opacity-70">{item.icon}</span>
                      <span className="tracking-tight">{item.label}</span>
                      {(item as any).pro && <span className="ml-auto text-[8px] font-black uppercase tracking-widest text-primary bg-primary/10 px-1.5 py-0.5 rounded">PRO</span>}
                      {currentPath === item.path && <div className="ml-auto w-1 h-1 rounded-full bg-primary" />}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )))}
        </nav>


        <div className="pt-4 pb-20 lg:pb-0 border-t border-border space-y-3">
          <div className="flex flex-col gap-2 mb-2 px-1">
            <div className="flex gap-2">
              <button 
                onClick={onToggleDark} 
                className="flex-1 p-3 bg-muted text-muted-foreground hover:text-primary rounded-xl border border-border flex items-center justify-center gap-2 transition-all active:scale-95"
              >
                {isDark ? <Icons.Sun className="w-4 h-4 text-primary" /> : <Icons.Moon className="w-4 h-4" />}
                <span className="text-[10px] font-black uppercase tracking-widest">{isDark ? (lang === 'pt' ? 'Claro' : 'Light') : (lang === 'pt' ? 'Escuro' : 'Dark')}</span>
              </button>

              <button 
                onClick={onToggleSpeak} 
                className={`flex-1 p-3 rounded-xl border border-border flex items-center justify-center gap-2 transition-all active:scale-95 ${
                  isSpeaking ? 'bg-primary text-white' : 'bg-muted text-muted-foreground hover:text-primary'
                }`}
              >
                {isSpeaking ? <Icons.Message className="w-4 h-4 animate-pulse" /> : <Icons.Volume2 className="w-4 h-4" />}
                <span className="text-[10px] font-black uppercase tracking-widest">{isSpeaking ? t('audio_stop') : t('audio_read')}</span>
              </button>
            </div>

            <div className="flex flex-wrap gap-1 mt-1">
              {(['pt', 'en', 'es', 'la', 'it', 'fr', 'de'] as const).map((l) => (
                <button
                  key={l}
                  onClick={() => (window as any).dispatchEvent(new CustomEvent('change-lang', { detail: l }))}
                  className={`px-2 py-1 text-[8px] font-black uppercase rounded-lg border transition-all ${
                    lang === l 
                      ? 'bg-primary text-white border-primary' 
                      : 'bg-muted text-muted-foreground border-border hover:border-primary/50'
                  }`}
                >
                  {l}
                </button>
              ))}
            </div>
          </div>

          {user ? (
            <div 
              onClick={() => handleNav(AppRoute.PROFILE)} 
              className="w-full flex items-center gap-3 p-3 bg-muted rounded-2xl hover:border-primary border border-transparent transition-all cursor-pointer"
            >
              <div className="w-10 h-10 rounded-xl bg-foreground flex items-center justify-center text-background font-black shadow-sm">
                {user.avatar ? (
                  <img src={user.avatar} alt={user.name} className="w-full h-full object-cover rounded-xl" />
                ) : (
                  user.name.charAt(0).toUpperCase()
                )}
              </div>
              <div className="flex-1 min-w-0 text-left">
                <p className="text-xs font-bold truncate text-foreground">{user.name}</p>
                <p className="text-[8px] uppercase text-primary font-black tracking-widest">{user.isPremium ? 'PRO' : 'Gratuito'}</p>
                {!user.isPremium && (
                  <div 
                    onClick={(e) => { e.stopPropagation(); handleNav(AppRoute.UPGRADE); }}
                    className="mt-1 inline-flex items-center gap-1 text-[7px] font-black uppercase tracking-widest bg-primary/10 text-primary px-1.5 py-0.5 rounded-full hover:bg-primary hover:text-white transition-colors animate-pulse"
                  >
                    Upgrade <Icons.ArrowRight className="w-2 h-2" />
                  </div>
                )}
              </div>
              <button 
                onClick={(e) => { e.stopPropagation(); onSignOut?.(); }}
                className="p-2 text-muted-foreground hover:text-destructive transition-colors"
                title={t('exit_session')}
              >
                <Icons.LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button onClick={() => handleNav(AppRoute.LOGIN)} className="w-full py-4 bg-foreground text-background rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl hover:bg-primary hover:text-primary-foreground transition-all">
              {t('enter')}
            </button>
          )}
        </div>
      </aside>
    </>
  );
}));

Sidebar.displayName = 'Sidebar';

export default Sidebar;
