import { Button   } from '@/components/cathedra/Button';
import React, { useCallback, useRef, useContext } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { AppRoute } from '../../types';
import { Icons } from '@/constants';
import { prefetchRoute } from '@/lib/prefetch';
import { LangContext } from '@/contexts/LangContext';
import { CathedraIcon, IconSizePreset } from './CathedraIcon';

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
    onClick={(e) => { onRipple(e); onClick(); }}
    onKeyDown={(e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        onClick();
      }
    }}
    onTouchStart={(e) => { onRipple(e); prefetchRoute(route); }}
    onMouseEnter={() => prefetchRoute(route)}
    aria-label={label}
    aria-current={isActive ? 'page' : undefined}
    className={`flex flex-col items-center justify-center gap-1 flex-1 py-1 relative overflow-hidden tap-highlight-transparent touch-manipulation focus-visible:bg-primary/10 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-0 outline-none transition-colors ${
      isActive ? 'text-primary' : 'text-muted-foreground active:text-foreground'
    }`}
  >

    <div className={`transition-transform duration-150 ${isActive ? 'scale-110 -translate-y-0.5' : 'active:scale-90'}`}>
      <CathedraIcon 
        icon={(icon as React.ReactElement).type as any} 
        size={IconSizePreset.NAV} 
        variant={isActive ? 'primary' : 'muted'} 
        containerClassName="bg-transparent border-none p-0 w-auto h-auto"
      />
    </div>
    <span className={`text-premium-tiny sm:text-premium-tiny font-bold uppercase tracking-tight sm:tracking-widest leading-none ${
      isActive ? 'opacity-100' : 'opacity-60'
    }`}>
      {label}
    </span>
    {isActive && (
      <div className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-primary rounded-premium-sm" />
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
    { label: 'Home', icon: <Icons.Home />, route: AppRoute.SANCTUARIUM },
    { label: 'Jornadas', icon: <Icons.Journeys />, route: AppRoute.JOURNEYS },
    { label: t('explore'), icon: <Icons.Compass />, route: AppRoute.BIBLIOTECA },
    { label: t('profile'), icon: <Icons.User />, route: AppRoute.PROFILE },
    { label: t('menu') || 'Menu', icon: <Icons.Menu />, onClick: onOpenSidebar },
  ];

  return (
    <nav className="bottom-nav fixed bottom-0 left-0 right-0 z-[160] lg:hidden bg-background/80 backdrop-blur-xl border-t border-primary/5 safe-area-bottom" aria-label="Navegação móvel inferior">
      <div className="flex items-stretch h-14 px-1">
        {items.map((item: any) => (
          <BottomNavItem 
            key={item.label}
            label={item.label}
            icon={item.icon}
            route={item.route || ''}
            isActive={item.route ? (currentPath === item.route || (item.route === AppRoute.BIBLIOTECA && [AppRoute.SCRIPTUARIUM, AppRoute.CODEX_FIDEI, AppRoute.MAGISTERIUM, AppRoute.SAINTS, AppRoute.LITURGIA, AppRoute.AQUINAS_OPERA, AppRoute.GLOSSARY, AppRoute.ROSARY, AppRoute.ORACAO, AppRoute.VIA_CRUCIS, AppRoute.AZ_FAITH, AppRoute.ENCYCLOPEDIA, AppRoute.POPES, AppRoute.APARICOES, AppRoute.DOGMAS, AppRoute.MODULES_GUIDE].includes(currentPath as AppRoute))) : false}
            onClick={() => {
              if (item.onClick) item.onClick();
              else if (item.route) navigate(item.route);
            }}
            onRipple={triggerRipple}
          />
        ))}
      </div>
    </nav>
  );
};

export default BottomNav;
