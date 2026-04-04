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
    className={`flex flex-col items-center justify-center gap-1 sm:gap-1.5 flex-1 py-3 transition-all relative tap-highlight-transparent touch-manipulation ${
      isActive ? 'text-primary' : 'text-muted-foreground active:text-foreground'
    }`}
  >
    <div className={`transition-all duration-300 ${isActive ? 'scale-110 -translate-y-0.5' : 'active:scale-90'}`}>
      {React.cloneElement(icon as React.ReactElement, { 
        className: `w-5 h-5 sm:w-6 sm:h-6 ${isActive ? 'drop-shadow-[0_0_8px_rgba(255,215,0,0.4)]' : ''}` 
      })}
    </div>
    <span className={`text-[8px] sm:text-[9px] font-black uppercase tracking-[0.15em] transition-opacity leading-none ${
      isActive ? 'opacity-100' : 'opacity-60'
    }`}>
      {label}
    </span>
    {isActive && (
      <div className="absolute top-1 left-1/2 -translate-x-1/2 w-6 h-0.5 bg-primary rounded-full shadow-[0_0_10px_rgba(255,215,0,0.5)]" />
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
    <div className="lg:hidden fixed bottom-0 left-0 right-0 z-[160] px-4 pb-[max(1.5rem,env(safe-area-inset-bottom))] pointer-events-none">
      <div className="max-w-md mx-auto bg-black/95 backdrop-blur-3xl border border-white/10 rounded-[2rem] shadow-[0_20px_50px_-12px_rgba(0,0,0,0.8)] flex items-stretch pointer-events-auto overflow-hidden ring-1 ring-primary/20">
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
          className="flex flex-col items-center justify-center gap-1 sm:gap-1.5 flex-1 py-3 text-muted-foreground active:text-foreground transition-all tap-highlight-transparent"
        >
          <Icons.Menu className="w-5 h-5 sm:w-6 sm:h-6" />
          <span className="text-[8px] sm:text-[9px] font-black uppercase tracking-[0.15em] opacity-60 leading-none">Menu</span>
        </button>
      </div>
    </div>
  );
};

export default BottomNav;
