import React, { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Icons } from '@/constants';
import { AppRoute } from '@/types';
import { useReadingSettings } from '@/contexts/ReadingSettingsContext';
import { cn } from '@/lib/utils';

interface HomeMainDoorsProps {
  t: (key: string) => string;
  className?: string;
}

const HomeMainDoors: React.FC<HomeMainDoorsProps> = ({ t, className }) => {
  const navigate = useNavigate();
  const { settings } = useReadingSettings();
  const doorRefs = useRef<(HTMLDivElement | null)[]>([]);

  const doors = [
    {
      label: t('bible'),
      description: 'A Palavra de Deus.',
      icon: Icons.Bible,
      route: AppRoute.BIBLE,
      shortcut: settings?.shortcuts?.bible || 'b',
    },
    {
      label: t('catechism'),
      description: 'A base da doutrina.',
      icon: Icons.Catechism,
      route: AppRoute.CATECHISM,
      shortcut: settings?.shortcuts?.catechism || 'c',
    },
    {
      label: 'Magistério',
      description: 'A voz da Igreja.',
      icon: Icons.Magisterium,
      route: AppRoute.MAGISTERIUM,
      shortcut: settings?.shortcuts?.magisterium || 'm',
    },
  ];

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.altKey && !e.ctrlKey && !e.metaKey && !e.shiftKey) {
        const key = e.key.toLowerCase();
        const doorIdx = doors.findIndex(d => d.shortcut?.toLowerCase() === key);
        
        if (doorIdx !== -1) {
          e.preventDefault();
          const element = doorRefs.current[doorIdx];
          if (element) {
            element.focus();
            element.scrollIntoView({ behavior: 'smooth', block: 'center' });
            element.classList.add('ring-2', 'ring-primary/20', 'scale-[1.02]');
            setTimeout(() => {
              element.classList.remove('ring-2', 'ring-primary/20', 'scale-[1.02]');
              handleNavigate(doors[doorIdx].route);
            }, 400);
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [navigate]);

  const handleNavigate = (route: string) => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    sessionStorage.setItem('cathedra_auto_focus', 'true');
    navigate(route);
  };

  return (
    <div className={cn("grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8", className)}>
      {doors.map((door, idx) => (
        <motion.div
          key={idx}
          ref={el => doorRefs.current[idx] = el}
          whileHover={{ y: -4 }}
          whileTap={{ scale: 0.99 }}
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
          className="relative p-12 md:p-16 rounded-[2.5rem] border border-border/5 bg-card/5 backdrop-blur-sm flex flex-col items-center text-center gap-10 cursor-pointer group transition-all focus-visible:ring-2 focus-visible:ring-primary/10 focus-visible:outline-none hover:bg-card/10 hover:border-primary/5 shadow-premium"
        >
          <div className="w-16 h-16 rounded-full bg-primary/[0.02] flex items-center justify-center text-primary/20 group-hover:scale-110 group-hover:text-primary/40 transition-all duration-1000 border border-primary/5">
            <door.icon className="w-8 h-8" strokeWidth={0.5} />
          </div>
          <div className="space-y-4">
            <h3 className="text-[10px] font-bold uppercase tracking-[0.5em] text-primary/40 group-hover:text-primary transition-colors duration-500">
              {door.label}
            </h3>
            <p className="text-[10px] text-muted-foreground/30 font-serif italic tracking-wider group-hover:text-muted-foreground/50 transition-colors duration-500">
              {door.description}
            </p>
          </div>
        </motion.div>
      ))}
    </div>
  );
};

export default HomeMainDoors;