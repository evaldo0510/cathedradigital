import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Icons, Logo } from '../../constants';
import { AppRoute, User } from '../../types';

interface SidebarProps {
  onClose?: () => void;
  user: User | null;
}

const Sidebar: React.FC<SidebarProps> = React.memo(({ onClose, user }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const currentPath = location.pathname;

  const sections = [
    {
      label: 'Vida Interior',
      items: [
        { label: 'Oração e Devoção', path: AppRoute.ORACAO, icon: <Icons.Heart className="w-5 h-5" /> },
        { label: 'Liturgia & Orações', path: AppRoute.DAILY_LITURGY, icon: <Icons.Star className="w-5 h-5" /> },
        { label: 'Santo Rosário', path: AppRoute.ROSARY, icon: <Icons.Heart className="w-5 h-5" /> },
        { label: 'Via Crucis', path: AppRoute.VIA_CRUCIS, icon: <Icons.Cross className="w-5 h-5" /> },
        { label: 'Breviário', path: AppRoute.BREVIARY, icon: <Icons.History className="w-5 h-5" /> },
        { label: 'Lectio Divina', path: AppRoute.LECTIO_DIVINA, icon: <Icons.Feather className="w-5 h-5" /> },
        { label: 'Favoritos', path: AppRoute.FAVORITES, icon: <Icons.Heart className="w-5 h-5" /> },
      ]
    },
    {
      label: 'Formação',
      items: [
        { label: 'Bíblia Sagrada', path: AppRoute.BIBLE, icon: <Icons.Book className="w-5 h-5" /> },
        { label: 'Catecismo (CIC)', path: AppRoute.CATECHISM, icon: <Icons.Cross className="w-5 h-5" /> },
        { label: 'Santos', path: AppRoute.SAINTS, icon: <Icons.Users className="w-5 h-5" /> },
        { label: 'Magistério', path: AppRoute.MAGISTERIUM, icon: <Icons.Globe className="w-5 h-5" /> },
        { label: 'Dogmas', path: AppRoute.DOGMAS, icon: <Icons.Star className="w-5 h-5" /> },
        { label: 'Trilhas de Estudo', path: AppRoute.TRILHAS, icon: <Icons.Layout className="w-5 h-5" /> },
      ]
    },
    {
      label: 'Recursos Pro',
      items: [
        { label: 'Colloquium IA', path: AppRoute.STUDY_MODE, icon: <Icons.Search className="w-5 h-5" />, pro: true },
        { label: 'Suma Teológica', path: AppRoute.AQUINAS_OPERA, icon: <Icons.History className="w-5 h-5" /> },
        { label: 'Certamen (Quiz)', path: AppRoute.CERTAMEN, icon: <Icons.Star className="w-5 h-5" /> },
      ]
    }
  ];

  const handleNav = (path: string) => {
    navigate(path);
    onClose?.();
  };

  return (
    <aside className="h-full w-80 bg-card border-r border-border flex flex-col p-6 overflow-hidden">
      <div className="mb-10 px-2 flex items-center gap-3 cursor-pointer group" onClick={() => handleNav(AppRoute.DASHBOARD)}>
        <Logo className="w-9 h-9" />
        <div>
          <h1 className="text-lg font-black tracking-tight text-foreground leading-none uppercase">CATHEDRA</h1>
          <p className="text-[8px] font-black uppercase text-primary tracking-widest mt-1">Digital Sanctuarium</p>
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

      <div className="pt-6 border-t border-border">
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
  );
});

Sidebar.displayName = 'Sidebar';

export default Sidebar;
