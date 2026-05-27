import { Button } from '@/components/ui/button';
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
  <Button 
    variant="ghost"
    onClick={(e) => { onRipple(e); onClick(); }}
    onTouchStart={(e) => { onRipple(e); prefetchRoute(route); }}
    onMouseEnter={() => prefetchRoute(route)}
    aria-label={label}
    aria-current={isActive ? 'page' : undefined}
    className={`flex flex-col items-center justify-center gap-1.5 flex-1 py-1 relative overflow-hidden tap-highlight-transparent touch-manipulation transition-all duration-500 shadow-none border-none hover:bg-transparent ${
      isActive ? 'text-primary' : 'text-muted-foreground/30 hover:text-primary/40'
    }`}
  >
    <div className={`transition-all duration-700 ${isActive ? 'scale-110 -translate-y-1' : 'active:scale-95'}`}>
      {React.cloneElement(icon as React.ReactElement, { 
        className: `w-5 h-5`,
        strokeWidth: 1.2,
      })}
    </div>
    <span className={`text-[8px] font-black uppercase tracking-[0.2em] leading-none transition-all duration-700 ${
      isActive ? 'opacity-100 tracking-[0.3em]' : 'opacity-0 translate-y-2'
    }`}>
      {label}
    </span>
    {isActive && (
      <div className="absolute top-1 right-1/2 translate-x-4 w-1 h-1 bg-secondary rounded-full animate-pulse shadow-[0_0_8px_hsla(var(--secondary)/0.5)]" />
    )}
  </Button>
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
    { label: t('bible'), icon: <Icons.Bible />, route: AppRoute.BIBLE },
    { label: t('catechism'), icon: <Icons.Catechism />, route: AppRoute.CATECHISM },
    { label: 'Magistério', icon: <Icons.ScrollText />, route: AppRoute.MAGISTERIUM },
    { label: 'Logos', icon: <Icons.Sparkles />, route: '/logos' },
    { label: t('menu') || 'Menu', icon: <Icons.Menu />, onClick: onOpenSidebar },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-[160] lg:hidden bg-background/60 backdrop-blur-3xl border-t border-primary/5 safe-area-bottom bottom-nav" aria-label={t('mobile_navigation') || 'Navegação móvel'}>
      <div className="flex items-stretch h-20 px-4">
        {items.map((item: any, i: number) => (
          <BottomNavItem 
            key={item.label + i}
            label={item.label}
            icon={item.icon}
            route={item.route || ''}
            isActive={item.route ? currentPath === item.route || (item.route !== '/' && currentPath.startsWith(item.route)) : false}
            onClick={() => {
              if (item.onClick) item.onClick();
              else if (item.route) navigate(item.route);
            }}
            onRipple={triggerRipple}
          />
        ))}
      </div>
    </div>
  );
};

export default BottomNav;
