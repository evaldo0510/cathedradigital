import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { AppRoute } from '../../types';
import { Sun, Compass, BookOpen, Users, User } from 'lucide-react';
import { prefetchRoute } from '@/lib/prefetch';

interface BottomNavItemProps {
  label: string;
  icon: React.ReactNode;
  route: string;
  isActive: boolean;
  onClick: () => void;
}

const BottomNavItem: React.FC<BottomNavItemProps> = ({ label, icon, route, isActive, onClick }) => (
  <button 
    onClick={onClick}
    onTouchStart={() => prefetchRoute(route)}
    onMouseEnter={() => prefetchRoute(route)}
    className={`flex flex-col items-center justify-center gap-1 flex-1 py-1 transition-all relative tap-highlight-transparent touch-manipulation ${
      isActive ? 'text-primary' : 'text-muted-foreground active:text-foreground'
    }`}
  >
    <div className={`transition-all duration-300 ${isActive ? 'scale-110 -translate-y-0.5' : 'active:scale-95'}`}>
      {React.cloneElement(icon as React.ReactElement, { 
        className: `w-5 h-5 sm:w-6 sm:h-6 ${isActive ? 'stroke-[2.5px] drop-shadow-[0_0_8px_hsl(var(--primary)/0.4)]' : 'stroke-[1.5px]'}` 
      })}
    </div>
    <span className={`text-[9px] sm:text-[10px] font-bold uppercase tracking-widest transition-opacity leading-none ${
      isActive ? 'opacity-100' : 'opacity-60'
    }`}>
      {label}
    </span>
    {isActive && (
      <div className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-primary rounded-full shadow-[0_0_8px_hsl(var(--primary))]" />
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
    { label: 'Hoje', icon: <Sun />, route: AppRoute.HOJE },
    { label: 'Jornadas', icon: <Compass />, route: AppRoute.JORNADAS },
    { label: 'Biblioteca', icon: <BookOpen />, route: AppRoute.BIBLIOTECA },
    { label: 'Comunidade', icon: <Users />, route: AppRoute.COMMUNITY },
    { label: 'Perfil', icon: <User />, route: AppRoute.PROFILE },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[160] lg:hidden">
      <div className="bg-background/80 backdrop-blur-xl border-t border-foreground/5 flex items-stretch h-16 pb-safe px-2">
        {items.map((item) => (
          <BottomNavItem 
            key={item.label}
            label={item.label}
            icon={item.icon}
            route={item.route}
            isActive={currentPath === item.route || (item.route === AppRoute.BIBLIOTECA && [AppRoute.BIBLE, AppRoute.CATECHISM, AppRoute.MAGISTERIUM, AppRoute.SAINTS].includes(currentPath as AppRoute))}
            onClick={() => navigate(item.route)}
          />
        ))}
      </div>
    </div>
  );
};

export default BottomNav;