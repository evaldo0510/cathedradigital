import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { AppRoute } from '../../types';
import { Sun, Compass, BookOpen, TrendingUp, User } from 'lucide-react';

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
    className={`flex flex-col items-center justify-center gap-0.5 sm:gap-1 flex-1 py-1.5 transition-all relative tap-highlight-transparent touch-manipulation ${
      isActive ? 'text-primary' : 'text-muted-foreground active:text-foreground'
    }`}
  >
    <div className={`transition-all duration-300 ${isActive ? 'scale-105 -translate-y-0.5' : 'active:scale-90'}`}>
      {React.cloneElement(icon as React.ReactElement, { 
        className: `w-5 h-5 sm:w-6 sm:h-6 ${isActive ? 'drop-shadow-[0_0_8px_hsl(var(--primary)/0.4)]' : ''}` 
      })}
    </div>
    <span className={`text-[9px] sm:text-[10px] font-black uppercase tracking-widest transition-opacity leading-none ${
      isActive ? 'opacity-100' : 'opacity-60'
    }`}>
      {label}
    </span>
    {isActive && (
      <div className="absolute top-0.5 left-1/2 -translate-x-1/2 w-6 h-0.5 bg-primary rounded-full shadow-sm" />
    )}
  </button>
);

interface BottomNavProps {
  onOpenSidebar: () => void;
  user?: { role?: string } | null;
}

const BottomNav: React.FC<BottomNavProps> = ({ user }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const currentPath = location.pathname;

  const items = [
    { label: 'Hoje', icon: <Sun className="w-5 h-5" />, route: AppRoute.HOJE },
    { label: 'Jornadas', icon: <Compass className="w-5 h-5" />, route: AppRoute.JORNADAS },
    { label: 'Biblioteca', icon: <BookOpen className="w-5 h-5" />, route: AppRoute.BIBLIOTECA },
    { label: 'Progresso', icon: <TrendingUp className="w-5 h-5" />, route: AppRoute.DASHBOARD },
    { label: 'Perfil', icon: <User className="w-5 h-5" />, route: AppRoute.PROFILE },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[160] px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pointer-events-none">
      <div className="max-w-md mx-auto bg-black/95 backdrop-blur-3xl border border-white/10 rounded-2xl shadow-[0_20px_50px_-12px_rgba(0,0,0,0.8)] flex items-stretch pointer-events-auto overflow-hidden ring-1 ring-primary/20">
        {items.map((item) => (
          <BottomNavItem 
            key={item.label}
            label={item.label}
            icon={item.icon}
            route={item.route}
            isActive={currentPath === item.route || (item.route === AppRoute.BIBLE && [AppRoute.BIBLE, AppRoute.CATECHISM, AppRoute.MAGISTERIUM, AppRoute.SAINTS].includes(currentPath as AppRoute))}
            onClick={() => navigate(item.route)}
          />
        ))}
      </div>
    </div>
  );
};

export default BottomNav;
