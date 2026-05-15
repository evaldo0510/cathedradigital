import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Icons } from '@/constants';
import { AppRoute } from '@/types';

interface HomeMainDoorsProps {
  t: (key: string) => string;
}

const HomeMainDoors: React.FC<HomeMainDoorsProps> = ({ t }) => {
  const navigate = useNavigate();
  
  const doors = [
    {
      label: t('bible'),
      description: t('bible_sub') || 'A Palavra de Deus',
      icon: Icons.Bible,
      route: AppRoute.BIBLE,
      color: 'bg-primary/5 text-primary',
    },
    {
      label: t('catechism'),
      description: t('catechism_sub') || 'A Doutrina da Fé',
      icon: Icons.Catechism,
      route: AppRoute.CATECHISM,
      color: 'bg-accent/5 text-accent',
    },
    {
      label: t('liturgy'),
      description: t('liturgy_sub') || 'Oração da Igreja',
      icon: Icons.Liturgy,
      route: AppRoute.LITURGIA,
      color: 'bg-primary/5 text-primary',
    },
    {
      label: t('journeys'),
      description: t('journeys_sub') || 'Trilhas de Formação',
      icon: Icons.Journeys,
      route: AppRoute.JORNADAS,
      color: 'bg-accent/5 text-accent',
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-6 lg:gap-8">
      {doors.map((door, idx) => (
        <motion.div
          key={idx}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
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
          className="p-10 md:p-14 rounded-[3rem] border border-border/20 bg-card flex flex-col items-center text-center gap-8 cursor-pointer group transition-all focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:outline-none shadow-premium hover:shadow-premium-hover hover:border-primary/10 hover:bg-primary/[0.01]"
        >
          <div className="w-16 h-16 rounded-3xl bg-muted/10 flex items-center justify-center text-primary group-hover:bg-primary/5 group-hover:scale-110 transition-all duration-700 border border-border/30">
            <door.icon className="w-8 h-8" strokeWidth={1.25} />
          </div>
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-[0.3em] text-foreground group-hover:text-primary transition-colors">{door.label}</h3>
            <p className="text-premium-tiny text-muted-foreground font-medium line-clamp-2 leading-relaxed opacity-50 group-hover:opacity-100 transition-opacity px-2">{door.description}</p>
          </div>
        </motion.div>
      ))}
    </div>
  );
};

export default HomeMainDoors;
