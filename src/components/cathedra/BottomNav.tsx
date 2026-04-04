import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Icons } from '../../constants';
import { AppRoute } from '../../types';

interface BottomNavItemProps {
  label: string;
  icon: React.ReactNode;
  route: string;
  isActive: boolean;
  onClick: () => void;
}

const BottomNavItem: React.FC<BottomNavItemProps> = ({ label, icon, isActive, onClick }) => (
  <button 
    onClick={onClick}
    className={`flex flex-col items-center justify-center gap-1.5 flex-1 py-2.5 transition-all relative ${
      isActive ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
    }`}
  >
    <div className={`transition-transform duration-300 ${isActive ? 'scale-110 -translate-y-0.5' : ''}`}>
      {icon}
    </div>
    <span className={`text-[9px] font-black uppercase tracking-widest transition-opacity ${
      isActive ? 'opacity-100' : 'opacity-60'
    }`}>
      {label}
    </span>
    {isActive && (
      <div className="absolute -top-px left-1/2 -translate-x-1/2 w-8 h-0.5 bg-primary rounded-full shadow-[0_0_10px_rgba(255,215,0,0.5)]" />
    )}
  </button>
);

const BottomNav: React.FC<{ onOpenSidebar: () => void }> = ({ onOpenSidebar }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const currentPath = location.pathname;

  const items = [
    { label: 'Início', icon: <Icons.Layout className="w-5 h-5" />, route: AppRoute.DASHBOARD },
    { label: 'Bíblia', icon: <Icons.Book className="w-5 h-5" />, route: AppRoute.BIBLE },
    { label: 'Orações', icon: <Icons.Heart className="w-5 h-5" />, route: AppRoute.ORACAO },
    { label: 'Catecismo', icon: <Icons.Cross className="w-5 h-5" />, route: AppRoute.CATECHISM },
  ];

  return (
    <div className="lg:hidden fixed bottom-0 left-0 right-0 z-[160] px-4 pb-6 pointer-events-none">
      <div className="max-w-md mx-auto bg-black/90 backdrop-blur-2xl border border-primary/20 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] flex items-stretch pointer-events-auto overflow-hidden ring-1 ring-primary/10">
        {items.map((item) => (
          <BottomNavItem 
            key={item.label}
            label={item.label}
            icon={item.icon}
            route={item.route}
            isActive={currentPath === item.route}
            onClick={() => navigate(item.route)}
          />
        ))}
        <button 
          onClick={onOpenSidebar}
          className="flex flex-col items-center justify-center gap-1.5 flex-1 py-2.5 text-muted-foreground hover:text-foreground transition-all"
        >
          <Icons.Menu className="w-5 h-5" />
          <span className="text-[9px] font-black uppercase tracking-widest opacity-60">Menu</span>
        </button>
      </div>
    </div>
  );
};

export default BottomNav;
