import { Button } from '@/components/ui/button';
import React, { useCallback, useRef, useContext } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
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
  icon: React.ElementType;
  route: string;
  isActive: boolean;
  onClick: () => void;
  onRipple: (e: React.MouseEvent | React.TouchEvent) => void;
}

const BottomNavItem: React.FC<BottomNavItemProps> = ({ label, icon: Icon, route, isActive, onClick, onRipple }) => (
  <Button 
    variant="ghost"
    onClick={(e) => { onRipple(e); onClick(); }}
    onTouchStart={(e) => { prefetchRoute(route); }}
    onMouseEnter={() => prefetchRoute(route)}
    aria-label={label}
    aria-current={isActive ? 'page' : undefined}
    className={cn(
      "flex flex-col items-center justify-center gap-1.5 flex-1 h-full relative overflow-hidden tap-highlight-transparent touch-manipulation transition-all duration-500 shadow-none border-none hover:bg-transparent px-0 rounded-none",
      isActive ? 'text-primary' : 'text-muted-foreground/60 hover:text-primary'
    )}
  >
    <motion.div 
      initial={false}
      animate={{ 
        scale: isActive ? 1.15 : 1,
        y: isActive ? -2 : 0 
      }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
      className="relative z-10"
    >
      <Icon 
        className={cn(
          "transition-colors duration-500",
          isActive ? "text-primary opacity-100" : "text-muted-foreground/50"
        )}
        size={24}
        strokeWidth={isActive ? 2 : 1.5}
      />
    </motion.div>
    
    <motion.span 
      initial={false}
      animate={{ 
        opacity: isActive ? 1 : 0.6,
        y: isActive ? 0 : 2,
        scale: isActive ? 1 : 0.9
      }}
      className={cn(
        "text-[9px] font-bold uppercase tracking-[0.2em] leading-none transition-all duration-500",
        isActive ? 'text-primary' : 'text-muted-foreground/50'
      )}
    >
      {label}
    </motion.span>
    
    {isActive && (
      <motion.div 
        layoutId="bottom-nav-indicator"
        className="absolute bottom-2 w-1 h-1 bg-primary rounded-full" 
        transition={{ type: "spring", stiffness: 300, damping: 25 }}
      />
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
    { label: t('bible') || 'Bíblia', icon: Icons.Bible, route: AppRoute.BIBLE },
    { label: t('catechism') || 'Catecismo', icon: Icons.Catechism, route: AppRoute.CATECHISM },
    { label: 'Magistério', icon: Icons.ScrollText, route: AppRoute.MAGISTERIUM },
    { label: 'Logos', icon: Icons.Sparkles, route: '/logos' },
    { label: t('menu') || 'Menu', icon: Icons.Menu, onClick: onOpenSidebar },
  ];

  return (
    <nav 
      className="fixed bottom-6 left-6 right-6 z-[160] lg:hidden h-20 bg-background/80 backdrop-blur-3xl border border-primary/5 rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.1)] bottom-nav bottom-nav-reading-auto-hide ring-1 ring-primary/5 px-2" 
      aria-label={t('mobile_navigation') || 'Navegação móvel'}
    >
      <div className="flex items-center justify-between h-full w-full">
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
    </nav>
  );
};

export default BottomNav;
