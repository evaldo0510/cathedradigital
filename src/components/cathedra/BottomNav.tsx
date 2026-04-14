import React, { useCallback, useRef, useContext } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { AppRoute } from '../../types';
import { Icons } from '@/constants';
import { prefetchRoute } from '@/lib/prefetch';
import { LangContext } from '@/contexts/LangContext';

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
        className: `w-5 h-5 sm:w-5 sm:h-5 ${isActive ? 'drop-shadow-[0_0_8px_hsl(var(--primary)/0.4)]' : ''}`,
        size: undefined,
        strokeWidth: 2,
        fill: isActive ? 'currentColor' : 'none'
      })}
    </div>
    <span className={`text-[8px] sm:text-[10px] font-bold uppercase tracking-tight sm:tracking-widest leading-none ${
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
  const { t } = useContext(LangContext);

  const items = [
    { label: t('home'), icon: <Icons.Home />, route: AppRoute.HOJE },
    { label: t('journeys'), icon: <Icons.Journeys />, route: AppRoute.JORNADAS },
    { label: t('themes'), icon: <Icons.Themes />, route: AppRoute.TEMAS },
    { label: t('explore'), icon: <Icons.Search />, route: AppRoute.BIBLIOTECA },
    { label: t('profile'), icon: <Icons.User />, route: AppRoute.PROFILE },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[160] lg:hidden bg-background/80 backdrop-blur-xl border-t border-foreground/5 safe-area-bottom">
      <div className="flex items-stretch h-16 px-1">
        {items.map((item) => (
          <BottomNavItem 
            key={item.label}
            label={item.label}
            icon={item.icon}
            route={item.route}
            isActive={currentPath === item.route || (item.route === AppRoute.BIBLIOTECA && [AppRoute.BIBLE, AppRoute.CATECHISM, AppRoute.MAGISTERIUM, AppRoute.SAINTS, AppRoute.LITURGIA, AppRoute.AQUINAS_OPERA, AppRoute.GLOSSARY, AppRoute.ROSARY, AppRoute.ORACAO, AppRoute.VIA_CRUCIS].includes(currentPath as AppRoute))}
            onClick={() => {
              navigate(item.route);
            }}
            onRipple={triggerRipple}
          />
        ))}
      </div>
    </div>
  );
};

export default BottomNav;
