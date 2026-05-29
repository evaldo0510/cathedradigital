import { Button } from '@/components/ui/button';
import React, { useCallback, useRef, useContext } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
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
  shouldReduceMotion?: boolean;
}

const BottomNavItem: React.FC<BottomNavItemProps> = ({ 
  label, 
  icon: Icon, 
  route, 
  isActive, 
  onClick, 
  onRipple,
  shouldReduceMotion = false
}) => (
  <Button 
    variant="ghost"
    onClick={(e) => { onRipple(e); onClick(); }}
    onTouchStart={(e) => { prefetchRoute(route); }}
    onMouseEnter={() => prefetchRoute(route)}
    aria-label={label}
    aria-current={isActive ? 'page' : undefined}
    className={cn(
      "flex flex-col items-center justify-center gap-1.5 flex-1 h-full relative overflow-hidden tap-highlight-transparent touch-manipulation transition-all duration-700 shadow-none border-none hover:bg-transparent px-0 rounded-none tap-premium group focus-visible:bg-primary/[0.05] outline-none",
      isActive ? 'text-primary' : 'text-muted-foreground/30 hover:text-primary'
    )}
  >
    {isActive && (
      <motion.div
        layoutId="bottom-nav-active-bg"
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
          shouldReduceMotion ? "duration-0" : "duration-700",
          isActive ? "text-primary opacity-100" : "text-muted-foreground/30 group-hover:text-primary/60"
        )}
        size={20}
        strokeWidth={isActive ? 2 : 1.2}
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
        "text-[7.5px] md:text-[9.5px] font-bold uppercase tracking-[0.25em] leading-none transition-all truncate w-full px-1 text-center relative z-10",
        shouldReduceMotion ? "duration-0" : "duration-700",
        isActive ? 'text-primary' : 'text-muted-foreground/50'
      )}
    >
      {label}
    </motion.span>
    
    {isActive && (
      <motion.div 
        layoutId="bottom-nav-dot"
        className="absolute bottom-2.5 w-0.5 h-0.5 bg-primary rounded-full z-10" 
        transition={shouldReduceMotion ? { duration: 0 } : { type: "spring", stiffness: 500, damping: 35 }}
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
  const { t, lang } = useContext(LangContext);
  const shouldReduceMotion = useReducedMotion();

  const isHojeActive = useCallback((path: string) => {
    return path === '/' || path === '/hoje' || path.startsWith('/hoje/');
  }, []);

  const items = [
    { label: lang === 'pt' ? 'Hoje' : 'Today', icon: Icons.Sun, route: AppRoute.HOJE },
    { label: lang === 'pt' ? 'Bíblia' : 'Bible', icon: Icons.Bible, route: AppRoute.BIBLE },
    { label: lang === 'pt' ? 'Catecismo' : 'Catechism', icon: Icons.Catechism, route: AppRoute.CATECHISM },
    { label: 'Logos', icon: Icons.Sparkles, route: '/logos' },
    { label: t('menu') || 'Menu', icon: Icons.Menu, onClick: onOpenSidebar },
  ];

  return (
    <nav 
      className="fixed bottom-8 left-8 right-8 z-[160] lg:hidden h-14 bg-background/20 backdrop-blur-3xl border border-primary/5 rounded-full shadow-[0_40px_80px_-20px_rgba(0,0,0,0.2)] bottom-nav bottom-nav-reading-auto-hide ring-1 ring-primary/5 px-2 overflow-hidden transition-all duration-1000" 
      aria-label={t('mobile_navigation') || 'Navegação móvel'}
    >
      <div className="flex items-center justify-between h-full w-full max-w-md mx-auto relative">
        {items.map((item: any, i: number) => {
          const isActive = item.route 
            ? (item.route === AppRoute.HOJE 
                ? isHojeActive(currentPath) 
                : (currentPath === item.route || (item.route !== '/' && currentPath.startsWith(item.route))))
            : false;

          return (
            <BottomNavItem 
              key={item.label + i}
              label={item.label}
              icon={item.icon}
              route={item.route || ''}
              isActive={isActive}
              shouldReduceMotion={shouldReduceMotion ?? false}
              onClick={() => {
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
