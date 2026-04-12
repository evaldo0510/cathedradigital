import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { AppRoute } from '@/types';
import { TAG_CATEGORIES } from '@/lib/tagNormalization';

const NexusBubbles: React.FC = () => {
  const navigate = useNavigate();
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);

  const categories = Object.entries(TAG_CATEGORIES);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground">
          Nexus Theologicus
        </span>
        <button
          onClick={() => navigate(AppRoute.TEMAS)}
          className="text-[10px] font-bold text-primary hover:underline"
        >
          Ver todos →
        </button>
      </div>

      <div className="space-y-3">
        {categories.map(([key, category]) => (
          <div key={key}>
            <button
              onClick={() => setExpandedCategory(expandedCategory === key ? null : key)}
              className="flex items-center gap-1.5 mb-1.5 group"
            >
              <span className="text-sm">{category.emoji}</span>
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground group-hover:text-primary transition-colors">
                {category.label}
              </span>
              <span className="text-[10px] text-muted-foreground/50">
                {expandedCategory === key ? '▾' : '▸'}
              </span>
            </button>

            <div className="flex flex-wrap gap-1.5">
              {(expandedCategory === key ? category.tags : category.tags.slice(0, 5)).map((tag, i) => (
                <motion.button
                  key={tag.slug}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.02, type: 'spring', damping: 20 }}
                  whileHover={{ scale: 1.08 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => navigate(`${AppRoute.TEMAS}?tema=${tag.slug}`)}
                  className="px-3 py-1.5 rounded-full border border-border bg-card hover:border-primary/40 hover:bg-primary/5 transition-all shadow-sm hover:shadow-md flex items-center gap-1 group/tag"
                >
                  <span className="text-xs">{tag.emoji}</span>
                  <span className="text-[11px] font-bold text-foreground/80 group-hover/tag:text-primary transition-colors">
                    {tag.label}
                  </span>
                </motion.button>
              ))}
              {expandedCategory !== key && category.tags.length > 5 && (
                <button
                  onClick={() => setExpandedCategory(key)}
                  className="px-3 py-1.5 rounded-full border border-dashed border-border text-[11px] font-bold text-muted-foreground hover:text-primary hover:border-primary/40 transition-all"
                >
                  +{category.tags.length - 5}
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default NexusBubbles;
