import React, { useState, useMemo, useEffect, lazy, Suspense } from 'react';
import { SpaceLayout, SpaceHeader, SpaceFooter } from './space/SpaceLayout';
import { useSearchParams, useParams, useNavigate } from 'react-router-dom';
import { useOfficialSaint } from '@/hooks/useSaints';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import SEOHead from '@/components/SEOHead';
import { Icons } from '../../constants';
import StaggeredList from './StaggeredList';
import SacredImage from './SacredImage';
import { SaintCardSkeleton, SaintGridSkeleton } from './SacredSkeleton';
import { CATEGORY_LABELS } from './SaintDetail.categories';
const SaintDetail = lazy(() => import('./SaintDetail'));
import { type Saint } from '@/data/saints';
import { getSaintsByDate, getSaintsByDateOrThrow, searchSaints, getSaintsByCategory, getAllSaints, getSaintById, formatSaint, type SaintWithScore } from '@/services/saintsService';
import SaintsFetchError from './SaintsFetchError';
import SaintsOfflineFallback from './SaintsOfflineFallback';

import { supabase } from '@/integrations/supabase/client';
import { useDebounce } from '@/hooks/useDebounce';

import { RelevanceBadge } from './RelevanceBadge';
import { FuzzySearchInput } from './FuzzySearchInput';
import { SearchResultCard } from './SearchResultCard';
import { Button } from '@/components/ui/button';
import { BubbleTag, getTagIcon } from './BubbleTag';
import { format, isSameDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';
import { getTabProps, getTabPanelProps, useTabNavigation } from './TabUtils';
import { SanctorumHero } from './SanctorumHero';
import { SanctorumDateNav } from './SanctorumDateNav';
import SanctorumClampNotice from './SanctorumClampNotice';
import SantoDoDiaHero from './SantoDoDiaHero';
import SantoDoDiaHeroSkeleton, { SantoDoDiaSecondaryListSkeleton } from './SantoDoDiaHeroSkeleton';
import SaintsFilters from './SaintsFilters';
import { toISODateLocal, resolveSanctorumDateParam } from '@/lib/sanctorumDate';
import { trackEvent } from '@/lib/analytics';




const Saints = React.forwardRef<HTMLDivElement, { legacyReader?: boolean }>((props, ref) => {
  const { legacyReader = false } = props;
  const [searchParams, setSearchParams] = useSearchParams();
  const rawDateParam = searchParams.get('date');
  const { date: initialDate, wasClamped: dateWasClamped } =
    resolveSanctorumDateParam(rawDateParam);
  const [selectedDate, setSelectedDate] = useState<Date>(initialDate);
  const [selectedSaint, setSelectedSaint] = useState<Saint | null>(null);
  const [autoReflect, setAutoReflect] = useState(false);
  const [search, setSearch] = useState('');
  const { handleKeyDown: handleTabKeyDown } = useTabNavigation();
  const [viewMode, setViewMode] = useState<'daily' | 'filtros' | 'search' | 'all' | 'writers' | 'popes' | 'cloud'>('daily');
  const viewModes = ['daily', 'filtros', 'all', 'writers', 'popes', 'cloud', 'search'] as const;
  const [isSearchingGlobal, setIsSearchingGlobal] = useState(false);
  const [globalResults, setGlobalResults] = useState<Saint[]>([]);
  const { id } = useParams();
  const navigate = useNavigate();

  // Reescreve URL para hoje se ?date= veio inválido/fora do intervalo.
  useEffect(() => {
    if (!dateWasClamped) return;
    try {
      trackEvent('sanctorum_date_clamped', {
        page: 'saints',
        received: rawDateParam,
        replaced_with: toISODateLocal(initialDate),
      });
    } catch { /* noop */ }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Persistir data selecionada na URL (?date=YYYY-MM-DD)
  useEffect(() => {
    const next = new URLSearchParams(searchParams);
    next.set('date', toISODateLocal(selectedDate));
    if (next.toString() !== searchParams.toString()) {
      setSearchParams(next, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDate]);

  // Aplica preferência (query ?legacy=1 tem prioridade, senão localStorage)
  useEffect(() => {
    if (!id) return;
    try {
      const qp = searchParams.get('legacy');
      let want: 'legacy' | 'new' | null = null;
      if (qp === '1') want = 'legacy';
      else if (qp === '0') want = 'new';
      else {
        const pref = localStorage.getItem('cathedra:saints:reader-variant');
        if (pref === 'legacy') want = 'legacy';
        else if (pref === 'new') want = 'new';
      }
      if (!want) return;
      // Persiste preferência quando vem da URL
      if (qp === '1' || qp === '0') {
        localStorage.setItem('cathedra:saints:reader-variant', want);
      }
      const suffix = searchParams.toString() ? `?${searchParams.toString()}` : '';
      if (want === 'legacy' && !legacyReader) {
        navigate(`/saints-legacy/${id}${suffix}`, { replace: true });
      } else if (want === 'new' && legacyReader) {
        navigate(`/santos/${id}${suffix}`, { replace: true });
      }
    } catch { /* ignore */ }
  }, [id, legacyReader, navigate, searchParams]);

  useEffect(() => {
    if (id) {
      try { localStorage.setItem('cathedra:saints:last-id', id); } catch { /* ignore */ }
      getSaintById(id).then(saint => {
        if (saint) setSelectedSaint(saint);
      });
    }
  }, [id]);

  // Sem id na URL: retoma o último santo aberto respeitando a variante preferida
  useEffect(() => {
    if (id) return;
    try {
      const lastId = localStorage.getItem('cathedra:saints:last-id');
      if (!lastId) return;
      
      // Valida se o ID existe antes de navegar (certificação funcional)
      getSaintById(lastId).then(exists => {
        if (!exists) {
          localStorage.removeItem('cathedra:saints:last-id');
          return;
        }
        const pref = localStorage.getItem('cathedra:saints:reader-variant');
        const base = pref === 'legacy' ? '/saints-legacy/' : '/santos/';
        navigate(`${base}${lastId}`, { replace: true });
      });
    } catch { /* ignore */ }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ─── Queries ───
  
  const { data: officialSaint } = useOfficialSaint();

  // Daily Saints from Icons.Database
  const {
    data: localSaints = [],
    isLoading: isLoadingDaily,
    isError: isDailyError,
    error: dailyError,
    refetch: refetchDaily,
    isFetching: isRefetchingDaily,
  } = useQuery({
    queryKey: ['saints-date', selectedDate.getMonth() + 1, selectedDate.getDate()],
    queryFn: () => getSaintsByDateOrThrow(selectedDate.getMonth() + 1, selectedDate.getDate()),
    enabled: viewMode === 'daily',
    staleTime: 1000 * 60 * 60 * 24, // 24h para santos do dia
    gcTime: 1000 * 60 * 60 * 24 * 7, // 7 dias em cache persistente
    retry: 1,
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
    staleTime: 1000 * 60 * 60 * 12, // 12h
    gcTime: 1000 * 60 * 60 * 24,
  });

  // Debounced search to avoid one DB hit per keystroke
  const debouncedSearch = useDebounce(search, 300);

  // Icons.Search results
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
    if (!localSaints.length) return [];
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


  const displaySaints = viewMode === 'daily' ? saintsForSelectedDate : modeSaints;

  return (
    <SpaceLayout>
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

      <div ref={ref} className="space-y-spacing-xl pb-spacing-3xl">
        <SpaceHeader 
          align="center"
          kicker="Capellae"
          title="Capelas"
          description='"Sede santos, porque eu, o Senhor vosso Deus, sou santo." — Levítico 19,2'
        />


        <div className="flex justify-center overflow-x-auto pb-spacing-md no-scrollbar">
          <div
            className="flex items-center gap-spacing-lg md:gap-spacing-xl min-w-max border-y border-secondary/40 px-spacing-md py-spacing-xs"
            role="tablist"
            aria-label="Modos de visualização dos santos"
          >
            {viewModes.map((mode, idx) => {
              const isActive = viewMode === mode;
              return (
                <button
                  key={mode}
                  type="button"
                  {...getTabProps(
                    `tab-${mode}`,
                    `panel-${mode}`,
                    isActive,
                    `relative inline-flex items-center justify-center min-h-11 bg-transparent px-spacing-2xs py-spacing-xs text-premium-xs font-black uppercase tracking-[0.22em] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary/60 focus-visible:ring-offset-2 focus-visible:ring-offset-background ${
                      isActive
                        ? 'text-primary'
                        : 'text-muted-foreground hover:text-foreground'
                    }`,
                  )}
                  onClick={() => setViewMode(mode)}
                  onKeyDown={(e) =>
                    handleTabKeyDown(e, idx, viewModes.length, (newIdx) =>
                      setViewMode(viewModes[newIdx]),
                    'tab-')
                  }
                >
                  <span>
                    {mode === 'daily'
                      ? 'Hoje'
                      : mode === 'filtros'
                      ? 'Filtros'
                      : mode === 'all'
                      ? 'Todos'
                      : mode === 'writers'
                      ? 'Escritores'
                      : mode === 'popes'
                      ? 'Papas'
                      : mode === 'cloud'
                      ? 'Nuvem'
                      : 'Buscar'}
                  </span>
                  <span
                    aria-hidden="true"
                    className={`pointer-events-none absolute -bottom-[6px] left-1/2 h-[2px] -translate-x-1/2 bg-secondary transition-all duration-300 ${
                      isActive ? 'w-full opacity-100' : 'w-0 opacity-0'
                    }`}
                  />
                </button>
              );
            })}
          </div>
        </div>

        <AnimatePresence mode="wait">
          {viewMode === 'daily' ? (
              <motion.div
                key="daily"
                {...getTabPanelProps('panel-daily', 'tab-daily', viewMode === 'daily', "space-y-spacing-xl outline-none")}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
              >
              <SanctorumDateNav value={selectedDate} onChange={setSelectedDate} analyticsPage="saints" />

              {dateWasClamped && (
                <SanctorumClampNotice
                  received={rawDateParam}
                  replacedWith={toISODateLocal(initialDate)}
                />
              )}




              <div
                className="w-full space-y-spacing-lg"
                aria-busy={isLoadingDaily || isRefetchingDaily}
              >
                {/*
                  Região aria-live polite: cobre loading → sucesso e ficam
                  sincronizados com a quantidade renderizada. Erros ficam
                  fora daqui — o <SaintsFetchError> já anuncia como alert
                  assertivo, evitando duplicidade auditiva.
                */}
                <span
                  className="sr-only"
                  role="status"
                  aria-live="polite"
                  aria-atomic="true"
                >
                  {(() => {
                    if (isDailyError) return '';
                    const dateLabel = format(
                      selectedDate,
                      "d 'de' MMMM 'de' yyyy",
                      { locale: ptBR },
                    );
                    if (isLoadingDaily) {
                      return `Carregando santos do dia para ${dateLabel}.`;
                    }
                    if (isRefetchingDaily) {
                      return `Atualizando santos do dia para ${dateLabel}.`;
                    }
                    const n = displaySaints.length;
                    if (n === 0) {
                      return `Nenhum santo encontrado para ${dateLabel}.`;
                    }
                    if (n === 1) {
                      return `1 santo encontrado para ${dateLabel}.`;
                    }
                    return `${n} santos encontrados para ${dateLabel}.`;
                  })()}
                </span>
                {isDailyError ? (
                  <SaintsOfflineFallback
                    message={dailyError instanceof Error ? dailyError.message : "Erro ao carregar o Santoral. Verifique a conexão com o banco de dados."}
                    onRetry={() => refetchDaily()}
                    isRetrying={isRefetchingDaily}
                  />
                ) : isLoadingDaily ? (

                  <>
                    <SantoDoDiaHeroSkeleton />
                    <SantoDoDiaSecondaryListSkeleton count={2} />
                  </>
                ) : displaySaints.length > 0 ? (
                  <>
                    {/* Santo do Dia — hero editorial com ficha em blocos */}
                    <SantoDoDiaHero
                      saint={displaySaints[0]}
                      date={selectedDate}
                      onOpen={(reflect) => handleOpenSaint(displaySaints[0], reflect)}
                    />

                    {displaySaints.length > 1 && (
                      <section aria-labelledby="tambem-celebrados" className="space-y-spacing-lg pt-spacing-2xl">
                        <div className="flex items-baseline gap-spacing-md">
                          <h3
                            id="tambem-celebrados"
                            className="font-serif text-premium-xl text-foreground whitespace-nowrap"
                          >
                            Também celebrados hoje
                          </h3>
                          <span aria-hidden="true" className="h-px flex-1 bg-secondary/40" />
                          <span className="text-premium-xs font-black uppercase tracking-[0.24em] text-secondary">
                            {displaySaints.length - 1} {displaySaints.length - 1 === 1 ? 'memória' : 'memórias'}
                          </span>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-spacing-lg gap-y-spacing-md">
                          {displaySaints.slice(1).map((saint) => (
                            <button
                              key={saint.id}
                              type="button"
                              onClick={() => handleOpenSaint(saint, false)}
                              onMouseEnter={() => {
                                // Prefetch do componente e dados do santo
                                import('./SaintDetail');
                                getSaintById(saint.id);
                              }}
                              className="group text-left border-l-2 border-secondary/40 hover:border-secondary pl-spacing-md pr-spacing-xs py-spacing-sm min-h-11 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary/60 focus-visible:ring-offset-2 focus-visible:ring-offset-background rounded-sm"
                              aria-label={`Abrir ficha de ${saint.name}`}
                            >
                              <p className="text-premium-xs font-black uppercase tracking-[0.22em] text-secondary mb-spacing-3xs line-clamp-1">
                                {CATEGORY_LABELS[saint.category] || 'Testemunha da Fé'}
                              </p>
                              <h4 className="font-serif text-premium-base sm:text-premium-lg text-foreground leading-snug group-hover:text-primary transition-colors line-clamp-2 break-words">
                                {saint.name}
                              </h4>
                              {saint.title && (
                                <p className="text-premium-sm text-muted-foreground font-serif italic mt-spacing-3xs line-clamp-2 break-words">
                                  {saint.title}
                                </p>
                              )}
                            </button>
                          ))}
                        </div>
                      </section>
                    )}
                  </>
                ) : (
                  <section className="text-center py-spacing-3xl space-y-spacing-md border-y border-secondary/40">
                    <p className="text-premium-xs font-black uppercase tracking-[0.22em] text-secondary">Sanctorum</p>
                    <Icons.Star className="w-spacing-2xl h-spacing-2xl text-secondary/60 mx-auto" />
                    <h3 className="font-serif text-premium-2xl text-foreground italic">O céu está repleto de heróis silenciosos.</h3>
                    <p className="text-premium-sm font-serif italic text-muted-foreground max-w-xl mx-auto px-spacing-md">
                      Embora não tenhamos um santo específico catalogado para hoje em nossa base, milhares de almas celebram na glória de Deus.
                    </p>
                  </section>
                )}
              </div>
            </motion.div>
          ) : viewMode === 'filtros' ? (
            <motion.div
              key="filtros"
              {...getTabPanelProps('panel-filtros', 'tab-filtros', viewMode === 'filtros', "space-y-spacing-xl outline-none")}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <SaintsFilters onOpenSaint={(s) => handleOpenSaint(s, false)} />
            </motion.div>
          ) : viewMode === 'search' ? (
            <motion.div
              key="search"
              id="panel-search"
              {...getTabPanelProps('panel-search', 'tab-search', viewMode === 'search', "space-y-spacing-xl outline-none")}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-spacing-xl outline-none"
              tabIndex={0}
            >
              <FuzzySearchInput
                className="max-w-spacing-2xl mx-auto px-spacing-md"
                value={search}
                onChange={setSearch}
                placeholder="Buscar santo por nome, título ou padroado…"
                isSearching={search !== debouncedSearch || isSearchingLocal}
                size="lg"
              />
              <div className="max-w-spacing-2xl mx-auto px-spacing-md">
                {isLoadingDaily || isSearchingLocal ? (
                  <SaintGridSkeleton count={6} />
                ) : search.trim() ? (
                  <>
                    {(searchResults.length > 0 || globalResults.length > 0) ? (
                      <div className="space-y-spacing-xs">
                        <AnimatePresence mode="popLayout">
                        {searchResults.map((saint, i) => (
                          <SearchResultCard
                            key={saint.id}
                            title={saint.name}
                            subtitle={saint.title}
                            score={saint.similarityScore}
                            icon={<Icons.User className="w-spacing-md h-spacing-md" />}
                            onClick={() => handleOpenSaint(saint, false)}
                            onMouseEnter={() => {
                              import('./SaintDetail');
                              getSaintById(saint.id);
                            }}
                            index={i}
                          />
                        ))}
                        {globalResults.map((saint, i) => (
                          <SearchResultCard
                            key={saint.id}
                            title={saint.name}
                            subtitle={saint.title}
                             icon={<Icons.Sparkles className="w-spacing-md h-spacing-md" />}
                             onClick={() => handleOpenSaint(saint, false)}
                             onMouseEnter={() => {
                               import('./SaintDetail');
                               getSaintById(saint.id);
                             }}
                             index={searchResults.length + i}
                           />
                        ))}
                        </AnimatePresence>
                      </div>
                    ) : null}

                    {searchResults.length === 0 && !isSearchingGlobal && globalResults.length === 0 && (
                      <div className="text-center py-spacing-3xl space-y-spacing-lg">
                        <p className="text-muted-foreground font-serif italic">
                          Nenhum santo encontrado em nossa base local.
                        </p>
                        <Button 
                          onClick={() => handleGlobalSearch(search)}
                          className="bg-primary hover:bg-primary/90 text-primary-foreground font-black text-premium-xs uppercase tracking-widest h-spacing-2xl px-spacing-xl rounded-premium-full shadow-premium shadow-primary/20 flex items-center gap-spacing-sm mx-auto"
                        >
                          <Icons.Sparkles className="w-spacing-md h-spacing-md" />
                          Buscar na Biblioteca Universal
                        </Button>
                      </div>
                    )}

                    {isSearchingGlobal && (
                      <div className="text-center py-spacing-3xl space-y-spacing-md">
                        <Icons.Sparkles className="w-spacing-xl h-spacing-xl text-primary animate-pulse mx-auto" />
                        <p className="text-premium-sm text-muted-foreground animate-pulse">Consultando hagiografias históricas...</p>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="text-center py-spacing-3xl text-muted-foreground font-serif italic">
                    Digite o nome de um santo para buscar em nossa base ou na biblioteca universal.
                  </div>
                )}
              </div>
            </motion.div>
          ) : viewMode === 'cloud' ? (
            <motion.div
              key="cloud"
              {...getTabPanelProps('panel-cloud', 'tab-cloud', viewMode === 'cloud', "space-y-spacing-xl outline-none")}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="space-y-spacing-xl outline-none"
              tabIndex={0}
            >
              <header className="max-w-spacing-2xl mx-auto px-spacing-md space-y-spacing-sm text-center">
                <p className="text-premium-xs font-black uppercase tracking-[0.22em] text-secondary">Nuvem de Testemunhas</p>
                <h2 className="font-serif text-premium-3xl text-foreground">Comunhão dos Santos</h2>
                <div aria-hidden="true" className="mx-auto h-px w-16 bg-secondary/60" />
                <p className="font-serif italic text-premium-sm text-muted-foreground">
                  "Estamos cercados de tão grande nuvem de testemunhas…" — Hebreus 12,1
                </p>
              </header>

              <div className="flex flex-wrap justify-center gap-spacing-sm max-w-spacing-4xl mx-auto" role="list">
                {displaySaints.map((saint, i) => (
                  <div key={saint.id} role="listitem">
                    <BubbleTag
                      label={saint.name}
                      emoji={saint.category === 'pope' ? '👑' : saint.category === 'doctor' ? '📖' : '⛪'}
                      index={i}
                      onClick={() => handleOpenSaint(saint, false)}
                      className="px-spacing-md py-spacing-sm text-premium-xs"
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
              className="space-y-spacing-xl outline-none"
              tabIndex={0}
            >
              <header className="max-w-spacing-2xl mx-auto px-spacing-md space-y-spacing-sm text-center">
                <p className="text-premium-xs font-black uppercase tracking-[0.22em] text-secondary">
                  {viewMode === 'writers' ? 'Doctores Ecclesiae' : viewMode === 'popes' ? 'Cathedra Petri' : 'Sanctorum'}
                </p>
                <h2 className="font-serif text-premium-3xl text-foreground">
                  {viewMode === 'writers' ? 'Doutores e Escritores' : viewMode === 'popes' ? 'Sucessores de Pedro' : 'Base Sanctorum'}
                </h2>
                <div aria-hidden="true" className="mx-auto h-px w-16 bg-secondary/60" />
                <p className="font-serif italic text-premium-sm text-muted-foreground">
                  {viewMode === 'writers'
                    ? '"A pena é a língua da alma…"'
                    : viewMode === 'popes'
                    ? '"Tu és Pedro, e sobre esta pedra edificarei a minha Igreja." — Mateus 16,18'
                    : 'Exibindo registros catalogados em nosso acervo.'}
                </p>
              </header>
              <div className="max-w-5xl mx-auto px-spacing-md">
                {isLoadingMode ? (
                  <div className="flex justify-center py-spacing-3xl"><Icons.Cross className="w-spacing-xl h-spacing-xl animate-spin opacity-20" /></div>
                ) : (
                  <StaggeredList className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-spacing-lg">
                    {modeSaints.map(saint => (
                      <SaintCard 
                        key={saint.id} 
                        saint={saint} 
                        onClick={() => handleOpenSaint(saint, false)}
                        onMouseEnter={() => {
                          import('./SaintDetail');
                          getSaintById(saint.id);
                        }}
                      />
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
              legacy={legacyReader}
            />
          )}
        </AnimatePresence>
      </div>
      <SpaceFooter 
        note="A santidade é a meta de todo mosteiro interior."
        links={[
          { label: 'Átrio', to: '/', hint: 'Voltar ao início' },
          { label: 'Acervo', to: '/acervo', hint: 'Estudar a tradição' },
          { label: 'Rezar', to: '/rezar', hint: 'Pedir a intercessão' },
        ]}
      />
    </SpaceLayout>
  );
});

Saints.displayName = 'Saints';

const SaintCard: React.FC<{ saint: SaintWithScore; onClick: () => void; onMouseEnter?: () => void }> = ({ saint, onClick, onMouseEnter }) => {
  return (
    <Button
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      className="group bg-card border border-border rounded-[2rem] overflow-hidden hover:border-primary/50 hover:shadow-premium-hover hover:-translate-y-1 transition-all duration-500 text-left flex flex-col h-full focus-visible:ring-2 focus-visible:ring-primary outline-none"
    >
      <div className="relative h-spacing-4xl overflow-hidden">
        <SacredImage 
          src={saint.image || ''} 
          category={saint.category}
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
          alt={saint.name} 
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
        <div className="absolute bottom-spacing-md left-spacing-lg flex items-center gap-spacing-xs">
          <span className="text-premium-xs font-black uppercase tracking-widest text-white/90 bg-primary/80 px-spacing-xs py-spacing-3xs rounded-premium-full ">
            {CATEGORY_LABELS[saint.category] || saint.category}
          </span>
        </div>
        <RelevanceBadge
          score={saint.similarityScore}
          className="absolute top-spacing-sm right-spacing-sm "
        />
      </div>
      
      <div className="flex-1 p-spacing-lg space-y-spacing-md">
        <div>
          <div className="flex items-center justify-between mb-spacing-xs">
            <span className="text-premium-xs font-black uppercase tracking-widest text-primary">{saint.feastDay}</span>
            {saint.works && saint.works.length > 0 && (
              <div className="p-spacing-2xs bg-primary/5 rounded-premium text-primary" title="Possui obras escritas">
                <Icons.BookOpen className="w-spacing-sm h-spacing-sm" />
              </div>
            )}
          </div>
          <h3 className="text-premium-xl font-serif font-bold text-foreground group-hover:text-primary transition-colors line-clamp-spacing-2xs">{saint.name}</h3>
          <p className="text-premium-xs text-muted-foreground font-serif italic line-clamp-spacing-2xs">{saint.title}</p>
        </div>
        
        <p className="text-premium-xs text-muted-foreground line-clamp-spacing-xs leading-relaxed">{saint.bio}</p>
        
        <div className="flex flex-wrap gap-spacing-2xs mt-auto">
          {saint.virtues?.slice(0, 2).map(v => (
            <span key={v} className="px-spacing-xs py-spacing-3xs bg-primary/5 text-primary text-premium-xs font-black uppercase rounded-premium-full border border-primary/10">{v}</span>
          ))}
        </div>
      </div>
    </Button>
  );
};

export default Saints;
