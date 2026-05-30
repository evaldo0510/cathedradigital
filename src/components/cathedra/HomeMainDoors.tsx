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
          className="flex flex-col items-center text-center gap-6 group cursor-pointer transition-all duration-1000 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary/10 rounded-2xl p-4"
        >
          <div className="w-16 h-16 rounded-full flex items-center justify-center text-primary/10 group-hover:text-primary/40 transition-all duration-1000 ease-in-out border border-primary/[0.03] group-hover:border-primary/10 bg-primary/[0.003] group-hover:bg-primary/[0.01]">
            <door.icon className="w-8 h-8" strokeWidth={0.5} />
          </div>
          <div className="space-y-4">
            <h4 className="text-[10px] font-black uppercase tracking-[0.5em] text-primary/40 group-hover:text-primary transition-colors duration-1000">
              {door.label}
            </h4>
            <p className="text-[11px] md:text-[12px] text-muted-foreground/30 font-serif italic tracking-widest group-hover:text-muted-foreground/60 transition-colors duration-1000 leading-relaxed max-w-[240px]">
              {door.description}
            </p>
          </div>
          <div className="h-px w-8 bg-primary/5 group-hover:w-16 transition-all duration-1000" />
        </div>
      ))}
    </div>
  );
};

export default HomeMainDoors;