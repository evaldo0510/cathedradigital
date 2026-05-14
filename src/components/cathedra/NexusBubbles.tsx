import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { getSpiritualInsight } from '@/services/aiService';
import { useNavigate } from 'react-router-dom';
import { normalizeText } from '@/lib/utils';
import { fetchNexusTagContent, type TagContent, exportNexusLogs } from '@/lib/nexusContent';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { AppRoute } from '@/types';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, ExternalLink, Sparkles, Search, X, Heart, Church, Flame, BookOpen, Shield, Compass, Hash, Filter, AlertCircle, Info, Timer, FileJson, Download as DownloadIcon, Database } from 'lucide-react';
import { Icons } from '@/constants';
import { BubbleTag, getTagIcon } from './BubbleTag';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { type ProfileId, PROFILES } from './SpiritualQuiz';
import { useRovingTabindex } from './TabUtils';
import { useSpiritualProfile } from '@/hooks/useSpiritualProfile';

interface Tag {
  id: string;
  slug: string;
  label: string;
  emoji: string;
  category: string;
  priorityGroup?: string;
}

interface NexusBubblesProps {
  profileId?: ProfileId | null;
}

interface TagBubbleProps {
  tag: Tag;
  index: number;
  isSuggested?: boolean;
  tabIndex?: number;
  onKeyDown?: (e: React.KeyboardEvent) => void;
  className?: string;
  profileId?: ProfileId | null;
  navigateOnClick?: boolean;
  priorityGroup?: string;
  size?: 'xs' | 'sm' | 'md';
  searchMode?: 'tags' | 'title' | 'reference' | 'text' | 'all';
}

export const TagBubble: React.FC<TagBubbleProps> = ({ tag, index, isSuggested, tabIndex, onKeyDown, className, profileId, navigateOnClick, priorityGroup, size, searchMode = 'tags' }) => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [content, setContent] = useState<TagContent[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const [showLogs, setShowLogs] = useState(false);
  const [logosInsight, setLogosInsight] = useState<string | null>(null);
  const [errorDetails, setErrorDetails] = useState<string | null>(null);
  const [metrics, setMetrics] = useState<{ startTime: number; endTime?: number; source?: 'supabase' | 'ia' | 'both' }>({ startTime: 0 });

  const fetchContent = async () => {
    if (content.length > 0 || status === 'loading') return;
    const startTime = performance.now();
    setMetrics({ startTime });
    setStatus('loading');
    setErrorDetails(null);
    
    try {
      const { content: uniqueResults, logs: searchLogs } = await fetchNexusTagContent(
        tag, 
        { mode: searchMode, includeSynonyms: true }
      );
      setContent(uniqueResults);
      setLogs(searchLogs);

      // IA Fetch
      try {
        const result = await getSpiritualInsight(tag.label, undefined, profileId);
        if (!result.error && result.content) {
          setLogosInsight(result.content);
        }
      } catch (iaErr) {
        console.error(`[Nexus Diagnostic] AI Fetch failed.`, iaErr);
      }

      setMetrics(prev => ({ ...prev, endTime: performance.now(), source: 'both' }));
      setStatus('success');
    } catch (e: any) {
      console.error(`[Nexus Diagnostic] Error fetching ${tag.label}:`, e);
      setErrorDetails(e.message || 'Erro desconhecido');
      setMetrics(prev => ({ ...prev, endTime: performance.now() }));
      setStatus('error');
    }
  };

  const prefetchTag = useCallback(() => {
    queryClient.prefetchQuery({
      queryKey: ['tag-contents', tag.id, tag.label, searchMode],
      queryFn: () => fetchNexusTagContent(tag, { mode: searchMode, includeSynonyms: true }),
      staleTime: 1000 * 60 * 5,
    });
  }, [queryClient, tag.id, tag.label, searchMode]);

  return (
    <Popover open={navigateOnClick ? false : open} onOpenChange={(val) => {
      if (navigateOnClick && val) {
        navigate(`${AppRoute.TEMAS}/${tag.slug}`);
        return;
      }
      setOpen(val);
      if (val) fetchContent();
    }}>
      <PopoverTrigger asChild>
        <BubbleTag
          label={tag.label}
          emoji={tag.emoji}
          index={index}
          isSelected={open}
          isSuggested={isSuggested}
          size={size}
          onClick={() => {
            if (navigateOnClick) {
              navigate(`${AppRoute.TEMAS}/${tag.slug}`);
            }
          }} 
          onKeyDown={onKeyDown}
          onMouseEnter={prefetchTag}
          tabIndex={tabIndex}
          data-roving-item={true}
          data-priority={priorityGroup}
          className={className}
        />
      </PopoverTrigger>
      <PopoverContent data-testid="nexus-popover" className="w-[92vw] sm:w-[500px] p-0 rounded-[2.5rem] border-primary/10 overflow-hidden shadow-2xl z-[100] backdrop-blur-3xl bg-card/95 ring-1 ring-primary/5">
        <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent p-8 border-b border-border/20 flex items-center justify-between">
          <div className="flex items-center gap-5">
            <div className="w-16 h-16 rounded-2xl bg-white/40 dark:bg-black/20 flex items-center justify-center shadow-inner text-primary border border-primary/5 backdrop-blur-md">
              {getTagIcon(tag.emoji, "w-8 h-8")}
            </div>
            <div>
              <span className="text-[10px] font-black uppercase tracking-[0.4em] text-primary/40 mb-1.5 block">{tag.category}</span>
              <h4 className="text-xl font-bold tracking-tight text-foreground leading-tight">{tag.label}</h4>
            </div>
          </div>
          <button 
            onClick={() => navigate(`${AppRoute.TEMAS}/${tag.slug}`)}
            className="w-14 h-14 rounded-2xl bg-primary text-primary-foreground hover:scale-105 active:scale-95 transition-all flex items-center justify-center shadow-xl shadow-primary/20 group ring-4 ring-primary/5"
            title="Estudo Completo"
          >
            <ExternalLink className="w-6 h-6 group-hover:rotate-12 transition-transform" />
          </button>
        </div>

        
        <div className="p-5 space-y-5 max-h-[450px] overflow-y-auto scrollbar-none">
          {/* Diagnostic Panel */}
          <div 
            className={`p-3 rounded-2xl border transition-all ${
              status === 'success' && content.length === 0 
                ? 'bg-amber-500/5 border-amber-500/20 shadow-sm' 
                : 'bg-muted/30 border-border/40'
            }`}
          >
            <div 
              className="flex items-center justify-between text-[8px] font-black uppercase tracking-widest opacity-70 cursor-pointer hover:opacity-100 transition-opacity mb-2"
              onClick={() => setShowLogs(!showLogs)}
            >
              <div className="flex gap-2">
                <span className="flex items-center gap-1">
                  <Timer className="w-2.5 h-2.5" />
                  {metrics.endTime ? `${Math.round(metrics.endTime - metrics.startTime)}ms` : '--'}
                </span>
                <span className="flex items-center gap-1">
                  <Filter className="w-2.5 h-2.5" />
                  Mode: {searchMode}
                </span>
              </div>
              <div className="flex items-center gap-2">
                {logs.length > 0 && (
                  <div className="flex items-center gap-1" onClick={(e) => { e.stopPropagation(); exportNexusLogs(tag.label, logs, 'csv'); }}>
                    <DownloadIcon className="w-2.5 h-2.5 hover:text-primary transition-colors" />
                    <span className="hover:text-primary transition-colors">Exportar</span>
                  </div>
                )}
                <div className="flex items-center gap-1">
                  <Info className="w-2.5 h-2.5" />
                  <span>{showLogs ? 'Ocultar' : 'Detalhes'}</span>
                </div>
              </div>
            </div>
            
            {/* Always show terms used if 0 results or expanded */}
            {(showLogs || (status === 'success' && content.length === 0)) && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="space-y-3 pt-2 border-t border-border/20 overflow-hidden"
              >
                {logs.map((log, i) => (
                  <div key={i} className="space-y-1.5">
                    <div className="flex items-center justify-between text-[7px] font-black uppercase text-primary/70">
                      <span className="flex items-center gap-1">
                        <Database className="w-2 h-2" />
                        {log.stage}
                      </span>
                      <span>{log.resultsCount} resultados</span>
                    </div>
                    {log.termsUsed && log.termsUsed.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {log.termsUsed.map((term: string, j: number) => (
                          <span key={j} className="text-[7px] px-1.5 py-0.5 bg-primary/10 rounded-md font-mono lowercase border border-primary/5">
                            {term}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
                
                {logs.length > 0 && (
                  <div className="flex justify-end pt-1">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => exportNexusLogs(tag.label, logs, 'json')}
                      className="h-6 px-2 text-[7px] uppercase font-black tracking-widest rounded-lg hover:bg-primary/10"
                    >
                      <FileJson className="w-2.5 h-2.5 mr-1" />
                      Baixar JSON completo
                    </Button>
                  </div>
                )}
              </motion.div>
            )}
          </div>

          {status === 'loading' ? (
            <div className="space-y-4 py-2">
              <div className="flex gap-2">
                <div className="w-8 h-8 rounded-full bg-muted animate-pulse" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 bg-muted rounded animate-pulse w-full" />
                  <div className="h-3 bg-muted rounded animate-pulse w-2/3" />
                </div>
              </div>
              <div className="h-32 bg-muted/20 rounded-2xl animate-pulse w-full" />
              <p className="text-[10px] text-center text-muted-foreground animate-pulse">Consultando Nexus...</p>
            </div>
          ) : status === 'error' && content.length === 0 ? (
            <div className="p-6 text-center space-y-3 bg-red-500/5 rounded-2xl border border-red-500/10">
              <AlertCircle className="w-8 h-8 text-red-500 mx-auto" />
              <p className="text-sm font-bold text-red-600">Erro ao carregar conteúdo</p>
              <p className="text-[10px] text-muted-foreground italic">{errorDetails}</p>
              <Button size="sm" variant="outline" onClick={fetchContent} className="h-8 rounded-xl text-[10px] uppercase font-black tracking-widest">Tentar Novamente</Button>
            </div>
          ) : (
            <>
              {status === 'error' && content.length > 0 && (
                <div className="px-3 py-1 bg-amber-500/10 text-amber-600 rounded-lg text-[9px] font-bold flex items-center gap-2 mb-2">
                  <Info className="w-3 h-3" /> IA Indisponível — Exibindo conteúdo parcial do Nexus
                </div>
              )}
              {logosInsight && (
                <motion.div 
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-primary/5 rounded-[2rem] p-6 border border-primary/10 relative overflow-hidden group shadow-inner"
                >
                  <div className="absolute top-0 right-0 w-24 h-24 bg-primary/10 rounded-full blur-3xl -mr-10 -mt-10" />
                  <div className="flex items-center gap-2.5 mb-3">
                    <div className="w-6 h-6 rounded-lg bg-primary/20 flex items-center justify-center">
                      <Sparkles className="w-3.5 h-3.5 text-primary" />
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-[0.3em] text-primary/70">Logos Insight</span>
                  </div>
                  <p className="text-[14px] text-foreground/90 leading-relaxed italic font-serif">
                    "{logosInsight}"
                  </p>
                </motion.div>

              )}
              
              {content.length > 0 ? (
                <div className="space-y-6">
                  {[
                    { id: 'bible', label: 'Bíblia', icon: <BookOpen className="w-3.5 h-3.5" /> },
                    { id: 'catechism', label: 'Catecismo', icon: <Church className="w-3.5 h-3.5" /> },
                    { id: 'magisterium', label: 'Magistério', icon: <Shield className="w-3.5 h-3.5" /> },
                    { id: 'journey', label: 'Jornadas', icon: <Flame className="w-3.5 h-3.5" /> },
                  ].map((category) => {
                    const categoryContent = content.filter(c => c.type === category.id);
                    if (categoryContent.length === 0) return null;

                    return (
                      <div key={category.id} className="space-y-3">
                        <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/50 flex items-center gap-2">
                          <div className="h-[1px] w-4 bg-border/40" />
                          <div className="flex items-center gap-1.5 text-primary/60">
                            {category.icon}
                            {category.label}
                          </div>
                          <div className="h-[1px] flex-1 bg-border/40" />
                        </span>
                        
                        <div className="space-y-4">
                          {categoryContent.map((c, i) => {
                            const isBible = c.type === 'bible';
                            const isJourney = c.type === 'journey';
                            const reference = c.title;
                            
                            const link = isBible && c.metadata?.book && c.metadata?.chapter 
                              ? `/bible?book=${c.metadata.book}&ch=${c.metadata.chapter}` 
                              : isJourney ? `/jornadas/${c.id}` : null;

                            return (
                              <motion.div 
                                key={c.id || i} 
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: i * 0.05 }}
                                className="space-y-3 group/content p-4 rounded-2xl hover:bg-primary/5 transition-all duration-300 border border-transparent hover:border-primary/10 cursor-pointer"
                                onClick={() => link && navigate(link)}
                              >
                                <p className="text-[14px] leading-relaxed text-foreground/80 group-hover/content:text-foreground transition-colors font-serif">
                                  {c.content_text}
                                </p>
                                <div className="flex items-center justify-between pt-1">
                                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-primary flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 ring-1 ring-primary/20 shadow-sm">
                                    {reference}
                                    {link && <ExternalLink className="w-3 h-3" />}
                                  </span>
                                </div>
                              </motion.div>

                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : !logosInsight && status === 'success' && (
                <div className="flex flex-col items-center justify-center py-10 text-center space-y-4">
                  <div className="w-16 h-16 rounded-full bg-muted/20 flex items-center justify-center relative">
                    <div className="absolute inset-0 rounded-full border border-primary/10 animate-ping opacity-20" />
                    <Search className="w-8 h-8 text-muted-foreground/30" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-black uppercase tracking-widest text-foreground">Nexus Silencioso</p>
                    <p className="text-[10px] text-muted-foreground/60 italic max-w-[200px] mx-auto">
                      Ainda estamos tecendo as conexões para "{tag.label}". Tente outro tema ou explore o A-Z.
                    </p>
                  </div>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={() => navigate(`${AppRoute.TEMAS}/${tag.slug}`)} 
                    className="h-8 rounded-xl text-[9px] uppercase font-black tracking-widest border-primary/20 hover:bg-primary/5 transition-all"
                  >
                    Navegação A-Z
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
        
        <div className="p-3 bg-muted/20 border-t border-border/40 flex justify-center">
          <Button 
            variant="ghost" 
            size="sm" 
            className="w-full rounded-xl text-[10px] font-black uppercase tracking-widest h-9 hover:bg-primary/10 hover:text-primary transition-all active:scale-95"
            onClick={() => navigate(`${AppRoute.TEMAS}/${tag.slug}`)}
          >
            Navegação Completa
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
};

export type NexusSearchMode = 'tags' | 'title' | 'reference' | 'text' | 'all';

const NexusBubbles: React.FC<NexusBubblesProps> = ({ profileId: propProfileId }) => {
  const { profileId: hookProfileId } = useSpiritualProfile();
  const profileId = propProfileId || hookProfileId;
  const navigate = useNavigate();
  const filteredRef = React.useRef<HTMLDivElement>(null);
  const suggestedRef = React.useRef<HTMLDivElement>(null);
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchMode, setSearchMode] = useState<NexusSearchMode>(() => {
    return (localStorage.getItem('nexus_search_mode') as NexusSearchMode) || 'tags';
  });

  useEffect(() => {
    localStorage.setItem('nexus_search_mode', searchMode);
  }, [searchMode]);

  useEffect(() => {
    const fetchTags = async () => {
      const { data, error } = await supabase
        .from('themes')
        .select('*')
        .order('name');
      
      if (!error && data) {
        const mappedTags = data.map((t: any) => ({
          id: t.id,
          slug: t.slug,
          label: t.name,
          emoji: t.emoji || '⛪',
          category: t.category || 'Geral'
        }));
        setTags(mappedTags);
      }
      setLoading(false);
    };
    fetchTags();
  }, []);

  const [activeFilter, setActiveFilter] = useState<string>(() => {
    return localStorage.getItem('nexus_bubbles_filter') || 'all';
  });

  useEffect(() => {
    localStorage.setItem('nexus_bubbles_filter', activeFilter);
  }, [activeFilter]);

  const categories = {
    fundamentos: { label: 'Fundamentos', icon: <Church className="w-3.5 h-3.5" /> },
    dores: { label: 'Dores', icon: <Heart className="w-3.5 h-3.5 text-destructive" /> },
    divino: { label: 'Mistério', icon: <Sparkles className="w-3.5 h-3.5 text-secondary" /> },
    vida: { label: 'Vida', icon: <Flame className="w-3.5 h-3.5 text-orange-500" /> },
  };

  const profileSuggestedTags = useMemo(() => {
    if (!profileId || !tags.length) return [];
    const profile = PROFILES[profileId];
    if (!profile) return [];

    const relevantLabels = [profile.theme, profile.pain.label, 'Oração', 'Jesus', 'Fé'];
    return tags.filter(t => relevantLabels.some(l => t.label.toLowerCase().includes(l.toLowerCase()))).slice(0, 8);
  }, [profileId, tags]);

  const filteredTags = useMemo(() => {
    let result = tags;
    if (searchQuery) {
      const q = normalizeText(searchQuery);
      return result.filter(t => 
        normalizeText(t.label).includes(q) || 
        normalizeText(t.category).includes(q)
      );
    }
    
    if (activeFilter !== 'all') {
      result = result.filter(t => t.category?.toLowerCase() === activeFilter.toLowerCase());
    }
    return result;
  }, [tags, searchQuery, activeFilter]);

  const { activeIndex: filteredActiveIndex, handleKeyDown: handleFilteredKeyDown } = useRovingTabindex(filteredTags?.length || 0, filteredRef);
  const { activeIndex: suggestedActiveIndex, handleKeyDown: handleSuggestedKeyDown } = useRovingTabindex(profileSuggestedTags?.length || 0, suggestedRef);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-10">
        <Loader2 className="w-6 h-6 animate-spin text-primary/40" />
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-5xl mx-auto px-4 md:px-0">
      <div className="flex flex-col lg:flex-row items-center justify-between gap-6 border-b border-border/20 pb-6">
        <div className="flex flex-col text-center lg:text-left space-y-1">
          <span className="text-[11px] font-black uppercase tracking-[0.5em] text-primary/80">
            Nexus Theologicus
          </span>
          <span className="text-[11px] text-muted-foreground/50 font-medium italic">
            Conexões teológicas em constante expansão
          </span>
        </div>
        
        <div className="flex flex-col sm:flex-row items-center gap-4 w-full lg:w-auto">
          <div className="flex items-center p-1 bg-muted/30 rounded-2xl border border-border/10 w-full sm:w-auto overflow-x-auto scrollbar-none">
            {[
              { id: 'tags', label: 'Tags', icon: <Hash className="w-3.5 h-3.5" /> },
              { id: 'title', label: 'Título', icon: <BookOpen className="w-3.5 h-3.5" /> },
              { id: 'reference', label: 'Ref', icon: <Compass className="w-3.5 h-3.5" /> },
              { id: 'text', label: 'Texto', icon: <Search className="w-3.5 h-3.5" /> },
              { id: 'all', label: 'Tudo', icon: <Filter className="w-3.5 h-3.5" /> },
            ].map((mode) => (
              <button
                key={mode.id}
                onClick={() => setSearchMode(mode.id as NexusSearchMode)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${
                  searchMode === mode.id 
                    ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/10' 
                    : 'text-muted-foreground/50 hover:text-primary hover:bg-primary/5'
                }`}
              >
                {mode.icon}
                <span className="inline">{mode.label}</span>
              </button>
            ))}
          </div>

          <div className="relative group/search w-full sm:w-[240px]">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/40 transition-colors group-focus-within/search:text-primary" />
            <input 
              type="text"
              placeholder="Buscar tema..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-11 pl-10 pr-10 bg-card/30 border border-border/10 rounded-2xl text-[12px] focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all font-medium"
              aria-label="Buscar tema no Nexus"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 hover:bg-muted rounded-full transition-colors"
              >
                <X className="w-3.5 h-3.5 text-muted-foreground/60" />
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 overflow-x-auto pb-4 scrollbar-none px-2">
        <button
          onClick={() => setActiveFilter('all')}
          className={`px-5 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${activeFilter === 'all' ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/10' : 'bg-muted/30 text-muted-foreground/60 hover:bg-muted/50'}`}
        >
          Todos
        </button>

        {Object.entries(categories).map(([key, cat]) => (
          <button
            key={key}
            onClick={() => setActiveFilter(key)}
            className={`px-5 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 whitespace-nowrap ${activeFilter === key ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/10' : 'bg-muted/30 text-muted-foreground/60 hover:bg-muted/50'}`}
          >
            {cat.icon}
            {cat.label}
          </button>
        ))}
      </div>

      <div className="space-y-6">
        <AnimatePresence mode="wait">
          {searchQuery || activeFilter !== 'all' ? (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-3"
              key="filtered"
            >
              <div className="flex items-center justify-between gap-2">
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                  {searchQuery ? 'Resultado da Busca' : categories[activeFilter as keyof typeof categories]?.label}
                </p>
              </div>
              <div className="flex flex-wrap gap-2.5 md:gap-3" role="list" ref={filteredRef}>
                {filteredTags && filteredTags.length ? filteredTags.map((tag, i) => (
                  <div key={tag.slug} role="listitem">
                    <TagBubble 
                      tag={tag} 
                      index={i} 
                      tabIndex={filteredActiveIndex === i ? 0 : -1}
                      onKeyDown={(e) => handleFilteredKeyDown(e, i)}
                      profileId={profileId}
                      searchMode={searchMode}
                    />
                  </div>
                )) : (
                  <p className="text-[11px] text-muted-foreground/50 italic px-2">Nenhum tema encontrado no Nexus.</p>
                )}
              </div>
            </motion.div>
          ) : (
            <div key="default" className="space-y-6">
              {profileId && profileSuggestedTags.length > 0 && (
                <motion.div 
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="space-y-4 p-6 rounded-[2.5rem] bg-gradient-to-br from-secondary/5 via-card to-primary/5 border border-secondary/10 shadow-sm relative overflow-hidden"
                >
                  <div className="absolute top-0 right-0 w-32 h-32 bg-secondary/10 rounded-full blur-3xl -mr-12 -mt-12" />
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded-full bg-secondary/10 flex items-center justify-center">
                      <Heart className="w-3.5 h-3.5 text-secondary" />
                    </div>
                    <span className="text-[11px] font-black uppercase tracking-widest text-secondary/80">
                      Sugeridos para sua Jornada
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2.5 md:gap-3" role="list" ref={suggestedRef}>
                    {profileSuggestedTags.map((tag, i) => (
                      <div key={tag.slug} role="listitem">
                        <TagBubble 
                          tag={tag} 
                          index={i} 
                          isSuggested 
                          tabIndex={suggestedActiveIndex === i ? 0 : -1}
                          onKeyDown={(e) => handleSuggestedKeyDown(e, i)}
                          profileId={profileId}
                          searchMode={searchMode}
                        />
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}

              <div className="grid grid-cols-1 gap-10">
                {Object.entries(categories).map(([key, category]) => {
                  const categoryTags = tags.filter(t => t.category?.toLowerCase() === key.toLowerCase());
                  if (categoryTags.length === 0) return null;

                  return (
                    <motion.div key={key} layout className="space-y-4">
                      <button
                        onClick={() => setExpandedCategory(expandedCategory === key ? null : key)}
                        className="flex items-center gap-3 group w-full"
                      >
                        <div className="w-8 h-8 rounded-lg bg-muted/30 flex items-center justify-center group-hover:bg-primary/10 transition-colors">
                          {category.icon}
                        </div>
                        <span className="text-[11px] font-black uppercase tracking-widest text-foreground/80 group-hover:text-primary transition-colors">
                          {category.label}
                        </span>
                        <div className="h-px flex-1 bg-border/20 mx-2" />
                        <span className="text-[9px] font-black text-muted-foreground/30 uppercase tracking-widest">{categoryTags.length} temas</span>
                      </button>
                      <div className="flex flex-wrap gap-2.5 md:gap-3" role="list">
                        {categoryTags.slice(0, expandedCategory === key ? 100 : 8).map((tag, i) => (
                          <div key={tag.slug} role="listitem">
                            <TagBubble tag={tag} index={i} profileId={profileId} searchMode={searchMode} />
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default NexusBubbles;
