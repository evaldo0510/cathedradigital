import React, { useState, useMemo, useEffect } from 'react';
import { useSearchParams, useParams } from 'react-router-dom';
import { useOfficialSaint } from '@/hooks/useSaints';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import SEOHead from '@/components/SEOHead';
import { Icons } from '../../constants';
import StaggeredList from './StaggeredList';
import SacredImage from './SacredImage';
import { SaintCardSkeleton, SaintGridSkeleton } from './SacredSkeleton';
import SaintDetail, { CATEGORY_LABELS } from './SaintDetail';
import { type Saint } from '@/data/saints';
import { getSaintsByDate, searchSaints, getSaintsByCategory, getAllSaints, getSaintById, formatSaint, type SaintWithScore } from '@/services/saintsService';
import { supabase } from '@/integrations/supabase/client';
import { useDebounce } from '@/hooks/useDebounce';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Sparkles, BookOpen, Quote, Shield, User } from 'lucide-react';
import { RelevanceBadge } from './RelevanceBadge';
import { FuzzySearchInput } from './FuzzySearchInput';
import { SearchResultCard } from './SearchResultCard';
import { Button } from '@/components/ui/button';
import { BubbleTag, getTagIcon } from './BubbleTag';
import { format, addDays, subDays, isSameDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';
import { getTabProps, getTabPanelProps, useTabNavigation } from './TabUtils';



const Saints = React.forwardRef<HTMLDivElement>((_props, ref) => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedSaint, setSelectedSaint] = useState<Saint | null>(null);
  const [autoReflect, setAutoReflect] = useState(false);
  const [search, setSearch] = useState('');
  const { handleKeyDown: handleTabKeyDown } = useTabNavigation();
  const [viewMode, setViewMode] = useState<'daily' | 'search' | 'all' | 'writers' | 'popes' | 'cloud'>('daily');
  const viewModes = ['daily', 'all', 'writers', 'popes', 'cloud', 'search'] as const;
  const [isSearchingGlobal, setIsSearchingGlobal] = useState(false);
  const [globalResults, setGlobalResults] = useState<Saint[]>([]);
  const [searchParams, setSearchParams] = useSearchParams();
  const { id } = useParams();

  useEffect(() => {
    if (id) {
      getSaintById(id).then(saint => {
        if (saint) setSelectedSaint(saint);
      });
    }
  }, [id]);

  // ─── Queries ───
  
  const { data: officialSaint } = useOfficialSaint();

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
      if (viewMode === 'all' || viewMode === 'cloud') return getAllSaints(100);
      return [];
    },
    enabled: ['writers', 'popes', 'all', 'cloud'].includes(viewMode),
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
      toast.error('Erro na busca global', { description: 'Não foi possível encontrar o santo no momento.' });
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
      <script type="application/ld+json">
        {JSON.stringify({
          "@context": "https://schema.org",
          "@type": "CollectionPage",
          "name": "Calendário de Santos",
          "description": "Lista de santos e beatos da Igreja Católica organizados por data litúrgica.",
          "publisher": {
            "@type": "Organization",
            "name": "Cathedra Digital"
          }
        })}
      </script>

      <div ref={ref} className="space-y-xl pb-3xl">
        <header className="text-center space-y-md">
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-xs px-sm py-2xs bg-primary/10 rounded-full text-primary border border-primary/20"
          >
            <CalendarIcon className="w-sm h-sm" />
            <span className="text-xs font-black uppercase tracking-[0.2em]">Sanctorum Pro</span>
          </motion.div>
          <h1 className="text-4xl md:text-6xl font-serif font-bold text-foreground">Santos</h1>
          <p className="text-muted-foreground font-serif italic max-w-xl mx-auto">
            "Sede santos, porque eu, o Senhor vosso Deus, sou santo." — Levítico 19,2
          </p>
        </header>

        <div className="flex justify-center overflow-x-auto pb-md no-scrollbar">
          <div className="bg-secondary/50 p-2xs rounded-premium flex gap-2xs min-w-max" role="tablist" aria-label="Modos de visualização dos santos">
            {viewModes.map((mode, idx) => (
              <Button
                key={mode}
                {...getTabProps(`tab-${mode}`, `panel-${mode}`, viewMode === mode, `px-md md:px-lg py-xs rounded-full text-xs font-black uppercase tracking-widest transition-all focus-visible:ring-2 focus-visible:ring-primary outline-none ${
                  viewMode === mode ? 'bg-background text-foreground shadow-md' : 'text-muted-foreground hover:text-foreground'
                }`)}
                onClick={() => setViewMode(mode)}
                onKeyDown={(e) => handleTabKeyDown(e, idx, viewModes.length, (newIdx) => setViewMode(viewModes[newIdx]), 'tab-')}
              >
                {mode === 'daily' ? 'Hoje' : mode === 'all' ? 'Todos' : mode === 'writers' ? 'Escritores' : mode === 'popes' ? 'Papas' : mode === 'cloud' ? 'Nuvem' : 'Buscar'}
              </Button>
            ))}
          </div>

        </div>

        <AnimatePresence mode="wait">
          {viewMode === 'daily' ? (
              <motion.div
                key="daily"
                {...getTabPanelProps('panel-daily', 'tab-daily', viewMode === 'daily', "space-y-xl outline-none")}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
              >
              <div className="flex flex-col items-center gap-lg">
                <div className="flex items-center gap-md md:gap-xl">
                  <Button 
                    onClick={() => setSelectedDate(subDays(selectedDate, 1))}
                    className="p-sm bg-card border border-border rounded-full hover:bg-primary/5 hover:border-primary/30 transition-all text-muted-foreground hover:text-primary"
                    aria-label="Dia anterior"
                  >
                    <ChevronLeft className="w-md h-md" />
                  </Button>
                  
                  <div className="text-center min-w-[200px]">
                    <h2 className="text-2xl font-serif font-bold text-foreground">
                      {format(selectedDate, "dd 'de' MMMM", { locale: ptBR })}
                    </h2>
                    <p className="text-xs font-black uppercase tracking-widest text-primary mt-2xs">
                      {format(selectedDate, "EEEE", { locale: ptBR })}
                    </p>
                  </div>

                  <Button 
                    onClick={() => setSelectedDate(addDays(selectedDate, 1))}
                    className="p-sm bg-card border border-border rounded-full hover:bg-primary/5 hover:border-primary/30 transition-all text-muted-foreground hover:text-primary"
                    aria-label="Próximo dia"
                  >
                    <ChevronRight className="w-md h-md" />
                  </Button>
                </div>

                <div className="flex gap-xs overflow-x-auto pb-xs px-md max-w-full no-scrollbar">
                  {dateStrip.map((date, i) => (
                    <Button
                      key={i}
                      onClick={() => setSelectedDate(date)}
                      className={`flex flex-col items-center justify-center min-w-[56px] h-3xl rounded-full border transition-all ${
                        isSameDay(date, selectedDate)
                          ? 'bg-primary border-primary text-primary-foreground shadow-premium shadow-primary/20 scale-110'
                          : 'bg-card border-border text-muted-foreground hover:border-primary/30 hover:text-primary'
                      }`}
                      aria-label={format(date, "dd 'de' MMMM", { locale: ptBR })}
                      aria-pressed={isSameDay(date, selectedDate)}
                    >
                      <span className="text-xs font-black uppercase tracking-tighter mb-2xs">
                        {format(date, "EEE", { locale: ptBR }).replace('.', '')}
                      </span>
                      <span className="text-lg font-serif font-bold">{format(date, "dd")}</span>
                    </Button>
                  ))}
                </div>
              </div>

              <div className="max-w-4xl mx-auto space-y-lg">
                {isLoadingDaily ? (
                  <SaintCardSkeleton />
                ) : displaySaints.length > 0 ? (
                  displaySaints.map(saint => (
                    <motion.div
                      key={saint.id}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="premium-card overflow-hidden group relative transition-all"
                    >
                      <div className="flex flex-col md:flex-row h-full">
                        <div className="w-full md:w-2xs/3 h-4xl md:h-auto relative">
                          <SacredImage 
                            src={saint.image} 
                            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" 
                            alt={saint.name} 
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                          <div className="absolute bottom-lg left-lg right-lg text-white">
                            <span className="text-xs font-black uppercase tracking-widest bg-primary px-xs py-2xs rounded-full mb-xs inline-block">
                              {CATEGORY_LABELS[saint.category] || saint.category}
                            </span>
                            <h3 className="text-2xl font-serif font-bold">{saint.name}</h3>
                          </div>
                        </div>

                        <div className="flex-1 p-xl space-y-lg">
                          <div>
                            <p className="text-lg text-primary font-serif italic mb-md">"{saint.title}"</p>
                            <p className="text-muted-foreground leading-relaxed line-clamp-4 font-serif italic">
                              {saint.bio}
                            </p>
                          </div>

                          <div className="grid grid-cols-2 gap-md">
                            <div className="space-y-2xs">
                              <span className="text-xs font-black uppercase tracking-widest text-muted-foreground block">Virtude Principal</span>
                              <div className="flex flex-wrap gap-2xs">
                                {saint.virtues?.slice(0, 1).map(v => (
                                  <span key={v} className="px-xs py-2xs bg-primary/10 text-primary text-xs font-black uppercase rounded-full">{v}</span>
                                ))}
                              </div>
                            </div>
                            <div className="space-y-2xs text-right">
                              <span className="text-xs font-black uppercase tracking-widest text-muted-foreground block">Padroeiro(a)</span>
                              <p className="text-xs font-bold text-foreground truncate">{saint.patronOf?.[0] || '—'}</p>
                            </div>
                          </div>

                          <div className="flex flex-col gap-sm">
                            <Button
                              onClick={() => handleOpenSaint(saint, false)}
                              variant="secondary"
                              className="w-full"
                            >
                              <BookOpen className="w-md h-md" />
                              Conhecer História
                            </Button>

                            <Button
                              onClick={() => handleOpenSaint(saint, true)}
                              variant="primary"
                              className="w-full"
                            >
                              <Sparkles className="w-md h-md group-hover:rotate-12 transition-transform" />
                              Refletir com Logos
                            </Button>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))
                ) : (
                  <div className="text-center py-3xl bg-muted/20 rounded-[2.5rem] border border-dashed border-border space-y-md">
                    <Icons.Star className="w-2xl h-2xl text-muted-foreground/60 mx-auto" />
                    <div className="space-y-xs">
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
              id="panel-search"
              {...getTabPanelProps('panel-search', 'tab-search', viewMode === 'search', "space-y-xl outline-none")}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-xl outline-none"
              tabIndex={0}
            >
              <FuzzySearchInput
                className="max-w-2xl mx-auto px-md"
                value={search}
                onChange={setSearch}
                placeholder="Buscar santo por nome, título ou padroado…"
                isSearching={search !== debouncedSearch || isSearchingLocal}
                size="lg"
              />
              <div className="max-w-2xl mx-auto px-md">
                {isLoadingDaily || isSearchingLocal ? (
                  <SaintGridSkeleton count={6} />
                ) : search.trim() ? (
                  <>
                    {(searchResults.length > 0 || globalResults.length > 0) ? (
                      <div className="space-y-xs">
                        <AnimatePresence mode="popLayout">
                        {searchResults.map((saint, i) => (
                          <SearchResultCard
                            key={saint.id}
                            title={saint.name}
                            subtitle={saint.title}
                            score={saint.similarityScore}
                            icon={<User className="w-md h-md" />}
                            onClick={() => handleOpenSaint(saint, false)}
                            index={i}
                          />
                        ))}
                        {globalResults.map((saint, i) => (
                          <SearchResultCard
                            key={saint.id}
                            title={saint.name}
                            subtitle={saint.title}
                            icon={<Sparkles className="w-md h-md" />}
                            onClick={() => handleOpenSaint(saint, false)}
                            index={searchResults.length + i}
                          />
                        ))}
                        </AnimatePresence>
                      </div>
                    ) : null}

                    {searchResults.length === 0 && !isSearchingGlobal && globalResults.length === 0 && (
                      <div className="text-center py-3xl space-y-lg">
                        <p className="text-muted-foreground font-serif italic">
                          Nenhum santo encontrado em nossa base local.
                        </p>
                        <Button 
                          onClick={() => handleGlobalSearch(search)}
                          className="bg-primary hover:bg-primary/90 text-primary-foreground font-black text-xs uppercase tracking-widest h-2xl px-xl rounded-full shadow-premium shadow-primary/20 flex items-center gap-sm mx-auto"
                        >
                          <Sparkles className="w-md h-md" />
                          Buscar na Biblioteca Universal
                        </Button>
                      </div>
                    )}

                    {isSearchingGlobal && (
                      <div className="text-center py-3xl space-y-md">
                        <Sparkles className="w-xl h-xl text-primary animate-pulse mx-auto" />
                        <p className="text-sm text-muted-foreground animate-pulse">Consultando hagiografias históricas...</p>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="text-center py-3xl text-muted-foreground font-serif italic">
                    Digite o nome de um santo para buscar em nossa base ou na biblioteca universal.
                  </div>
                )}
              </div>
            </motion.div>
          ) : viewMode === 'cloud' ? (
            <motion.div
              key="cloud"
              {...getTabPanelProps('panel-cloud', 'tab-cloud', viewMode === 'cloud', "space-y-xl outline-none")}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="space-y-xl outline-none"
              tabIndex={0}
            >
              <div className="text-center space-y-xs">
                <p className="text-xs font-black uppercase tracking-[0.2em] text-primary">Nuvem de Testemunhas</p>
                <p className="text-sm text-muted-foreground italic font-serif">"Estamos cercados de tão grande nuvem de testemunhas..." — Heb 12,1</p>
              </div>

              <div className="flex flex-wrap justify-center gap-sm max-w-4xl mx-auto" role="list">
                {displaySaints.map((saint, i) => (
                  <div key={saint.id} role="listitem">
                    <BubbleTag
                      label={saint.name}
                      emoji={saint.category === 'pope' ? '👑' : saint.category === 'doctor' ? '📖' : '⛪'}
                      index={i}
                      onClick={() => handleOpenSaint(saint, false)}
                      className="px-md py-sm text-xs"
                    />
                  </div>
                ))}
              </div>
            </motion.div>
          ) : (
            <motion.div
              key={viewMode}
              id={`panel-${viewMode}`}
              role="tabpanel"
              aria-labelledby={`tab-${viewMode}`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-xl outline-none"
              tabIndex={0}
            >
              <div className="text-center space-y-md max-w-2xl mx-auto px-md">
                <h2 className="text-2xl font-serif font-bold">
                  {viewMode === 'writers' ? 'Doutores e Escritores' : viewMode === 'popes' ? 'Sucessores de Pedro' : 'Base Sanctorum'}
                </h2>
                <p className="text-sm text-muted-foreground italic">
                  {viewMode === 'writers' ? '"A pena é a língua da alma..."' : viewMode === 'popes' ? '"Tu és Pedro..."' : 'Exibindo registros catalogados.'}
                </p>
              </div>
              <div className="max-w-5xl mx-auto px-md">
                {isLoadingMode ? (
                  <div className="flex justify-center py-3xl"><Icons.Cross className="w-xl h-xl animate-spin opacity-20" /></div>
                ) : (
                  <StaggeredList className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-lg">
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
  return (
    <Button
      onClick={onClick}
      className="group bg-card border border-border rounded-[2rem] overflow-hidden hover:border-primary/50 hover:shadow-premium-hover hover:-translate-y-1 transition-all duration-500 text-left flex flex-col h-full focus-visible:ring-2 focus-visible:ring-primary outline-none"
    >
      <div className="relative h-4xl overflow-hidden">
        <SacredImage 
          src={saint.image || ''} 
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
          alt={saint.name} 
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
        <div className="absolute bottom-md left-lg flex items-center gap-xs">
          <span className="text-xs font-black uppercase tracking-widest text-white/90 bg-primary/80 px-xs py-3xs rounded-full ">
            {CATEGORY_LABELS[saint.category] || saint.category}
          </span>
        </div>
        <RelevanceBadge
          score={saint.similarityScore}
          className="absolute top-sm right-sm "
        />
      </div>
      
      <div className="flex-1 p-lg space-y-md">
        <div>
          <div className="flex items-center justify-between mb-xs">
            <span className="text-xs font-black uppercase tracking-widest text-primary">{saint.feastDay}</span>
            {saint.works && saint.works.length > 0 && (
              <div className="p-2xs bg-primary/5 rounded-premium text-primary" title="Possui obras escritas">
                <BookOpen className="w-sm h-sm" />
              </div>
            )}
          </div>
          <h3 className="text-xl font-serif font-bold text-foreground group-hover:text-primary transition-colors line-clamp-1">{saint.name}</h3>
          <p className="text-xs text-muted-foreground font-serif italic line-clamp-1">{saint.title}</p>
        </div>
        
        <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">{saint.bio}</p>
        
        <div className="flex flex-wrap gap-2xs mt-auto">
          {saint.virtues?.slice(0, 2).map(v => (
            <span key={v} className="px-xs py-3xs bg-primary/5 text-primary text-xs font-black uppercase rounded-full border border-primary/10">{v}</span>
          ))}
        </div>
      </div>
    </Button>
  );
};

export default Saints;
