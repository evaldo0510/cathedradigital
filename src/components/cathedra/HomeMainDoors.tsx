/* Headings structure: h2 used for section titles in HomeMainContent, h3 for card group titles, h4 for individual cards */
import React, { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Icons } from '@/constants';
import { AppRoute } from '@/types';
import { useReadingSettings } from '@/contexts/ReadingSettingsContext';
import { cn } from '@/lib/utils';
import { CathedraCard } from './CathedraCard';

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
    <div className={cn("grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-16 lg:gap-24 w-full max-w-7xl mx-auto", className)}>
      {doors.map((door, idx) => (
        <CathedraCard
          key={idx}
          ref={el => doorRefs.current[idx] = el}
          variant="interactive"
          padding="none"
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
          className="p-4 md:p-32 lg:p-48 flex flex-col items-center text-center gap-3 md:gap-24 focus-visible:ring-primary/40 focus-visible:ring-offset-2 group border-none bg-primary/[0.001] hover:bg-primary/[0.005] shadow-none hover:shadow-premium transition-all duration-1000 rounded-[2rem] md:rounded-[6rem]"
        >
          <div className="w-10 h-10 md:w-40 md:h-40 rounded-full bg-primary/[0.003] flex items-center justify-center text-primary/10 group-hover:scale-110 group-hover:text-primary/60 group-hover:bg-primary/[0.015] transition-all duration-1500 ease-in-out">
            <door.icon className="w-6 h-6 md:w-12 md:h-12" strokeWidth={1} />
          </div>
          <div className="space-y-4 md:space-y-10">
            <h4 className="text-[7.5px] md:text-[9px] font-bold uppercase tracking-[0.4em] md:tracking-[0.6em] text-primary/20 group-hover:text-primary/80 transition-colors duration-1000">
              {door.label}
            </h4>
            <p className="hidden md:block text-[12px] md:text-[14px] text-muted-foreground/40 font-serif italic tracking-widest group-hover:text-muted-foreground/80 transition-colors duration-1000 leading-relaxed max-w-[200px] mx-auto">
              {door.description}
            </p>
            <p className="md:hidden text-[10px] text-muted-foreground/30 font-serif italic tracking-wider leading-relaxed">
              {door.description}
            </p>
          </div>
        </CathedraCard>
      ))}
    </div>
  );
};

export default HomeMainDoors;