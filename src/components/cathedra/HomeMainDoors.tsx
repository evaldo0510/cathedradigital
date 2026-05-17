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
    <div className="grid grid-cols-2 md:grid-cols-4 gap-8 lg:gap-12">
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
          className="p-8 md:p-12 lg:p-14 rounded-[2.5rem] border border-border/40 bg-card flex flex-col items-center text-center gap-8 cursor-pointer group transition-all focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none shadow-sm hover:border-primary/20 hover:bg-primary/[0.02]"
        >
          <div className="w-16 h-16 rounded-3xl bg-muted/30 flex items-center justify-center text-primary group-hover:bg-primary/10 group-hover:scale-110 transition-all duration-500">
            <door.icon className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-foreground tracking-tight">{door.label}</h3>
            <p className="text-[10px] text-muted-foreground font-medium line-clamp-2 mt-2 leading-relaxed">{door.description}</p>
          </div>
        </motion.div>
      ))}
    </div>
  );
};

export default HomeMainDoors;
