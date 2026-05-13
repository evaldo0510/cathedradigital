import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { getSpiritualInsight } from '@/services/aiService';
import { useNavigate } from 'react-router-dom';
import { normalizeText } from '@/lib/utils';
import { fetchNexusTagContent, type TagContent, exportNexusLogs } from '@/lib/nexusContent';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { AppRoute } from '@/types';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, ExternalLink, Sparkles, Search, X, Heart, Church, Flame, BookOpen, Shield, Compass, Hash, Filter, AlertCircle, Info, Timer, FileJson, Download as DownloadIcon } from 'lucide-react';
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
      <PopoverContent data-testid="nexus-popover" className="w-[340px] sm:w-[420px] p-0 rounded-[2.5rem] border-primary/20 overflow-hidden shadow-2xl z-[100] backdrop-blur-2xl bg-card/90">
        <div className="bg-gradient-to-r from-primary/15 via-primary/5 to-transparent p-6 border-b border-border/40 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-white/50 dark:bg-black/20 flex items-center justify-center shadow-inner text-primary border border-primary/10">
              {getTagIcon(tag.emoji, "w-6 h-6")}
            </div>
            <div>
              <span className="text-[10px] font-black uppercase tracking-[0.3em] text-primary/60">{tag.category}</span>
              <h4 className="text-sm font-black uppercase tracking-widest text-primary leading-tight">{tag.label}</h4>
            </div>
          </div>
          <button 
            onClick={() => navigate(`${AppRoute.TEMAS}/${tag.slug}`)}
            className="w-10 h-10 rounded-2xl bg-primary text-primary-foreground hover:scale-110 active:scale-95 transition-all flex items-center justify-center shadow-lg shadow-primary/20 group"
            title="Estudo Completo"
          >
            <ExternalLink className="w-4 h-4 group-hover:rotate-12 transition-transform" />
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
                      <Icons.FileJson className="w-2.5 h-2.5 mr-1" />
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
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-secondary/5 rounded-2xl p-4 border border-secondary/10 relative overflow-hidden group"
                >
                  <div className="absolute top-0 right-0 w-16 h-16 bg-secondary/5 rounded-full blur-2xl -mr-6 -mt-6" />
                  <div className="flex items-center gap-2 mb-2">
                    <Sparkles className="w-3.5 h-3.5 text-secondary" />
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-secondary">Logos Insight</span>
                  </div>
                  <p className="text-[12px] text-foreground/90 leading-relaxed italic font-serif">
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
                                className="space-y-1.5 group/content p-2 rounded-xl hover:bg-primary/5 transition-colors cursor-pointer"
                                onClick={() => link && navigate(link)}
                              >
                                <p className="text-[11px] leading-relaxed text-foreground/80 line-clamp-3 group-hover/content:text-foreground transition-colors">
                                  {c.content_text}
                                </p>
                                <div className="flex flex-col gap-2">
                                  <div className="flex items-center justify-between">
                                    <span className="text-[10px] font-bold text-primary flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-primary/5">
                                      {reference}
                                      {link && <ExternalLink className="w-2.5 h-2.5" />}
                                    </span>
                                  </div>
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
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-border/40 pb-4">
        <div className="flex flex-col text-center sm:text-left">
          <span className="text-[10px] font-black uppercase tracking-[0.4em] text-primary/70">
            Nexus Theologicus
          </span>
          <span className="text-[10px] text-muted-foreground/60 font-medium italic mt-0.5">Clique nas bolhas para conexões teológicas</span>
        </div>
        
        <div className="flex flex-col md:flex-row items-center gap-3">
          <div className="flex items-center p-1 bg-muted/40 rounded-xl border border-border/40">
            {[
              { id: 'tags', label: 'Tags', icon: <Hash className="w-3 h-3" /> },
              { id: 'title', label: 'Título', icon: <BookOpen className="w-3 h-3" /> },
              { id: 'reference', label: 'Ref', icon: <Compass className="w-3 h-3" /> },
              { id: 'text', label: 'Texto', icon: <Search className="w-3 h-3" /> },
              { id: 'all', label: 'Tudo', icon: <Filter className="w-3 h-3" /> },
            ].map((mode) => (
              <button
                key={mode.id}
                onClick={() => setSearchMode(mode.id as NexusSearchMode)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[8px] font-black uppercase tracking-widest transition-all ${
                  searchMode === mode.id 
                    ? 'bg-primary text-primary-foreground shadow-md shadow-primary/20' 
                    : 'text-muted-foreground/60 hover:text-primary hover:bg-primary/5'
                }`}
              >
                {mode.icon}
                <span className="hidden sm:inline">{mode.label}</span>
              </button>
            ))}
          </div>

          <div className="relative group/search w-full md:w-[200px]">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground/60 transition-colors group-focus-within/search:text-primary" />
            <input 
              type="text"
              placeholder="Filtrar temas..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-8 pl-8 pr-8 bg-card/50 border border-border/50 rounded-full text-[10px] focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all"
              aria-label="Buscar tema no Nexus"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 hover:bg-muted rounded-full"
              >
                <X className="w-2.5 h-2.5 text-muted-foreground" />
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-none">
        <button
          onClick={() => setActiveFilter('all')}
          className={`px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${activeFilter === 'all' ? 'bg-primary text-primary-foreground shadow-lg' : 'bg-muted/50 text-muted-foreground hover:bg-muted'}`}
        >
          Todos
        </button>

        {Object.entries(categories).map(([key, cat]) => (
          <button
            key={key}
            onClick={() => setActiveFilter(key)}
            className={`px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-1.5 ${activeFilter === key ? 'bg-primary text-primary-foreground shadow-lg' : 'bg-muted/50 text-muted-foreground hover:bg-muted'}`}
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
              <div className="flex flex-wrap gap-1.5" role="list" ref={filteredRef}>
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
                  <p className="text-[10px] text-muted-foreground italic">Nenhum tema encontrado.</p>
                )}
              </div>
            </motion.div>
          ) : (
            <div key="default" className="space-y-6">
              {profileId && profileSuggestedTags.length > 0 && (
                <motion.div 
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="space-y-2.5 p-4 rounded-[2rem] bg-gradient-to-br from-secondary/10 via-card to-primary/5 border border-secondary/20 shadow-sm relative overflow-hidden"
                >
                  <div className="absolute top-0 right-0 w-24 h-24 bg-secondary/5 rounded-full blur-2xl -mr-8 -mt-8" />
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded-full bg-secondary/20 flex items-center justify-center">
                      <Heart className="w-3 h-3 text-secondary" />
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-secondary">
                      Sugeridos para sua Jornada
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1.5" role="list" ref={suggestedRef}>
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

              <div className="grid grid-cols-1 gap-5">
                {Object.entries(categories).map(([key, category]) => {
                  const categoryTags = tags.filter(t => t.category?.toLowerCase() === key.toLowerCase());
                  if (categoryTags.length === 0) return null;

                  return (
                    <motion.div key={key} layout className="space-y-2.5">
                      <button
                        onClick={() => setExpandedCategory(expandedCategory === key ? null : key)}
                        className="flex items-center gap-1.5 group w-full"
                      >
                        {category.icon}
                        <span className="text-[10px] font-black uppercase tracking-widest text-foreground group-hover:text-primary transition-colors">
                          {category.label}
                        </span>
                        <div className="h-px flex-1 bg-border/40" />
                        <span className="text-[8px] font-black text-muted-foreground/40">{categoryTags.length} temas</span>
                      </button>
                      <div className="flex flex-wrap gap-1.5" role="list">
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
