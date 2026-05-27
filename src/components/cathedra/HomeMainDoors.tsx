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
    <div className={cn("grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12 lg:gap-16", className)}>
      {doors.map((door, idx) => (
        <motion.div
          key={idx}
          ref={el => doorRefs.current[idx] = el}
          whileHover={{ y: -8 }}
          whileTap={{ scale: 0.98 }}
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
          className="relative p-10 md:p-12 lg:p-14 rounded-[2rem] border border-primary/[0.03] bg-card/5 backdrop-blur-sm flex flex-col items-center text-center gap-10 cursor-pointer group transition-all duration-700 focus-visible:ring-1 focus-visible:ring-primary/10 focus-visible:outline-none hover:bg-card/[0.08] hover:border-primary/5 shadow-premium-sm"
        >
          <div className="w-16 h-16 rounded-full bg-primary/[0.02] flex items-center justify-center text-primary/20 group-hover:scale-110 group-hover:text-primary/40 transition-all duration-1000 border border-primary/5">
            <door.icon className="w-8 h-8" strokeWidth={0.5} />
          </div>
          <div className="space-y-4">
            <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-primary/30 group-hover:text-primary/60 transition-colors duration-700">
              {door.label}
            </h3>
            <p className="text-[11px] text-muted-foreground/20 font-serif italic tracking-wide group-hover:text-muted-foreground/40 transition-colors duration-700 leading-relaxed max-w-[140px]">
              {door.description}
            </p>
          </div>
        </motion.div>
      ))}
    </div>
  );
};

export default HomeMainDoors;