import { Button } from '@/components/ui/button';
import React, { useCallback, useRef, useContext } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { AppRoute } from '../../types';
import { isRouteActive } from '@/lib/navigation-utils';

import { Icons } from '@/constants';
import { prefetchRoute } from '@/lib/prefetch';
import { LangContext } from '@/contexts/LangContext';

/* ── Ripple helper ── */
function useRipple() {
  const rippleRef = useRef<HTMLSpanElement | null>(null);
  const hapticRef = useRef<boolean>(false);

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
    
    // Haptic feedback for mobile
    if ('vibrate' in navigator && !hapticRef.current) {
      navigator.vibrate(10);
      hapticRef.current = true;
      setTimeout(() => { hapticRef.current = false; }, 200);
    }

    ripple.addEventListener('animationend', () => ripple.remove());
  }, []);

  return trigger;
}

interface BottomNavItemProps {
  label: string;
  icon: React.ElementType;
  route: string;
  isActive: boolean;
  onClick: (e: React.MouseEvent | React.TouchEvent) => void;
  onRipple: (e: React.MouseEvent | React.TouchEvent) => void;
  shouldReduceMotion?: boolean;
}

const BottomNavItem: React.FC<BottomNavItemProps> = React.memo(({ 
  label, 
  icon: Icon, 
  route, 
  isActive, 
  onClick, 
  onRipple,
  shouldReduceMotion = false
}) => {
  const navigate = useNavigate();
  return (
  <Button 
    variant="ghost"
    onClick={(e) => { 
      onRipple(e); 
      onClick(e); 
    }}
    onTouchStart={() => route && prefetchRoute(route)}
    onMouseEnter={() => route && prefetchRoute(route)}
    aria-label={label}
    aria-current={isActive ? 'page' : undefined}
    className={cn(
      "flex flex-col items-center justify-center gap-1.5 flex-1 h-full relative overflow-hidden tap-highlight-transparent touch-manipulation transition-all duration-300 shadow-none border-none hover:bg-transparent px-0 rounded-none tap-premium group focus-visible:bg-primary/[0.05] outline-none",
      isActive ? 'text-primary' : 'text-muted-foreground/60 hover:text-primary'
    )}
  >
    {isActive && (
      <motion.div
        layoutId="bottom-nav-active-bg"
        data-testid="bottom-nav-active-bg"
        className="absolute inset-x-1.5 inset-y-1.5 bg-primary/[0.03] rounded-full z-0"
        transition={shouldReduceMotion ? { duration: 0 } : { type: "spring", stiffness: 380, damping: 30 }}
      />
    )}

    <motion.div 
      initial={false}
      animate={{ 
        scale: isActive ? (shouldReduceMotion ? 1 : 1.12) : 1,
        y: isActive ? (shouldReduceMotion ? 0 : -1) : 0 
      }}
      transition={shouldReduceMotion ? { duration: 0 } : { type: "spring", stiffness: 400, damping: 28 }}
      className="relative z-10"
    >
      <Icon 
        className={cn(
          "transition-all",
          shouldReduceMotion ? "duration-0" : "duration-300",
          isActive ? "text-primary opacity-90" : "text-muted-foreground/50 group-hover:text-primary/70"
        )}
        size={20}
        strokeWidth={isActive ? 1.5 : 1}
      />
    </motion.div>
    
    <motion.span 
      initial={false}
      animate={{ 
        opacity: isActive ? 1 : 0.4,
        scale: isActive ? 1 : 0.92,
        y: isActive ? 0 : (shouldReduceMotion ? 0 : 1)
      }}
      transition={shouldReduceMotion ? { duration: 0 } : undefined}
      className={cn(
        "text-[8px] md:text-[9.5px] font-bold uppercase tracking-[0.2em] leading-none transition-all truncate w-full px-1 text-center relative z-10",
        shouldReduceMotion ? "duration-0" : "duration-300",
        isActive ? 'text-primary' : 'text-muted-foreground/60'
      )}
    >
      {label}
    </motion.span>
    
    {isActive && (
      <motion.div 
        layoutId="bottom-nav-dot"
        data-testid="bottom-nav-dot"
        className="absolute bottom-1.5 w-0.5 h-0.5 bg-primary rounded-full z-10" 
        transition={shouldReduceMotion ? { duration: 0 } : { type: "spring", stiffness: 500, damping: 35 }}
      />
    )}
  </Button>
  );
});

interface BottomNavProps {
  onOpenSidebar: () => void;
  user?: { role?: string } | null;
}

const BottomNav: React.FC<BottomNavProps> = ({ user, onOpenSidebar }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const currentPath = location.pathname;
  const triggerRipple = useRipple();
  const { t, lang } = useContext(LangContext);
  const shouldReduceMotion = useReducedMotion();


  const items = [
    { label: lang === 'pt' ? 'Início' : 'Home', icon: Icons.Home, route: '/' },
    { label: lang === 'pt' ? 'Bíblia' : 'Bible', icon: Icons.Bible, route: AppRoute.BIBLE },
    { label: lang === 'pt' ? 'Catecismo' : 'Catechism', icon: Icons.Catechism, route: AppRoute.CATECHISM },
    { label: 'Logos', icon: Icons.Sparkles, route: '/logos' },
    { label: t('menu') || 'Menu', icon: Icons.Menu, onClick: onOpenSidebar, isMenu: true },
  ];

  return (
    <nav 
      className={cn(
        "fixed bottom-3 left-3 right-3 z-[160] lg:hidden h-10 bg-background/5 rounded-full shadow-none border border-primary/[0.01] dark:border-white/[0.01] bottom-nav bottom-nav-reading-auto-hide px-2 overflow-hidden transition-all backdrop-blur-sm will-change-transform",
        shouldReduceMotion ? "duration-0" : "duration-500"
      )} 
      aria-label={t('mobile_navigation') || 'Navegação móvel'}
    >
      <div className="flex items-center justify-between h-full w-full max-w-md mx-auto relative">
        {items.map((item: any, i: number) => {
          const isActive = item.isMenu 
            ? false 
            : (item.route ? isRouteActive(item.route, currentPath) : false);


          return (
            <BottomNavItem 
              key={item.label + i}
              label={item.label}
              icon={item.icon}
              route={item.route || ''}
              isActive={isActive}
              shouldReduceMotion={shouldReduceMotion ?? false}
              onClick={(e) => {
              if (item.onClick) item.onClick();
              else if (item.route) navigate(item.route);
            }}
            onRipple={triggerRipple}
          />
        );
      })}
      </div>
    </nav>
  );
};

export default BottomNav;
