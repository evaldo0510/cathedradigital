import { Button } from '@/components/ui/button';
import React, { useCallback, useRef, useContext, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { isRouteActive, isLegitimateClick } from '@/lib/navigation-utils';

import { Icons } from '@/constants';
import { prefetchRoute } from '@/lib/prefetch';
import { LangContext } from '@/contexts/LangContext';
import { APP_ROUTES } from '@/config/routes';
import { SmartActionButton } from './SmartActionButton';

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
  icon: any;
  route?: string;
  isActive: boolean;
  onClick: (e: React.MouseEvent | React.TouchEvent) => void;
  onRipple: (e: React.MouseEvent | React.TouchEvent) => void;
  shouldReduceMotion?: boolean;
  "data-testid"?: string;
  isMenu?: boolean;
}

const BottomNavItem: React.FC<BottomNavItemProps> = React.memo(({ 
  label, 
  icon: Icon, 
  route, 
  isActive, 
  onClick, 
  onRipple,
  shouldReduceMotion = false,
  "data-testid": dataTestId,
}) => {
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
    data-testid={dataTestId}
    className={cn(
      "flex flex-col items-center justify-center gap-spacing-3xs flex-1 h-full relative overflow-hidden tap-highlight-transparent touch-manipulation transition-all duration-300 shadow-premium-none border-none hover:bg-transparent px-spacing-0 rounded-premium-none tap-premium group focus-visible:bg-[#c9a84c]/[0.08] focus-visible:ring-1 focus-visible:ring-[#c9a84c]/30 outline-none",
      "min-w-[48px] min-h-[48px]", 
      isActive 
        ? 'text-[#c9a84c]' 
        : 'text-muted-foreground/40 hover:text-[#c9a84c]/70'
    )}
  >
    {isActive && (
      <motion.div
        layoutId="bottom-nav-active-bg"
        data-testid="bottom-nav-active-bg"
        className="absolute inset-x-1.5 inset-y-1.5 bg-[#c9a84c]/[0.06] rounded-none border border-[#c9a84c]/25 z-0"
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
          isActive ? "text-[#c9a84c] opacity-100 scale-110" : "text-muted-foreground/30 group-hover:text-[#c9a84c]/60 group-active:scale-95"
        )}
        size={18}
        strokeWidth={isActive ? 1.5 : 1.2}
        aria-hidden="true"
      />
    </motion.div>
    
    <motion.span 
      initial={false}
      animate={{ 
        opacity: isActive ? 1 : 0.3,
        scale: isActive ? 1.05 : 0.9,
        y: isActive ? 0 : (shouldReduceMotion ? 0 : 1)
      }}
      transition={shouldReduceMotion ? { duration: 0 } : undefined}
      className={cn(
        "text-[8px] md:text-[9.5px] font-medium uppercase tracking-[0.28em] leading-none transition-all truncate w-full px-spacing-2xs text-center relative z-10",
        shouldReduceMotion ? "duration-0" : "duration-300",
        isActive ? 'text-[#c9a84c] font-semibold' : 'text-muted-foreground/40'
      )}
    >
      {label}
    </motion.span>
    
    {isActive && (
      <motion.div 
        layoutId="bottom-nav-dot"
        data-testid="bottom-nav-dot"
        className="absolute bottom-spacing-2xs w-spacing-3xs h-spacing-3xs bg-[#c9a84c] rounded-premium-full z-10" 
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
  const { t } = useContext(LangContext);
  const shouldReduceMotion = useReducedMotion();

  const items = useMemo(() => {
    const mainItems = APP_ROUTES
      .filter(r => r.showInMenu && ['core', 'spiritual'].includes(r.category || ''))
      .slice(0, 4)
      .map(r => ({
        label: r.label,
        route: r.path,
        icon: r.icon,
        isMenu: false
      }));

    // Add Menu/More item
    mainItems.push({
      label: 'Mais',
      route: '',
      icon: Icons.Menu,
      isMenu: true
    });

    return mainItems;
  }, []);

  return (
    <nav 
      className={cn(
        "fixed bottom-0 left-0 right-0 z-[160] lg:hidden h-[calc(var(--bottom-nav-height)+env(safe-area-inset-bottom,20px))] bg-background/80 backdrop-blur-xl border-t border-primary/[0.05] dark:border-white/[0.05] bottom-nav bottom-nav-reading-auto-hide px-spacing-md pt-spacing-xs pb-[env(safe-area-inset-bottom,20px)] transition-all will-change-transform flex items-center shadow-[0_-4px_20px_-10px_rgba(0,0,0,0.05)]",
        "min-h-[64px]", 
        shouldReduceMotion ? "duration-0" : "duration-500"
      )} 
      aria-label={t('mobile_navigation') || 'Navegação móvel'}
    >
      <div className="flex items-center justify-between h-full w-full relative">
        <SmartActionButton />
        {items.map((item, i) => {
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
              data-testid={item.isMenu ? "menu-trigger" : `nav-${item.label.toLowerCase()}`}
              onClick={(e) => {
                if (e.defaultPrevented || !isLegitimateClick(e)) return;
                
                if (item.isMenu) {
                  onOpenSidebar();
                } else if (item.route) {
                  if (location.pathname === item.route) return;
                  navigate(item.route);
                  window.scrollTo({ top: 0, behavior: 'instant' });
                }
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
