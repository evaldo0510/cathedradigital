import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Icons } from '@/constants';
import { AppRoute } from '@/types';
import { cn } from '@/lib/utils';
import { Card   } from './Card';
import { CathedraIcon } from './CathedraIcon';

interface HomeMainDoorsProps {
  t: (key: string) => string;
  className?: string;
}

const HomeMainDoors: React.FC<HomeMainDoorsProps> = ({ t, className }) => {
  const navigate = useNavigate();
  
  const doors = [
    {
      label: t('bible'),
      description: t('bible_sub') || 'A Palavra de Deus',
      icon: Icons.Bible,
      route: AppRoute.BIBLE,
      color: 'bg-primary/[0.03] text-primary',
    },
    {
      label: t('catechism'),
      description: t('catechism_sub') || 'A Doutrina da Fé',
      icon: Icons.Catechism,
      route: AppRoute.CATECHISM,
      color: 'bg-primary/[0.03] text-secondary',
    },
    {
      label: t('liturgy'),
      description: t('liturgy_sub') || 'Oração da Igreja',
      icon: Icons.Liturgy,
      route: AppRoute.LITURGIA,
      color: 'bg-primary/[0.03] text-primary',
    },
    {
      label: t('journeys'),
      description: t('journeys_sub') || 'Trilhas de Formação',
      icon: Icons.Journeys,
      route: AppRoute.JORNADAS,
      color: 'bg-primary/[0.03] text-secondary',
    },
  ];

  return (
    <div className={cn("grid grid-cols-2 md:grid-cols-4 gap-8 lg:gap-12", className)}>
      {doors.map((door, idx) => (
        <Card
          key={idx}
          variant="interactive"
          padding="lg"
          onClick={() => navigate(door.route)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              navigate(door.route);
            }
          }}
          tabIndex={0}
          role="button"
          aria-label={`${door.label}: ${door.description}`}
          className="flex flex-col items-center text-center gap-8 group"
        >
          <div className="w-16 h-16 rounded-premium-sm bg-primary/[0.02] flex items-center justify-center text-primary group-hover:bg-primary/5 group-hover:scale-110 transition-all duration-700 border border-border/30">
            <door.icon className="w-8 h-8" strokeWidth={1.25} />
          </div>
          <div className="space-y-4">
            <h3 className="text-premium-tiny font-bold uppercase tracking-[0.4em] text-foreground group-hover:text-primary transition-colors">{door.label}</h3>
            <p className="text-premium-tiny text-muted-foreground font-medium line-clamp-2 leading-relaxed opacity-40 group-hover:opacity-100 transition-opacity px-2">{door.description}</p>
          </div>
        </Card>
      ))}
    </div>
  );
};

export default HomeMainDoors;
