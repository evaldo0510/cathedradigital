import React from 'react';
import { motion } from 'framer-motion';
import { Icons } from '@/constants';

interface HomeStatsProps {
  stats: {
    chaptersRead: number;
    journeySteps: number;
    catechismParagraphs: number;
  };
  t: (key: string) => string;
}

const HomeStats: React.FC<HomeStatsProps> = ({ stats, t }) => {
  const statItems = [
    { label: t('bible'), value: stats?.chaptersRead ?? 0, icon: <Icons.Bible className="w-4 h-4" /> },
    { label: 'CIC', value: stats?.catechismParagraphs ?? 0, icon: <Icons.Catechism className="w-4 h-4" /> },
    { label: t('journeys'), value: stats?.journeySteps ?? 0, icon: <Icons.Journeys className="w-4 h-4" /> },
  ];

  if (!stats) {
    return (
      <div className="grid grid-cols-3 gap-3">
        {[1, 2, 3].map(i => (
          <div key={i} className="p-3 rounded-2xl bg-muted/20 border border-border/50 animate-pulse h-20" />
        ))}
      </div>
    );
  }

  return (
    <div 
      className="grid grid-cols-3 gap-3"
      role="region"
      aria-label="Estatísticas da semana"
    >
      {statItems.map((item, idx) => (
        <motion.div 
          key={idx}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: idx * 0.1 }}
          className="premium-card p-3 text-center space-y-1 rounded-2xl"
        >
          <div className="flex justify-center text-primary/40 mb-1" aria-hidden="true">{item.icon}</div>
          <p className="text-xl font-black text-foreground tabular-nums leading-none">{item.value}</p>
          <p className="text-[8px] font-black uppercase tracking-widest text-muted-foreground">{item.label}</p>
        </motion.div>
      ))}
    </div>
  );
};

export default HomeStats;
