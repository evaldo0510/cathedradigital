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
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 px-2">
      {doors.map((door, idx) => (
        <motion.div
          key={idx}
          whileHover={{ scale: 1.02, y: -4 }}
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
          className={`p-6 rounded-[2rem] border border-border/10 bg-card/40 backdrop-blur-sm flex flex-col items-center text-center gap-4 cursor-pointer group transition-all duration-500 hover:border-primary/20 hover:shadow-xl hover:shadow-primary/5 focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:outline-none`}
        >
          <div className={`w-14 h-14 rounded-2xl ${door.color} flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform duration-500`}>
            <door.icon className="w-6 h-6" />
          </div>
          <div className="space-y-1.5">
            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">{door.label}</h3>
            <p className="text-[10px] text-muted-foreground/60 font-medium italic line-clamp-1">{door.description}</p>
          </div>
        </motion.div>
      ))}
    </div>
  );
};

export default HomeMainDoors;
