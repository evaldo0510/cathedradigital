import React, { useCallback, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { AppRoute } from '../../types';
import { Icons } from '@/constants';
import { prefetchRoute } from '@/lib/prefetch';

/* ── Ripple helper ── */
function useRipple() {
  const rippleRef = useRef<HTMLSpanElement | null>(null);

  const trigger = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    const btn = (e.currentTarget as HTMLElement);
    const rect = btn.getBoundingClientRect();
    let x: number, y: number;
    if ('touches' in e) {
      x = e.touches[0].clientX - rect.left;
      y = e.touches[0].clientY - rect.top;
    } else {
      x = e.clientX - rect.left;
      y = e.clientY - rect.top;
    }
    const size = Math.max(rect.width, rect.height) * 2;
    const ripple = document.createElement('span');
    ripple.style.cssText = `
      position:absolute;left:${x - size / 2}px;top:${y - size / 2}px;
      width:${size}px;height:${size}px;border-radius:50%;
      background:hsl(var(--primary)/.15);
      transform:scale(0);animation:ripple-expand .45s ease-out forwards;
      pointer-events:none;
    `;
    btn.appendChild(ripple);
    ripple.addEventListener('animationend', () => ripple.remove());
  }, []);

  return trigger;
}

interface BottomNavItemProps {
  label: string;
  icon: React.ReactNode;
  route: string;
  isActive: boolean;
  onClick: () => void;
  onRipple: (e: React.MouseEvent | React.TouchEvent) => void;
}

const BottomNavItem: React.FC<BottomNavItemProps> = ({ label, icon, route, isActive, onClick, onRipple }) => (
  <button 
    onClick={(e) => { onRipple(e); onClick(); }}
    onTouchStart={(e) => { onRipple(e); prefetchRoute(route); }}
    onMouseEnter={() => prefetchRoute(route)}
    className={`flex flex-col items-center justify-center gap-1 flex-1 py-1 relative overflow-hidden tap-highlight-transparent touch-manipulation ${
      isActive ? 'text-primary' : 'text-muted-foreground active:text-foreground'
    }`}
  >
    <div className={`transition-transform duration-150 ${isActive ? 'scale-110 -translate-y-0.5' : 'active:scale-90'}`}>
      {React.cloneElement(icon as React.ReactElement, { 
        className: `w-5 h-5 sm:w-6 sm:h-6 ${isActive ? 'stroke-[2.2px] drop-shadow-[0_0_8px_hsl(var(--primary)/0.4)]' : 'stroke-[1.8px]'}`,
        size: undefined, // Let Tailwind classes handle size if needed, but our standard is size=20
        strokeWidth: undefined // Let dynamic class handle it
      })}
    </div>
    <span className={`text-[9px] sm:text-[10px] font-bold uppercase tracking-widest leading-none ${
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

const BottomNav: React.FC<BottomNavProps> = ({ user, onOpenSidebar }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const currentPath = location.pathname;
  const triggerRipple = useRipple();

  const items = [
    { label: 'Hoje', icon: <Icons.Liturgy />, route: AppRoute.HOJE },
    { label: 'Jornadas', icon: <Icons.Journeys />, route: AppRoute.JORNADAS },
    { label: 'Biblioteca', icon: <Icons.Bible />, route: AppRoute.BIBLIOTECA },
    { label: 'Tudo', icon: <Icons.Menu />, route: '__sidebar__' },
    { label: 'Perfil', icon: <Icons.Users />, route: AppRoute.PROFILE },
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
            isActive={item.route !== '__sidebar__' && (currentPath === item.route || (item.route === AppRoute.BIBLIOTECA && [AppRoute.BIBLE, AppRoute.CATECHISM, AppRoute.MAGISTERIUM, AppRoute.SAINTS].includes(currentPath as AppRoute)))}
            onClick={() => {
              if (item.route === '__sidebar__') {
                onOpenSidebar();
              } else {
                navigate(item.route);
              }
            }}
            onRipple={triggerRipple}
          />
        ))}
      </div>
    </div>
  );
};

export default BottomNav;
