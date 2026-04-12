import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { AppRoute } from '@/types';

const NEXUS_THEMES = [
  { label: 'Fé', emoji: '✝️', slug: 'fe' },
  { label: 'Amor', emoji: '❤️', slug: 'amor' },
  { label: 'Esperança', emoji: '🕊️', slug: 'esperanca' },
  { label: 'Graça', emoji: '💧', slug: 'graca' },
  { label: 'Pecado', emoji: '⚔️', slug: 'pecado' },
  { label: 'Perdão', emoji: '🤲', slug: 'perdao' },
  { label: 'Oração', emoji: '🙏', slug: 'oracao' },
  { label: 'Santidade', emoji: '✨', slug: 'santidade' },
  { label: 'Verdade', emoji: '🔥', slug: 'verdade' },
  { label: 'Liberdade', emoji: '🕊️', slug: 'liberdade' },
];

const NexusBubbles: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground">
            Nexus Theologicus
          </span>
        </div>
        <button
          onClick={() => navigate(AppRoute.TEMAS)}
          className="text-[10px] font-bold text-primary hover:underline"
        >
          Ver todos →
        </button>
      </div>

      <div className="flex flex-wrap gap-2 justify-center">
        {NEXUS_THEMES.map((theme, i) => (
          <motion.button
            key={theme.slug}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.03, type: 'spring', damping: 20 }}
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate(`${AppRoute.TEMAS}?tema=${theme.slug}`)}
            className="px-4 py-2 rounded-full border border-border bg-card hover:border-primary/40 hover:bg-primary/5 transition-all shadow-sm hover:shadow-md flex items-center gap-1.5 group"
          >
            <span className="text-sm">{theme.emoji}</span>
            <span className="text-xs font-bold text-foreground/80 group-hover:text-primary transition-colors">
              {theme.label}
            </span>
          </motion.button>
        ))}
      </div>
    </div>
  );
};

export default NexusBubbles;
