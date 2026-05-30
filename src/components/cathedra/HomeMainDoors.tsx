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
    <div className={cn("grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-12 md:gap-20 w-full max-w-6xl mx-auto", className)}>
      {doors.map((door, idx) => (
        <div
          key={idx}
          ref={el => doorRefs.current[idx] = el}
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
          className="flex flex-col items-center text-center gap-6 group cursor-pointer transition-all duration-1000 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary/10 rounded-[2.5rem] p-8 md:p-12 hover:bg-primary/[0.01]"
        >
          <div className="w-20 h-20 md:w-24 md:h-24 rounded-full flex items-center justify-center text-primary/20 group-hover:text-primary/60 transition-all duration-1000 ease-in-out border border-primary/[0.05] bg-primary/[0.01] group-hover:bg-primary/[0.03]">
            <door.icon className="w-10 h-10 md:w-12 md:h-12" strokeWidth={0.5} />
          </div>
          <div className="space-y-4">
            <h4 className="text-[11px] font-black uppercase tracking-[0.6em] text-primary/40 group-hover:text-primary transition-colors duration-1000">
              {door.label}
            </h4>
            <p className="text-[12px] md:text-[13px] text-muted-foreground/40 font-serif italic tracking-widest group-hover:text-muted-foreground/70 transition-colors duration-1000 leading-relaxed max-w-[280px]">
              {door.description}
            </p>
          </div>
          <div className="h-px w-12 bg-primary/10 group-hover:w-20 transition-all duration-1000" />
        </div>
      ))}
    </div>
  );
};

export default HomeMainDoors;