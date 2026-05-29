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
    <div className={cn("grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-12 md:gap-32 lg:gap-48 w-full max-w-7xl mx-auto px-6", className)}>
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
          className="p-8 md:p-24 lg:p-32 flex flex-col items-center text-center gap-6 md:gap-16 focus-visible:ring-primary/20 focus-visible:ring-offset-8 group border-none bg-transparent hover:bg-transparent shadow-none hover:shadow-none transition-all duration-700 rounded-[2.5rem] md:rounded-[4rem]"
        >
          <div className="w-16 h-16 md:w-32 md:h-32 rounded-full bg-primary/[0.003] flex items-center justify-center text-primary/10 group-hover:scale-105 group-hover:text-primary/60 group-hover:bg-primary/[0.01] transition-all duration-700 ease-in-out glow-soft">
            <door.icon className="w-6 h-6 md:w-12 md:h-12" strokeWidth={0.5} />
          </div>
          <div className="space-y-4 md:space-y-8">
            <h4 className="text-[9px] md:text-[11px] font-black uppercase tracking-[0.6em] md:tracking-[1em] text-primary/20 group-hover:text-primary/60 transition-colors duration-700">
              {door.label}
            </h4>
            <p className="text-[12px] md:text-[15px] text-muted-foreground/30 font-serif italic tracking-[0.05em] group-hover:text-muted-foreground/60 transition-colors duration-700 leading-relaxed max-w-[240px] mx-auto opacity-0 group-hover:opacity-100 translate-y-1 group-hover:translate-y-0 transition-all duration-700">
              {door.description}
            </p>
          </div>

        </CathedraCard>
      ))}
    </div>
  );
};

export default HomeMainDoors;