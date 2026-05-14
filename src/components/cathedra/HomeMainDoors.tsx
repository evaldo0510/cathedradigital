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
    <div className="grid grid-cols-2 gap-3">
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
          className={`p-6 rounded-[2rem] border border-[#0F172A]/5 bg-white flex flex-col gap-4 cursor-pointer group transition-all focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none shadow-sm hover:border-[#D4AF37]/30`}
        >
          <div className="w-12 h-12 rounded-2xl bg-[#0F172A]/5 flex items-center justify-center text-[#D4AF37] group-hover:bg-[#0F172A]/10 transition-colors">
            <door.icon className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-[#0F172A]">{door.label}</h3>
            <p className="text-[10px] text-[#0F172A]/50 font-medium line-clamp-1 mt-1">{door.description}</p>
          </div>
        </motion.div>
      ))}
    </div>
  );
};

export default HomeMainDoors;
