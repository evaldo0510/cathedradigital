import { Button } from '@/components/ui/button';
import React, { useCallback, useRef, useContext, useMemo, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { isRouteActive, isLegitimateClick } from '@/lib/navigation-utils';

import { Icons } from '@/constants';
import { prefetchRoute } from '@/lib/prefetch';
import { LangContext } from '@/contexts/LangContext';
import { APP_ROUTES } from '@/config/routes';
import { SmartActionSheet } from './SmartActionButton';

/**
 * Ícone dedicado do item "Atalhos": Sparkles renderizado mais fino que os
 * demais para pesar menos visualmente, mesmo herdando `size` do BottomNavItem.
 * Ignora `strokeWidth` passado pelo pai — traço travado em 1.3.
 */
const AtalhosIcon: React.FC<{ size?: number; className?: string }> = ({ size = 18, className }) => (
  <Icons.Sparkles size={size} strokeWidth={1.3} className={className} aria-hidden="true" />
);

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
      background:rgba(201,168,76,0.18);
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
      "flex flex-col items-center justify-center gap-spacing-3xs flex-1 h-full relative overflow-hidden tap-highlight-transparent touch-manipulation transition-all duration-300 shadow-premium-none border-none hover:bg-transparent px-1 rounded-premium-none tap-premium group focus-visible:bg-[#c9a84c]/[0.08] focus-visible:ring-1 focus-visible:ring-[#c9a84c]/30 outline-none",
      "min-w-[44px] min-h-[44px]", 

      isActive 
        ? 'text-[color:var(--gold-text)]' 
        : 'text-foreground/80 hover:text-[color:var(--gold-text)]'
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
          isActive ? "text-[color:var(--gold-text)] opacity-100 scale-110" : "text-foreground/80 group-hover:text-[color:var(--gold-text)] group-active:scale-95"
        )}
        size={18}
        strokeWidth={isActive ? 1.5 : 1.6}
        aria-hidden="true"
      />
    </motion.div>
    
    <motion.span 
      initial={false}
      animate={{ 
        opacity: 1,
        scale: isActive ? 1.05 : 0.95,
        y: isActive ? 0 : (shouldReduceMotion ? 0 : 1)
      }}
      transition={shouldReduceMotion ? { duration: 0 } : undefined}
      className={cn(
        "text-[7px] md:text-[8.5px] font-medium uppercase tracking-[0.15em] leading-none transition-all truncate w-full px-spacing-3xs text-center relative z-10",
        shouldReduceMotion ? "duration-0" : "duration-300",
        isActive ? 'text-[color:var(--gold-text)] font-semibold' : 'text-foreground/80'
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
  const [atalhosOpen, setAtalhosOpen] = useState(false);

  const items = useMemo(() => {
    // Arquitetura Hub Cathedra: 5 itens essenciais
    const hubItems = [
      { path: '/bible', label: 'Ler', icon: Icons.BookOpen },
      { path: '/rezar', label: 'Orar', icon: Icons.Hand },
      { path: '/igreja', label: 'Igreja', icon: Icons.Church },
      { path: '/acervo', label: 'Biblioteca', icon: Icons.Library },
      { path: '/profile', label: 'Perfil', icon: Icons.User },
    ];

    return hubItems.map(item => ({
      label: item.label,
      route: item.path,
      icon: item.icon,
      isMenu: false,
      isAtalhos: false,
    }));
  }, []);

  return (
    <nav 
      className={cn(
        "fixed bottom-0 left-0 right-0 z-[160] lg:hidden h-auto bg-background/85 backdrop-blur-xl border-t border-[#c9a84c]/25 bottom-nav bottom-nav-reading-auto-hide px-spacing-xs pt-spacing-xs pb-[env(safe-area-inset-bottom,12px)] transition-all will-change-transform flex items-center shadow-[0_-4px_20px_-10px_rgba(0,0,0,0.05)]",
        "min-h-[64px]", 
        shouldReduceMotion ? "duration-0" : "duration-500"
      )} 
      aria-label={t('mobile_navigation') || 'Navegação móvel'}
    >
      <div className="flex items-center justify-around h-full w-full relative gap-1 overflow-x-auto no-scrollbar">
        {items.map((item, i) => {
          const isActive = item.isMenu || item.isAtalhos
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
              data-testid={
                item.isMenu
                  ? 'menu-trigger'
                  : item.isAtalhos
                  ? 'smart-action-button'
                  : `nav-${item.label.toLowerCase()}`
              }
              onClick={(e) => {
                if (e.defaultPrevented || !isLegitimateClick(e)) return;

                if (item.isMenu) {
                  onOpenSidebar();
                } else if (item.isAtalhos) {
                  setAtalhosOpen(true);
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
      <SmartActionSheet open={atalhosOpen} onOpenChange={setAtalhosOpen} />
    </nav>
  );
};

export default BottomNav;
