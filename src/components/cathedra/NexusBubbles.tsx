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

interface TagContent {
  id: string;
  type: string;
  content_text: string;
  reference_id: string;
}

const TagBubble: React.FC<{ tag: Tag; index: number }> = ({ tag, index }) => {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [content, setContent] = useState<TagContent[]>([]);
  const [logosInsight, setLogosInsight] = useState<string | null>(null);

  const fetchContent = async () => {
    if (content.length > 0 || loading) return;
    setLoading(true);
    try {
      // 1. Fetch content
      const { data, error } = await supabase
        .from('content_tags')
        .select(`
          spiritual_contents (
            id,
            content_text,
            type,
            reference_id
          )
        `)
        .eq('tag_id', tag.id)
        .limit(2);

      if (!error && data) {
        const formatted = (data as any[]).map(d => d.spiritual_contents);
        setContent(formatted);
      }

      // 2. Fetch AI Insight
      const { data: insightData, error: insightError } = await supabase.functions.invoke('logos-spiritual-insight', {
        body: { query: tag.label }
      });
      if (!insightError && insightData?.insight) {
        setLogosInsight(insightData.insight);
      }
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  return (
    <Popover open={open} onOpenChange={(val) => {
      setOpen(val);
      if (val) fetchContent();
    }}>
      <PopoverTrigger asChild>
        <motion.button
          key={tag.slug}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: index * 0.02, type: 'spring', damping: 20 }}
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.95 }}
          className={`px-3 py-1.5 rounded-full border border-border bg-card transition-all shadow-sm flex items-center gap-1 group/tag ${open ? 'border-primary/40 bg-primary/5 ring-1 ring-primary/20' : 'hover:border-primary/40 hover:bg-primary/5 hover:shadow-md'}`}
        >
          <span className="text-xs">{tag.emoji}</span>
          <span className={`text-[11px] font-bold transition-colors ${open ? 'text-primary' : 'text-foreground/80 group-hover/tag:text-primary'}`}>
            {tag.label}
          </span>
        </motion.button>
      </PopoverTrigger>
      <PopoverContent className="w-[320px] p-0 rounded-2xl border-primary/20 overflow-hidden shadow-2xl z-[100]">
        <div className="bg-primary/5 p-3 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sm">{tag.emoji}</span>
            <span className="text-xs font-black uppercase tracking-wider text-primary">{tag.label}</span>
          </div>
          <button 
            onClick={() => navigate(`${AppRoute.TEMAS}?tema=${tag.slug}`)}
            className="text-[10px] font-bold text-primary hover:underline flex items-center gap-1"
          >
            Estudo Completo
            <ExternalLink className="w-2.5 h-2.5" />
          </button>
        </div>
        
        <div className="p-4 space-y-4 max-h-[300px] overflow-y-auto scrollbar-none">
          {loading ? (
            <div className="space-y-3 py-2">
              <div className="h-3 bg-muted rounded animate-pulse w-full" />
              <div className="h-3 bg-muted rounded animate-pulse w-3/4" />
              <div className="h-24 bg-muted/30 rounded-xl animate-pulse w-full" />
            </div>
          ) : (
            <>
              {logosInsight && (
                <div className="bg-secondary/5 rounded-xl p-3 border border-secondary/10">
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <Sparkles className="w-3 h-3 text-secondary" />
                    <span className="text-[9px] font-black uppercase tracking-widest text-secondary">Logos Insight</span>
                  </div>
                  <p className="text-[11px] text-foreground/80 leading-relaxed italic line-clamp-4">
                    "{logosInsight}"
                  </p>
                </div>
              )}
              
              {content.length > 0 ? (
                <div className="space-y-3">
                  <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/60">Versículos & Fontes</span>
                  {content.map((c, i) => (
                    <div key={c.id || i} className="space-y-1 group">
                      <p className="text-[11px] leading-relaxed text-foreground/90 line-clamp-3">
                        {c.content_text}
                      </p>
                      <span className="text-[9px] font-bold text-primary/70">{c.reference_id}</span>
                    </div>
                  ))}
                </div>
              ) : !logosInsight && (
                <p className="text-[10px] text-muted-foreground italic text-center py-4">Nenhum conteúdo vinculado no momento.</p>
              )}
            </>
          )}
        </div>
        
        <div className="p-2 bg-muted/30 border-t border-border flex justify-center">
          <Button 
            variant="ghost" 
            size="sm" 
            className="w-full rounded-xl text-[10px] font-bold h-8 hover:bg-primary/10 hover:text-primary"
            onClick={() => navigate(`${AppRoute.TEMAS}?tema=${tag.slug}`)}
          >
            Abrir no Nexus Theologicus
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
};


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