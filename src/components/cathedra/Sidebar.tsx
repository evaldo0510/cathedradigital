import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { prefetchRoute } from '@/lib/prefetch';
import { Logo, Icons } from '../../constants';
import { AppRoute, User } from '../../types';
import { BibleModal, CatechismModal, DocumentsModal } from './QuickModals';


interface SidebarProps {
  onClose?: () => void;
  user: User | null;
  isDark?: boolean;
  onToggleDark?: () => void;
  onSignOut?: () => void;
}

const Sidebar: React.FC<SidebarProps> = React.memo(({ onClose, user, isDark, onToggleDark, onSignOut }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const currentPath = location.pathname;
  const [modal, setModal] = useState<'bible' | 'catechism' | 'docs' | null>(null);

  const sections = [
    ...(user?.role === 'admin' ? [{
      label: 'Administração',
      items: [
        { label: 'Painel Admin', path: AppRoute.ADMIN, icon: <Icons.ShieldCheck className="w-5 h-5" /> },
      ]
    }] : []),
    {
      label: 'Principal',
      items: [
        { label: 'Hoje', path: AppRoute.HOJE, icon: <Icons.Sun className="w-5 h-5" /> },
        { label: 'Jornadas', path: AppRoute.JORNADAS, icon: <Icons.Route className="w-5 h-5" /> },
        { label: 'Diagnóstico', path: AppRoute.DIAGNOSTICO, icon: <Icons.Stethoscope className="w-5 h-5" /> },
        { label: 'Biblioteca', path: AppRoute.BIBLIOTECA, icon: <Icons.Library className="w-5 h-5" /> },
        { label: 'Favoritos', path: AppRoute.FAVORITES, icon: <Icons.Bookmark className="w-5 h-5" /> },
      ]
    },
    {
      label: 'Vida Interior',
      items: [
        { label: 'Oração e Devoção', path: AppRoute.ORACAO, icon: <Icons.PrayingHands className="w-5 h-5" /> },
        { label: 'Liturgia', path: AppRoute.LITURGIA, icon: <Icons.Chalice className="w-5 h-5" /> },
        { label: 'Santo Rosário', path: AppRoute.ROSARY, icon: <Icons.Rosary className="w-5 h-5" /> },
        { label: 'Via Crucis', path: AppRoute.VIA_CRUCIS, icon: <Icons.ViaCrucis className="w-5 h-5" /> },
        { label: 'Breviário', path: AppRoute.BREVIARY, icon: <Icons.HolyBible className="w-5 h-5" /> },
        { label: 'Confissão (Exame)', path: AppRoute.POENITENTIA, icon: <Icons.Check className="w-5 h-5" /> },
        { label: 'Lectio Divina', path: AppRoute.LECTIO_DIVINA, icon: <Icons.Feather className="w-5 h-5" /> },
        { label: 'Litanias', path: AppRoute.LITANIES, icon: <Icons.Scroll className="w-5 h-5" /> },
        { label: 'Aparições Marianas', path: AppRoute.APARICOES, icon: <Icons.SaintHalo className="w-5 h-5" /> },
      ]
    },
    {
      label: 'Recursos Pro',
      items: [
        { label: 'Colloquium IA', path: AppRoute.STUDY_MODE, icon: <Icons.Dove className="w-5 h-5" />, pro: true },
        { label: 'Suma Teológica', path: AppRoute.AQUINAS_OPERA, icon: <Icons.Scroll className="w-5 h-5" /> },
        { label: 'Certamen (Quiz)', path: AppRoute.CERTAMEN, icon: <Icons.Trophy className="w-5 h-5" /> },
        { label: 'Assinatura PRO', path: AppRoute.CHECKOUT, icon: <Icons.Zap className="w-5 h-5" />, pro: true },
        { label: 'Comunidade', path: AppRoute.COMMUNITY, icon: <Icons.Message className="w-5 h-5" /> },
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
          <div className="transition-all group-hover:rotate-3">
            <Logo className="w-12 h-12" />
          </div>
          <div>
            <h1 className="text-lg font-black tracking-[0.2em] text-foreground leading-none uppercase font-serif">CATHEDRA</h1>
            <p className="text-[9px] font-black uppercase text-primary/70 tracking-[0.3em] mt-1.5 flex items-center gap-1.5">
              <span className="w-1 h-1 rounded-full bg-primary animate-pulse" />
              Digital Sanctuarium
            </p>
          </div>
        </div>

        {/* Quick access modals */}
        <div className="flex gap-2 mb-8 px-2">
          {[
            { id: 'bible', label: 'Bíblia', icon: <Icons.HolyBible className="w-4 h-4" />, color: 'bg-primary/5 text-primary border-primary/10' },
            { id: 'catechism', label: 'CIC', icon: <Icons.CatechismShield className="w-4 h-4" />, color: 'bg-secondary/10 text-primary border-secondary/20' },
            { id: 'docs', label: 'Docs', icon: <Icons.Scroll className="w-4 h-4" />, color: 'bg-primary/5 text-primary border-primary/10' }
          ].map(item => (
            <button 
              key={item.id}
              onClick={() => setModal(item.id as any)} 
              className={`flex-1 flex flex-col items-center gap-1.5 p-3 rounded-2xl border ${item.color} hover:scale-105 transition-all shadow-sm active:scale-95`}
            >
              <div className="opacity-80">{item.icon}</div>
              <span className="text-[8px] font-black uppercase tracking-widest">{item.label}</span>
            </button>
          ))}
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
            <Search className="w-3 h-3" />
            <span className="text-[9px]">Pressione</span>
            <kbd className="px-1.5 py-0.5 rounded bg-muted text-[9px] font-mono font-bold">⌘K</kbd>
            <span className="text-[9px]">para buscar</span>
          </div>
        </div>

        <div className="pt-4 pb-20 lg:pb-0 border-t border-border space-y-3">
          <div className="flex gap-2 mb-2 px-1">
            <button 
              onClick={onToggleDark} 
              className="flex-1 p-3 bg-muted text-muted-foreground hover:text-primary rounded-xl border border-border flex items-center justify-center gap-2 transition-all active:scale-95"
            >
              {isDark ? <Sun className="w-4 h-4 text-primary" /> : <Moon className="w-4 h-4" />}
              <span className="text-[10px] font-black uppercase tracking-widest">{isDark ? 'Claro' : 'Escuro'}</span>
            </button>
            
            {user && (
              <button 
                onClick={onSignOut} 
                className="flex-1 p-3 bg-muted text-muted-foreground hover:text-destructive rounded-xl border border-border flex items-center justify-center gap-2 transition-all active:scale-95"
              >
                <LogOut className="w-4 h-4" />
                <span className="text-[10px] font-black uppercase tracking-widest">Sair</span>
              </button>
            )}
          </div>

          {user ? (
            <button onClick={() => handleNav(AppRoute.PROFILE)} className="w-full flex items-center gap-3 p-3 bg-muted rounded-2xl hover:border-primary border border-transparent transition-all">
              <div className="w-10 h-10 rounded-xl bg-foreground flex items-center justify-center text-background font-black shadow-sm">{user.name.charAt(0).toUpperCase()}</div>
              <div className="flex-1 min-w-0 text-left">
                <p className="text-xs font-bold truncate text-foreground">{user.name}</p>
                <p className="text-[8px] uppercase text-primary font-black tracking-widest">{user.isPremium ? 'PRO' : 'Gratuito'}</p>
              </div>
            </button>
          ) : (
            <button onClick={() => handleNav(AppRoute.LOGIN)} className="w-full py-4 bg-foreground text-background rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl hover:bg-primary hover:text-primary-foreground transition-all">
              Acessar Conta
            </button>
          )}
        </div>
      </aside>

      {/* Quick modals */}
      <BibleModal isOpen={modal === 'bible'} onClose={() => setModal(null)} />
      <CatechismModal isOpen={modal === 'catechism'} onClose={() => setModal(null)} />
      <DocumentsModal isOpen={modal === 'docs'} onClose={() => setModal(null)} />
    </>
  );
});

Sidebar.displayName = 'Sidebar';

export default Sidebar;