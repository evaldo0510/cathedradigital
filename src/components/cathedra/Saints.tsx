import React, { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import SEOHead from '@/components/SEOHead';
import { Icons } from '../../constants';
import StaggeredList from './StaggeredList';
import SacredImage from './SacredImage';
import { SaintCardSkeleton, SaintGridSkeleton } from './SacredSkeleton';
import SaintDetail, { CATEGORY_LABELS } from './SaintDetail';
import { type Saint } from '@/data/saints';
import { getSaintsByDate, searchSaints, getSaintsByCategory, getAllSaints, formatSaint, type SaintWithScore } from '@/services/saintsService';
import { supabase } from '@/integrations/supabase/client';
import { useDebounce } from '@/hooks/useDebounce';
import { Search, X, Calendar as CalendarIcon, ChevronLeft, ChevronRight, Sparkles, BookOpen, Quote, Shield, Target, Loader2 } from 'lucide-react';
import { scoreToTone } from '@/lib/similarity';
import { Button } from '@/components/ui/button';
import { format, addDays, subDays, isSameDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const Saints = React.forwardRef<HTMLDivElement>((_props, ref) => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedSaint, setSelectedSaint] = useState<Saint | null>(null);
  const [autoReflect, setAutoReflect] = useState(false);
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState<'daily' | 'search' | 'all' | 'writers' | 'popes'>('daily');
  const [isSearchingGlobal, setIsSearchingGlobal] = useState(false);
  const [globalResults, setGlobalResults] = useState<Saint[]>([]);
  const [searchParams, setSearchParams] = useSearchParams();

  // ─── Queries ───
  
  // Official Saint of the Day (Scraped/Fetched from Edge Function)
  const { data: officialSaint } = useQuery({
    queryKey: ['official-saint'],
    queryFn: async () => {
      const cacheKey = `official_saint_${format(new Date(), 'yyyy-MM-dd')}`;
      const cached = localStorage.getItem(cacheKey);
      if (cached) return JSON.parse(cached);

      const response = await supabase.functions.invoke('saint-of-the-day');
      if (response.data && !response.error) {
        localStorage.setItem(cacheKey, JSON.stringify(response.data));
        return response.data;
      }
      return null;
    },
    staleTime: 1000 * 60 * 60 * 24, // 24 hours
  });

  // Daily Saints from Database
  const { data: localSaints = [], isLoading: isLoadingDaily } = useQuery({
    queryKey: ['saints-date', selectedDate.getMonth() + 1, selectedDate.getDate()],
    queryFn: () => getSaintsByDate(selectedDate.getMonth() + 1, selectedDate.getDate()),
    enabled: viewMode === 'daily',
  });

  // Mode-based Saints (Writers, Popes, All)
  const { data: modeSaints = [], isLoading: isLoadingMode } = useQuery({
    queryKey: ['saints-mode', viewMode],
    queryFn: async () => {
      if (viewMode === 'writers') return getSaintsByCategory('doctor');
      if (viewMode === 'popes') return getSaintsByCategory('pope');
      if (viewMode === 'all') return getAllSaints(100);
      return [];
    },
    enabled: ['writers', 'popes', 'all'].includes(viewMode),
  });

  // Debounced search to avoid one DB hit per keystroke
  const debouncedSearch = useDebounce(search, 300);

  // Search results
  const { data: searchResults = [], isLoading: isSearchingLocal } = useQuery({
    queryKey: ['saints-search', debouncedSearch],
    queryFn: () => searchSaints(debouncedSearch),
    enabled: viewMode === 'search' && debouncedSearch.trim().length >= 2,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  const handleGlobalSearch = async (query: string) => {
    if (!query.trim()) return;
    setIsSearchingGlobal(true);
    setGlobalResults([]);
    try {
      const response = await supabase.functions.invoke('search-saint', {
        body: { name: query }
      });
      if (response.data && !response.data.error) {
        setGlobalResults([response.data]);
      }
    } catch (err) {
      console.error('Global search error:', err);
    } finally {
      setIsSearchingGlobal(false);
    }
  };

  const handleOpenSaint = (saint: Saint, shouldReflect: boolean = false) => {
    setAutoReflect(shouldReflect);
    setSelectedSaint(saint);
  };

  const saintsForSelectedDate = useMemo(() => {
    const dailyList = localSaints;
    if (officialSaint && officialSaint.name && isSameDay(selectedDate, new Date()) && 
        officialSaint.name !== "Menu" && officialSaint.name !== "Santo do Dia") {
      
      const officialName = officialSaint.name.toLowerCase();
      const match = dailyList.find(s => 
        officialName.includes(s.name.toLowerCase()) ||
        s.name.toLowerCase().includes(officialName)
      );
      
      if (match) {
        return dailyList.map(s => s.id === match.id ? { 
          ...s, 
          ...officialSaint, 
          fullBio: officialSaint.fullBio || s.fullBio, 
          works: (officialSaint.writings || []).length > 0 ? (officialSaint.writings || []).map((w: string) => ({ title: w })) : s.works 
        } : s);
      } else {
        return [
          {
            id: 'official-today',
            name: officialSaint.name,
            title: 'Santo do Dia',
            bio: officialSaint.description || '',
            fullBio: officialSaint.fullBio || officialSaint.description || '',
            image: officialSaint.image,
            url: officialSaint.url,
            category: 'confessor' as const,
            works: (officialSaint.writings || []).map((w: string) => ({ title: w })),
            quotes: officialSaint.writings || [],
            feastDay: format(selectedDate, "dd 'de' MMMM"),
            feastMonth: selectedDate.getMonth() + 1,
            feastDayNum: selectedDate.getDate(),
            born: officialSaint.born || '',
            died: officialSaint.died || '',
            patronOf: [],
            virtues: []
          },
          ...dailyList
        ];
      }
    }
    return dailyList;
  }, [selectedDate, officialSaint, localSaints]);

  useEffect(() => {
    const action = searchParams.get('action');
    if (action === 'reflect' && saintsForSelectedDate.length > 0) {
      handleOpenSaint(saintsForSelectedDate[0], true);
    }
  }, [searchParams, saintsForSelectedDate]);

  const dateStrip = useMemo(() => {
    return Array.from({ length: 7 }).map((_, i) => addDays(subDays(selectedDate, 3), i));
  }, [selectedDate]);

  const displaySaints = viewMode === 'daily' ? saintsForSelectedDate : modeSaints;

  return (
    <>
      <SEOHead 
        title="Santo do Dia - Calendário de Santos" 
        description="Conheça o santo do dia, sua história, virtudes e ensinamentos. Um calendário completo de santidade para cada dia do ano." 
        path="/saints" 
        keywords="santo do dia, calendário litúrgico, vida dos santos, catolicismo, oração dos santos"
        breadcrumbs={[{ name: "Início", path: "/" }, { name: "Santos", path: "/saints" }]} 
      />

      <div ref={ref} className="space-y-10 pb-20">
        <header className="text-center space-y-4">
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-3 py-1 bg-primary/10 rounded-full text-primary border border-primary/20"
          >
            <CalendarIcon className="w-3 h-3" />
            <span className="text-[10px] font-black uppercase tracking-[0.2em]">Sanctorum Pro</span>
          </motion.div>
          <h1 className="text-4xl md:text-6xl font-serif font-bold text-foreground">Santos</h1>
          <p className="text-muted-foreground font-serif italic max-w-xl mx-auto">
            "Sede santos, porque eu, o Senhor vosso Deus, sou santo." — Levítico 19,2
          </p>
        </header>

        <div className="flex justify-center overflow-x-auto pb-4 no-scrollbar">
          <div className="bg-secondary/50 p-1 rounded-2xl flex gap-1 min-w-max">
            {(['daily', 'all', 'writers', 'popes', 'search'] as const).map(mode => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className={`px-4 md:px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                  viewMode === mode ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {mode === 'daily' ? 'Hoje' : mode === 'all' ? 'Todos' : mode === 'writers' ? 'Escritores' : mode === 'popes' ? 'Papas' : 'Buscar'}
              </button>
            ))}
          </div>
        </div>

        <AnimatePresence mode="wait">
          {viewMode === 'daily' ? (
            <motion.div
              key="daily"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-8"
            >
              <div className="flex flex-col items-center gap-6">
                <div className="flex items-center gap-4 md:gap-8">
                  <button 
                    onClick={() => setSelectedDate(subDays(selectedDate, 1))}
                    className="p-3 bg-card border border-border rounded-full hover:bg-primary/5 hover:border-primary/30 transition-all text-muted-foreground hover:text-primary"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  
                  <div className="text-center min-w-[200px]">
                    <h2 className="text-2xl font-serif font-bold text-foreground">
                      {format(selectedDate, "dd 'de' MMMM", { locale: ptBR })}
                    </h2>
                    <p className="text-[10px] font-black uppercase tracking-widest text-primary mt-1">
                      {format(selectedDate, "EEEE", { locale: ptBR })}
                    </p>
                  </div>

                  <button 
                    onClick={() => setSelectedDate(addDays(selectedDate, 1))}
                    className="p-3 bg-card border border-border rounded-full hover:bg-primary/5 hover:border-primary/30 transition-all text-muted-foreground hover:text-primary"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>

                <div className="flex gap-2 overflow-x-auto pb-2 px-4 max-w-full no-scrollbar">
                  {dateStrip.map((date, i) => (
                    <button
                      key={i}
                      onClick={() => setSelectedDate(date)}
                      className={`flex flex-col items-center justify-center min-w-[56px] h-20 rounded-2xl border transition-all ${
                        isSameDay(date, selectedDate)
                          ? 'bg-primary border-primary text-primary-foreground shadow-lg shadow-primary/20 scale-110'
                          : 'bg-card border-border text-muted-foreground hover:border-primary/30 hover:text-primary'
                      }`}
                    >
                      <span className="text-[9px] font-black uppercase tracking-tighter mb-1">
                        {format(date, "EEE", { locale: ptBR }).replace('.', '')}
                      </span>
                      <span className="text-lg font-serif font-bold">{format(date, "dd")}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="max-w-4xl mx-auto space-y-6">
                {isLoadingDaily ? (
                  <SaintCardSkeleton />
                ) : displaySaints.length > 0 ? (
                  displaySaints.map(saint => (
                    <motion.div
                      key={saint.id}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="group relative bg-card border border-border rounded-[2.5rem] overflow-hidden hover:border-primary/30 transition-all shadow-xl"
                    >
                      <div className="flex flex-col md:flex-row h-full">
                        <div className="w-full md:w-1/3 h-64 md:h-auto relative">
                          <SacredImage 
                            src={saint.image} 
                            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" 
                            alt={saint.name} 
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                          <div className="absolute bottom-6 left-6 right-6 text-white">
                            <span className="text-[10px] font-black uppercase tracking-widest bg-primary px-2 py-1 rounded-md mb-2 inline-block">
                              {CATEGORY_LABELS[saint.category] || saint.category}
                            </span>
                            <h3 className="text-2xl font-serif font-bold">{saint.name}</h3>
                          </div>
                        </div>

                        <div className="flex-1 p-8 space-y-6">
                          <div>
                            <p className="text-lg text-primary font-serif italic mb-4">"{saint.title}"</p>
                            <p className="text-muted-foreground leading-relaxed line-clamp-4 font-serif italic">
                              {saint.bio}
                            </p>
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                              <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground block">Virtude Principal</span>
                              <div className="flex flex-wrap gap-1">
                                {saint.virtues?.slice(0, 1).map(v => (
                                  <span key={v} className="px-2 py-1 bg-primary/10 text-primary text-[10px] font-black uppercase rounded-lg">{v}</span>
                                ))}
                              </div>
                            </div>
                            <div className="space-y-1 text-right">
                              <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground block">Padroeiro(a)</span>
                              <p className="text-xs font-bold text-foreground truncate">{saint.patronOf?.[0] || '—'}</p>
                            </div>
                          </div>

                          <div className="flex flex-col gap-3">
                            <button
                              onClick={() => handleOpenSaint(saint, false)}
                              className="w-full py-4 bg-secondary text-secondary-foreground rounded-2xl text-[10px] font-black uppercase tracking-widest hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                            >
                              <BookOpen className="w-4 h-4" />
                              Conhecer História
                            </button>

                            <button
                              onClick={() => handleOpenSaint(saint, true)}
                              className="w-full py-4 bg-primary text-primary-foreground rounded-2xl text-[10px] font-black uppercase tracking-widest hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 shadow-lg shadow-primary/20 group"
                            >
                              <Sparkles className="w-4 h-4 group-hover:rotate-12 transition-transform" />
                              Refletir com Logos
                            </button>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))
                ) : (
                  <div className="text-center py-20 bg-muted/20 rounded-[2.5rem] border border-dashed border-border space-y-4">
                    <Icons.Star className="w-12 h-12 text-muted-foreground/30 mx-auto" />
                    <div className="space-y-2">
                      <p className="text-lg font-serif italic text-muted-foreground">O céu está repleto de heróis silenciosos.</p>
                      <p className="text-xs text-muted-foreground/60 max-w-xs mx-auto">
                        Embora não tenhamos um santo específico catalogado para hoje em nossa base, milhares de almas celebram na glória de Deus.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          ) : viewMode === 'search' ? (
            <motion.div
              key="search"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-8"
            >
              <div className="max-w-2xl mx-auto relative px-4">
                <Search className="absolute left-10 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <input
                  type="text"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Buscar santo por nome, título ou padroado…"
                  className="w-full pl-14 pr-14 py-5 bg-card border border-border rounded-full text-base text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-4 focus:ring-primary/10 transition-all shadow-sm"
                />
                {search && (
                  <button 
                    onClick={() => setSearch('')} 
                    className="absolute right-10 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                )}
                {/* Subtle indicator while debounce is pending or query is in flight */}
                {search.trim().length >= 2 && (search !== debouncedSearch || isSearchingLocal) && (
                  <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                    <Loader2 className="w-3 h-3 animate-spin" />
                    Buscando…
                  </div>
                )}
              </div>

              <div className="max-w-5xl mx-auto px-4">
                {isLoadingDaily || isSearchingLocal ? (
                  <SaintGridSkeleton count={6} />
                ) : search.trim() ? (
                  <>
                    {(searchResults.length > 0 || globalResults.length > 0) ? (
                      <StaggeredList className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {searchResults.map(saint => (
                          <SaintCard key={saint.id} saint={saint} onClick={() => handleOpenSaint(saint, false)} />
                        ))}
                        {globalResults.map(saint => (
                          <SaintCard key={saint.id} saint={saint} onClick={() => handleOpenSaint(saint, false)} />
                        ))}
                      </StaggeredList>
                    ) : null}

                    {searchResults.length === 0 && !isSearchingGlobal && globalResults.length === 0 && (
                      <div className="text-center py-20 space-y-6">
                        <p className="text-muted-foreground font-serif italic">
                          Nenhum santo encontrado em nossa base local.
                        </p>
                        <Button 
                          onClick={() => handleGlobalSearch(search)}
                          className="bg-primary hover:bg-primary/90 text-primary-foreground font-black text-xs uppercase tracking-widest h-12 px-8 rounded-2xl shadow-lg shadow-primary/20 flex items-center gap-3 mx-auto"
                        >
                          <Sparkles className="w-4 h-4" />
                          Buscar na Biblioteca Universal
                        </Button>
                      </div>
                    )}

                    {isSearchingGlobal && (
                      <div className="text-center py-20 space-y-4">
                        <Sparkles className="w-10 h-10 text-primary animate-pulse mx-auto" />
                        <p className="text-sm text-muted-foreground animate-pulse">Consultando hagiografias históricas...</p>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="text-center py-20 text-muted-foreground font-serif italic">
                    Digite o nome de um santo para buscar em nossa base ou na biblioteca universal.
                  </div>
                )}
              </div>
            </motion.div>
          ) : (
            <motion.div
              key={viewMode}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-8"
            >
              <div className="text-center space-y-4 max-w-2xl mx-auto px-4">
                <h2 className="text-2xl font-serif font-bold">
                  {viewMode === 'writers' ? 'Doutores e Escritores' : viewMode === 'popes' ? 'Sucessores de Pedro' : 'Base Sanctorum'}
                </h2>
                <p className="text-sm text-muted-foreground italic">
                  {viewMode === 'writers' ? '"A pena é a língua da alma..."' : viewMode === 'popes' ? '"Tu és Pedro..."' : 'Exibindo registros catalogados.'}
                </p>
              </div>
              <div className="max-w-5xl mx-auto px-4">
                {isLoadingMode ? (
                  <div className="flex justify-center py-20"><Icons.Cross className="w-10 h-10 animate-spin opacity-20" /></div>
                ) : (
                  <StaggeredList className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {modeSaints.map(saint => (
                      <SaintCard key={saint.id} saint={saint} onClick={() => handleOpenSaint(saint, false)} />
                    ))}
                  </StaggeredList>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {selectedSaint && (
            <SaintDetail 
              saint={selectedSaint} 
              onClose={() => setSelectedSaint(null)} 
              autoReflect={autoReflect}
            />
          )}
        </AnimatePresence>
      </div>
    </>
  );
});

Saints.displayName = 'Saints';

const SaintCard: React.FC<{ saint: SaintWithScore; onClick: () => void }> = ({ saint, onClick }) => {
  const tone = scoreToTone(saint.similarityScore);

  return (
    <button
      onClick={onClick}
      className="group bg-card border border-border rounded-[2rem] overflow-hidden hover:border-primary/50 hover:shadow-2xl hover:-translate-y-1 transition-all duration-500 text-left flex flex-col h-full"
    >
      <div className="relative h-48 overflow-hidden">
        <SacredImage 
          src={saint.image || ''} 
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
          alt={saint.name} 
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
        <div className="absolute bottom-4 left-6 flex items-center gap-2">
          <span className="text-[10px] font-black uppercase tracking-widest text-white/90 bg-primary/80 px-2 py-0.5 rounded-md backdrop-blur-sm">
            {CATEGORY_LABELS[saint.category] || saint.category}
          </span>
        </div>
        {tone && (
          <div
            title={`Relevância: ${tone.pct}%`}
            className={`absolute top-3 right-3 flex items-center gap-1 px-2 py-0.5 rounded-full border text-[9px] font-black uppercase tracking-widest backdrop-blur-sm ${tone.classes}`}
          >
            <Target className="w-2.5 h-2.5" />
            {tone.pct}%
          </div>
        )}
      </div>
      
      <div className="flex-1 p-6 space-y-4">
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-black uppercase tracking-widest text-primary">{saint.feastDay}</span>
            {saint.works && saint.works.length > 0 && (
              <div className="p-1 bg-primary/5 rounded-lg text-primary" title="Possui obras escritas">
                <BookOpen className="w-3 h-3" />
              </div>
            )}
          </div>
          <h3 className="text-xl font-serif font-bold text-foreground group-hover:text-primary transition-colors line-clamp-1">{saint.name}</h3>
          <p className="text-xs text-muted-foreground font-serif italic line-clamp-1">{saint.title}</p>
        </div>
        
        <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">{saint.bio}</p>
        
        <div className="flex flex-wrap gap-1 mt-auto">
          {saint.virtues?.slice(0, 2).map(v => (
            <span key={v} className="px-2 py-0.5 bg-primary/5 text-primary text-[8px] font-black uppercase rounded-lg border border-primary/10">{v}</span>
          ))}
        </div>
      </div>
    </button>
  );
};

export default Saints;