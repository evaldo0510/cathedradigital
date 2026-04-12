import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { AppRoute } from '@/types';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, ExternalLink, Sparkles } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';

interface Tag {
  id: string;
  slug: string;
  label: string;
  emoji: string;
  category: string;
}

const NexusBubbles: React.FC = () => {
  const navigate = useNavigate();
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTags = async () => {
      const { data, error } = await supabase
        .from('tags')
        .select('*')
        .order('label');
      
      if (!error && data) {
        setTags(data as Tag[]);
      }
      setLoading(false);
    };
    fetchTags();
  }, []);

  const categories = {
    fundamentos: { label: 'Fundamentos da Fé', emoji: '⛪' },
    dores: { label: 'Dores e Busca', emoji: '💔' },
    divino: { label: 'Mistério Divino', emoji: '👑' },
    vida: { label: 'Vida Prática', emoji: '🌱' },
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-10">
        <Loader2 className="w-6 h-6 animate-spin text-primary/40" />
      </div>
    );
  }

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
        {Object.entries(categories).map(([key, category]) => {
          const categoryTags = tags.filter(t => t.category === key);
          if (categoryTags.length === 0) return null;

          return (
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
                {(expandedCategory === key ? categoryTags : categoryTags.slice(0, 5)).map((tag, i) => (
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
                {expandedCategory !== key && categoryTags.length > 5 && (
                  <button
                    onClick={() => setExpandedCategory(key)}
                    className="px-3 py-1.5 rounded-full border border-dashed border-border text-[11px] font-bold text-muted-foreground hover:text-primary hover:border-primary/40 transition-all"
                  >
                    +{categoryTags.length - 5}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default NexusBubbles;