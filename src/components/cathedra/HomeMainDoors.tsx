import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, useLocation } from 'react-router-dom';
import { Icons } from '@/constants';
import { AppRoute } from '@/types';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface HomeMainDoorsProps {
  t: (key: string) => string;
  className?: string;
}

const HomeMainDoors: React.FC<HomeMainDoorsProps> = ({ t, className }) => {
  const navigate = useNavigate();
  const location = useLocation();
  
  const doors = [
    {
      label: t('bible'),
      description: 'A Palavra de Deus.',
      icon: Icons.Bible,
      route: AppRoute.BIBLE,
      shortcut: 'B',
      tooltip: 'Explore as Sagradas Escrituras em profundidade.'
    },
    {
      label: t('catechism'),
      description: 'A base da doutrina.',
      icon: Icons.Catechism,
      route: AppRoute.CATECHISM,
      shortcut: 'C',
      tooltip: 'Aprofunde seu conhecimento na doutrina da Igreja.'
    },
    {
      label: 'Magistério',
      description: 'A voz da Igreja.',
      icon: Icons.Magisterium,
      route: AppRoute.MAGISTERIUM,
      shortcut: 'M',
      tooltip: 'Documentos, encíclicas e a Tradição Viva.'
    },
    {
      label: 'Logos IA',
      description: 'O auxílio inteligente.',
      icon: Icons.Brain,
      route: AppRoute.BUSCAR,
      shortcut: 'L',
      tooltip: 'Diálogo espiritual e esclarecimento com IA.'
    },
  ];

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.altKey) {
        const key = e.key.toLowerCase();
        const door = doors.find(d => d.shortcut.toLowerCase() === key);
        if (door) {
          e.preventDefault();
          handleNavigate(door.route);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [navigate]);

  const handleNavigate = (route: string) => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    navigate(route);
  };

  return (
    <div className={cn("grid grid-cols-2 md:grid-cols-4 gap-8 lg:gap-12", className)}>
        {doors.map((door, idx) => {
          const isActive = location.pathname.startsWith(door.route);
          
          return (
            <Tooltip key={idx}>
              <TooltipTrigger asChild>
                <motion.div
                  whileHover={{ y: -8 }}
                  whileTap={{ scale: 0.995 }}
                  onClick={() => handleNavigate(door.route)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      handleNavigate(door.route);
                    }
                  }}
                  tabIndex={0}
                  role="button"
                  aria-label={`${door.label}: ${door.description}`}
                  className={cn(
                    "relative p-10 md:p-14 rounded-premium border border-border/40 bg-card flex flex-col items-center text-center gap-10 cursor-pointer group transition-all focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:outline-none shadow-premium hover:shadow-premium-hover hover:border-primary/20 hover:bg-primary/[0.01] hover:-translate-y-1.5 active:scale-[0.985]",
                    isActive && "border-primary/30 bg-primary/[0.02] shadow-premium-hover ring-1 ring-primary/10"
                  )}
                >
                  <div className={cn(
                    "w-16 h-16 rounded-2xl bg-primary/[0.02] flex items-center justify-center text-primary group-hover:bg-primary/5 group-hover:scale-105 transition-all duration-700 border border-border/20",
                    isActive && "bg-primary/5 scale-105 border-primary/20 text-secondary"
                  )}>
                    <door.icon className="w-7 h-7" strokeWidth={1} />
                  </div>
                  <div className="space-y-3">
                    <h3 className={cn(
                      "text-[10px] font-bold uppercase tracking-[0.4em] text-foreground/80 group-hover:text-primary transition-colors",
                      isActive && "text-primary"
                    )}>
                      {door.label}
                    </h3>
                    <p className="text-[9px] text-muted-foreground font-medium line-clamp-1 leading-relaxed opacity-30 group-hover:opacity-60 transition-opacity px-2 uppercase tracking-widest">
                      {door.description}
                    </p>
                  </div>
                  
                  {isActive && (
                    <motion.div 
                      layoutId="active-door"
                      className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-secondary"
                    />
                  )}
                </motion.div>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="p-4 max-w-xs space-y-2 bg-background/95 backdrop-blur-md border-primary/10 shadow-premium z-[200]">
                <p className="font-bold text-[10px] uppercase tracking-widest text-primary">{door.label}</p>
                <p className="text-xs text-muted-foreground leading-relaxed">{door.tooltip}</p>
                <div className="pt-2 flex items-center gap-2">
                  <kbd className="px-2 py-1 rounded bg-muted text-[9px] font-mono text-muted-foreground border border-border/40">Alt</kbd>
                  <span className="text-[10px] text-muted-foreground">+</span>
                  <kbd className="px-2 py-1 rounded bg-muted text-[9px] font-mono text-muted-foreground border border-border/40">{door.shortcut}</kbd>
                </div>
              </TooltipContent>
            </Tooltip>
          );
        })}
      </div>
  );
};

export default HomeMainDoors;