import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { prefetchRoute } from '@/lib/prefetch';
import { Icons } from '../../constants';
import { AppRoute, User } from '../../types';
import cathedraLogo from '@/assets/cathedra-logo.png';



interface SidebarProps {
  onClose?: () => void;
  user: User | null;
  isDark?: boolean;
  onToggleDark?: () => void;
  isSpeaking?: boolean;
  onToggleSpeak?: () => void;
  onSignOut?: () => void;
}

const Sidebar: React.FC<SidebarProps> = React.memo(({ onClose, user, isDark, onToggleDark, isSpeaking, onToggleSpeak, onSignOut }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const currentPath = location.pathname;
  

  const sections = [
    ...(user?.role === 'admin' ? [{
      label: 'Administração',
      items: [
        { label: 'Painel Admin', path: AppRoute.ADMIN, icon: <Icons.ShieldCheck className="w-5 h-5" /> },
      ]
    }] : []),
    {
      label: 'Menu',
      items: [
        { label: 'Início', path: AppRoute.HOJE, icon: <Icons.Home className="w-5 h-5" /> },
        { label: 'Jornada', path: AppRoute.JORNADAS, icon: <Icons.Route className="w-5 h-5" /> },
        { label: 'Temas', path: AppRoute.TEMAS, icon: <Icons.Tag className="w-5 h-5" /> },
        { label: 'Explorar', path: AppRoute.BIBLIOTECA, icon: <Icons.Search className="w-5 h-5" /> },
        { label: 'Comunidade', path: AppRoute.COMMUNITY, icon: <Icons.Users className="w-5 h-5" /> },
        { label: 'Perfil', path: AppRoute.PROFILE, icon: <Icons.User className="w-5 h-5" /> },
      ]
    },
    {
      label: 'Plataforma',
      items: [
        { label: 'Criador', path: AppRoute.ABOUT, icon: <Icons.Creator className="w-5 h-5" /> },
        { label: 'Parceiros', path: AppRoute.PARTNERS, icon: <Icons.Handshake className="w-5 h-5" /> },
      ]
    }
  ];

  const handleNav = (path: string) => {
    navigate(path);
    onClose?.();
  };

  return (
    <>
      <aside className="h-full w-72 bg-card border-r border-border flex flex-col p-5 overflow-hidden">
        <div className="mb-6 px-2 flex items-center gap-3 cursor-pointer group hover:opacity-90 transition-opacity" onClick={() => handleNav(AppRoute.DASHBOARD)}>
          <img src={cathedraLogo} alt="Cathedra" className="w-8 h-8 object-contain" />
          <div>
            <h1 className="text-lg font-black tracking-[0.2em] text-foreground leading-none uppercase font-serif">CATHEDRA</h1>
            <p className="text-[9px] font-black uppercase text-primary/70 tracking-[0.3em] mt-1.5 flex items-center gap-1.5">
              <span className="w-1 h-1 rounded-full bg-primary animate-pulse" />
              Digital Sanctuarium
            </p>
          </div>
        </div>


        <nav className="flex-1 space-y-8 overflow-y-auto pb-10">
          {sections.map((section) => (
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
          ))}
        </nav>

        {/* Ctrl+K hint */}
        <div className="px-4 pb-3">
          <div className="flex items-center gap-2 text-muted-foreground/60">
            <Icons.Search className="w-3 h-3" />
            <span className="text-[9px]">Pressione</span>
            <kbd className="px-1.5 py-0.5 rounded bg-muted text-[9px] font-mono font-bold">⌘K</kbd>
            <span className="text-[9px]">para buscar</span>
          </div>
        </div>

        <div className="pt-4 pb-20 lg:pb-0 border-t border-border space-y-3">
          <div className="flex flex-col gap-2 mb-2 px-1">
            <div className="flex gap-2">
              <button 
                onClick={onToggleDark} 
                className="flex-1 p-3 bg-muted text-muted-foreground hover:text-primary rounded-xl border border-border flex items-center justify-center gap-2 transition-all active:scale-95"
              >
                {isDark ? <Icons.Sun className="w-4 h-4 text-primary" /> : <Icons.Moon className="w-4 h-4" />}
                <span className="text-[10px] font-black uppercase tracking-widest">{isDark ? 'Claro' : 'Escuro'}</span>
              </button>

              <button 
                onClick={onToggleSpeak} 
                className={`flex-1 p-3 rounded-xl border border-border flex items-center justify-center gap-2 transition-all active:scale-95 ${
                  isSpeaking ? 'bg-primary text-white' : 'bg-muted text-muted-foreground hover:text-primary'
                }`}
              >
                {isSpeaking ? <Icons.Message className="w-4 h-4 animate-pulse" /> : <Icons.Volume2 className="w-4 h-4" />}
                <span className="text-[10px] font-black uppercase tracking-widest">{isSpeaking ? 'Parar' : 'Ouvir'}</span>
              </button>
            </div>

            <div className="flex flex-wrap gap-1 mt-1">
              {(['pt', 'en', 'es', 'la'] as const).map((l) => (
                <button
                  key={l}
                  onClick={() => (window as any).dispatchEvent(new CustomEvent('change-lang', { detail: l }))}
                  className={`px-2 py-1 text-[8px] font-black uppercase rounded-lg border transition-all ${
                    (window as any).currentLang === l 
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
            <button onClick={() => handleNav(AppRoute.PROFILE)} className="w-full flex items-center gap-3 p-3 bg-muted rounded-2xl hover:border-primary border border-transparent transition-all">
              <div className="w-10 h-10 rounded-xl bg-foreground flex items-center justify-center text-background font-black shadow-sm">{user.name.charAt(0).toUpperCase()}</div>
              <div className="flex-1 min-w-0 text-left">
                <p className="text-xs font-bold truncate text-foreground">{user.name}</p>
                <p className="text-[8px] uppercase text-primary font-black tracking-widest">{user.isPremium ? 'PRO' : 'Gratuito'}</p>
                {!user.isPremium && (
                  <button 
                    onClick={(e) => { e.stopPropagation(); handleNav(AppRoute.UPGRADE); }}
                    className="mt-1 flex items-center gap-1 text-[7px] font-black uppercase tracking-widest bg-primary/10 text-primary px-1.5 py-0.5 rounded-full hover:bg-primary hover:text-white transition-colors animate-pulse"
                  >
                    Upgrade <Icons.ArrowRight className="w-2 h-2" />
                  </button>
                )}
              </div>
            </button>
          ) : (
            <button onClick={() => handleNav(AppRoute.LOGIN)} className="w-full py-4 bg-foreground text-background rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl hover:bg-primary hover:text-primary-foreground transition-all">
              Acessar Conta
            </button>
          )}
        </div>
      </aside>

    </>
  );
});

Sidebar.displayName = 'Sidebar';

export default Sidebar;