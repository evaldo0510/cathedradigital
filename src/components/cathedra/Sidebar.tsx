import React from 'react';
import { Icons, Logo } from '../../constants';
import { AppRoute, User } from '../../types';

interface SidebarProps {
  currentPath: AppRoute;
  onNavigate: (p: AppRoute) => void;
  onClose?: () => void;
  user: User | null;
}

const Sidebar: React.FC<SidebarProps> = ({ currentPath, onNavigate, onClose, user }) => {
  const sections = [
    {
      label: 'Vida Interior',
      items: [
        { label: 'Favoritos', path: AppRoute.FAVORITES, icon: <Icons.Star className="w-5 h-5" /> },
      ]
    },
    {
      label: 'Formação',
      items: [
        { label: 'Bíblia Sagrada', path: AppRoute.BIBLE, icon: <Icons.Book className="w-5 h-5" /> },
        { label: 'Catecismo (CIC)', path: AppRoute.CATECHISM, icon: <Icons.Cross className="w-5 h-5" /> },
        { label: 'Trilhas de Estudo', path: AppRoute.TRILHAS, icon: <Icons.Layout className="w-5 h-5" /> },
        { label: 'Magistério', path: AppRoute.MAGISTERIUM, icon: <Icons.Globe className="w-5 h-5" /> },
      ]
    },
    {
      label: 'Recursos Pro',
      items: [
        { label: 'Colloquium IA', path: AppRoute.STUDY_MODE, icon: <Icons.Search className="w-5 h-5" /> },
        { label: 'Suma Teológica', path: AppRoute.AQUINAS_OPERA, icon: <Icons.History className="w-5 h-5" /> },
        { label: 'Certamen (Quiz)', path: AppRoute.CERTAMEN, icon: <Icons.Star className="w-5 h-5" /> },
      ]
    }
  ];

  const handleNav = (item: any) => {
    if (item.path) {
      onNavigate(item.path);
      if (onClose) onClose();
    }
  };

  return (
    <aside className="h-full w-80 bg-white border-r border-[#e5e7eb] flex flex-col p-6 overflow-hidden">
      <div className="mb-10 px-2 flex items-center gap-3 cursor-pointer group" onClick={() => onNavigate(AppRoute.DASHBOARD)}>
        <Logo className="w-9 h-9" />
        <div>
          <h1 className="text-lg font-black tracking-tight text-[#1f2937] leading-none uppercase">CATHEDRA</h1>
          <p className="text-[8px] font-black uppercase text-[#d4af37] tracking-widest mt-1">Digital Sanctuarium</p>
        </div>
      </div>

      <nav className="flex-1 space-y-8 overflow-y-auto pb-10">
        {sections.map((section) => (
          <div key={section.label}>
            <h3 className="text-[9px] font-black uppercase tracking-[0.2em] text-[#6b7280] mb-4 px-4">{section.label}</h3>
            <ul className="space-y-1">
              {section.items.map((item, idx) => (
                <li key={idx}>
                  <button
                    onClick={() => handleNav(item)}
                    className={`w-full flex items-center gap-4 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all
                      ${item.path && currentPath === item.path
                        ? 'bg-[#1f2937] text-white shadow-lg'
                        : 'text-[#6b7280] hover:bg-[#f5f6f7] hover:text-[#1f2937]'}`}
                  >
                    <span className="opacity-70">{item.icon}</span>
                    <span className="tracking-tight">{item.label}</span>
                    {item.path && currentPath === item.path && <div className="ml-auto w-1 h-1 rounded-full bg-[#d4af37]" />}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </nav>

      <div className="pt-6 border-t border-[#e5e7eb]">
        {user ? (
          <button onClick={() => onNavigate(AppRoute.PROFILE)} className="w-full flex items-center gap-3 p-3 bg-[#f5f6f7] rounded-2xl hover:border-[#d4af37] border border-transparent transition-all">
            <div className="w-10 h-10 rounded-xl bg-[#1f2937] flex items-center justify-center text-white font-black shadow-sm">{user.name.charAt(0)}</div>
            <div className="flex-1 min-w-0 text-left">
              <p className="text-xs font-bold truncate text-[#1f2937]">{user.name}</p>
              <p className="text-[8px] uppercase text-[#d4af37] font-black tracking-widest">Scholar</p>
            </div>
          </button>
        ) : (
          <button onClick={() => onNavigate(AppRoute.LOGIN)} className="w-full py-4 bg-[#1f2937] text-white rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl hover:bg-[#d4af37] transition-all">
            Acessar Conta
          </button>
        )}
      </div>
    </aside>
  );
};

export default Sidebar;
