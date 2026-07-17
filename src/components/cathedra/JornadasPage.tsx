import React, { useState, useEffect, useMemo } from 'react';
import { normalizeText } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';
import SEOHead from '@/components/SEOHead';
import { motion, AnimatePresence } from 'framer-motion';
import { Icons } from '@/constants';
import { CathedraCard } from './CathedraCard';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { AppRoute } from '@/types';
import FuzzySearchInput from './FuzzySearchInput';
import RelevanceBadge from './RelevanceBadge';
import { SearchResultCard } from './SearchResultCard';
import { useFuzzySearch } from '@/hooks/useFuzzySearch';
import { BubbleTag, getTagIcon } from './BubbleTag';
import type { Tables } from '@/integrations/supabase/types';
import ContemplativeLayout from './ContemplativeLayout';

const DIFFICULTY_LABELS: Record<string, string> = {
  iniciante: 'Iniciante',
  intermediario: 'Intermediário',
  'avançado': 'Avançado',
  avancado: 'Avançado',
};

const DIFFICULTY_COLORS: Record<string, string> = {
  iniciante: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300',
  intermediario: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300',
  'avançado': 'bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-300',
  avancado: 'bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-300',
};

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  fundamentos: <Icons.Sparkles className="w-spacing-md h-spacing-md" />,
  formacao: <Icons.BookOpen className="w-spacing-md h-spacing-md" />,
  rotina: <Icons.Calendar className="w-spacing-md h-spacing-md" />,
  oracao: <Icons.Heart className="w-spacing-md h-spacing-md" />,
  mistico: <Icons.Sun className="w-spacing-md h-spacing-md" />,
  cura: <Icons.Stethoscope className="w-spacing-md h-spacing-md" />,
  transformacao: <Icons.Zap className="w-spacing-md h-spacing-md" />,
};

const CATEGORY_LABELS: Record<string, string> = {
  fundamentos: 'Fundamentos',
  formacao: 'Formação',
  rotina: 'Rotina',
  oracao: 'Oração',
  mistico: 'Místico',
  cura: 'Cura',
  transformacao: 'Transformação',
};

const CATEGORY_COLORS: Record<string, string> = {
  fundamentos: 'from-blue-500/20 to-indigo-500/5',
  formacao: 'from-amber-500/20 to-orange-500/5',
  rotina: 'from-emerald-500/20 to-teal-500/5',
  oracao: 'from-rose-500/20 to-pink-500/5',
  mistico: 'from-violet-500/20 to-purple-500/5',
  cura: 'from-cyan-500/20 to-sky-500/5',
  transformacao: 'from-yellow-500/20 to-amber-500/5',
};

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.06 }
  }
};

const cardVariants = {
  hidden: { opacity: 0, y: 20, scale: 0.97 },
  visible: { 
    opacity: 1, y: 0, scale: 1,
    transition: { type: 'spring' as const, stiffness: 300, damping: 30 }
  },
  exit: { opacity: 0, y: -10, scale: 0.97 }
};

const JornadasPage = React.forwardRef<HTMLDivElement>((_props, ref) => {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const [journeys, setJourneys] = useState<any[]>([]);
  const [progressMap, setProgressMap] = useState<Record<string, number>>({});
  const [stepsCountMap, setStepsCountMap] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterDifficulty, setFilterDifficulty] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const fuzzySearch = useFuzzySearch<Tables<'journeys'>>({
    rpc: 'search_journeys_fuzzy',
    query: searchQuery,
    primaryField: 'title',
    secondaryField: 'description',
    resultLimit: 50,
  });
  const categories = useMemo(() => {
    const cats = [...new Set(journeys.map(j => j.category))];
    return cats.sort();
  }, [journeys]);

  const difficulties = useMemo(() => {
    const seen = new Set<string>();
    const result: string[] = [];
    journeys.forEach(j => {
      const key = normalizeText(j.difficulty);
      if (!seen.has(key)) {
        seen.add(key);
        result.push(j.difficulty);
      }
    });
    return result;
  }, [journeys]);

  const difficultyMatches = (journeyDiff: string, filterDiff: string) => {
    return normalizeText(journeyDiff) === normalizeText(filterDiff);
  };

  const fuzzyResultIds = useMemo(() => {
    if (!fuzzySearch.results) return null;
    return new Set(fuzzySearch.results.map(r => r.id));
  }, [fuzzySearch.results]);

  const fuzzyScoreMap = useMemo(() => {
    if (!fuzzySearch.results) return {};
    const map: Record<string, number> = {};
    fuzzySearch.results.forEach(r => { map[r.id] = (r as any).similarityScore ?? 0; });
    return map;
  }, [fuzzySearch.results]);

  const filteredJourneys = useMemo(() => {
    return journeys.filter(j => {
      // If fuzzy search is active, use fuzzy results; otherwise show all
      if (searchQuery.trim().length >= 2) {
        if (!fuzzyResultIds || !fuzzyResultIds.has(j.id)) return false;
      }
      if (filterCategory !== 'all' && j.category !== filterCategory) return false;
      if (filterDifficulty !== 'all' && !difficultyMatches(j.difficulty, filterDifficulty)) return false;
      return true;
    }).sort((a, b) => {
      // When fuzzy is active, sort by score
      if (searchQuery.trim().length >= 2) {
        return (fuzzyScoreMap[b.id] ?? 0) - (fuzzyScoreMap[a.id] ?? 0);
      }
      return 0;
    });
  }, [journeys, filterCategory, filterDifficulty, searchQuery, fuzzyResultIds, fuzzyScoreMap]);

  // Stats
  const stats = useMemo(() => {
    const total = journeys.length;
    const started = Object.keys(progressMap).length;
    const completed = Object.entries(progressMap).filter(([jid, count]) => count >= (stepsCountMap[jid] || Infinity)).length;
    return { total, started, completed };
  }, [journeys, progressMap, stepsCountMap]);

  useEffect(() => {
    loadJourneys();
  }, [user]);

  const loadJourneys = async () => {
    setLoading(true);
    try {
      // Optimized query using the newly created database view
      const { data: journeyData, error } = await supabase
        .from('view_journeys_with_stats')
        .select('*')
        .order('sort_order', { ascending: true });

      if (error) throw error;
      if (!journeyData) { setLoading(false); return; }
      
      setJourneys(journeyData);

      // Reconstruct the steps count map from the view data
      const counts: Record<string, number> = {};
      journeyData.forEach(j => {
        counts[j.id] = j.steps_count;
      });
      setStepsCountMap(counts);

      if (user) {
        const { data: progress } = await supabase
          .from('journey_progress')
          .select('journey_id')
          .eq('user_id', user.id);

        if (progress) {
          const map: Record<string, number> = {};
          progress.forEach(p => {
            map[p.journey_id] = (map[p.journey_id] || 0) + 1;
          });
          setProgressMap(map);
        }
      }
    } catch (err) {
      console.error('Error loading journeys:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-spacing-lg w-full pb-spacing-4xl">
        <div className="text-center space-y-spacing-sm pt-spacing-md">
          <div className="w-spacing-xl h-spacing-xl mx-auto rounded-premium bg-primary/20 animate-pulse" />
          <div className="h-spacing-lg w-spacing-4xl mx-auto bg-muted/60 rounded-premium animate-pulse" />
          <div className="h-spacing-md w-spacing-4xl mx-auto bg-muted/40 rounded-premium animate-pulse" />
        </div>
        <div className="space-y-spacing-md">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-spacing-4xl rounded-premium bg-muted/40 animate-pulse" style={{ animationDelay: `${i * 150}ms` }} />
          ))}
        </div>
      </div>
    );
  }

  const activeJourneys = journeys.filter(j => progressMap[j.id] > 0 && progressMap[j.id] < (stepsCountMap[j.id] || 0));

  return (
    <ContemplativeLayout
      title="Jornadas"
      subtitle="Itinerarium Mentis"
      icon={Icons.Journeys}
    >
      <SEOHead title="Jornadas Espirituais" description="Percorra jornadas de transformação espiritual com conteúdos guiados de formação católica." path="/jornadas" keywords="jornada espiritual, formação católica, crescimento espiritual" breadcrumbs={[{ name: "Início", path: "/" }, { name: "Jornadas", path: "/jornadas" }]} />
      <div ref={ref} className="w-full">
        <div className="w-full space-y-spacing-xl md:space-y-spacing-2xl">
          
          {/* Journey Reminder Settings */}
          {user && (
            <div className="flex justify-end mb-spacing-md">
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm" className="rounded-premium-full gap-spacing-xs text-[10px] font-black uppercase tracking-widest border-primary/20 hover:bg-primary/5">
                    <Icons.Bell className="w-spacing-sm h-spacing-sm" /> Lembrete
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px]">
                  <DialogHeader>
                    <DialogTitle className="font-display text-premium-2xl text-primary">Lembrete de Jornada</DialogTitle>
                  </DialogHeader>
                  <div className="py-spacing-md space-y-spacing-lg">
                    <div className="space-y-spacing-sm">
                      <label className="text-premium-xs font-bold uppercase tracking-widest text-primary/60">Horário Preferencial</label>
                      <div className="flex gap-spacing-xs">
                        <Input 
                          type="time" 
                          defaultValue={profile?.journey_reminder_time || "07:00"}
                          id="journey-time"
                          className="font-mono"
                        />
                        <Button 
                          onClick={async () => {
                            const time = (document.getElementById('journey-time') as HTMLInputElement).value;
                            const { error } = await supabase
                              .from('profiles')
                              .update({ journey_reminder_time: time })
                              .eq('id', user.id);
                            
                            if (!error) {
                              toast.success("Lembrete configurado para " + time);
                            } else {
                              toast.error("Erro ao salvar lembrete");
                            }
                          }}
                          className="bg-primary text-[10px] font-bold uppercase tracking-widest"
                        >
                          Salvar
                        </Button>
                      </div>
                      <p className="text-[10px] text-muted-foreground font-serif italic">
                        Receba uma notificação no horário escolhido para manter sua constância.
                      </p>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          )}

      {/* Cabeçalho editorial — alinhado à linguagem do Reader */}
      <motion.section
        className="editorial-column text-center space-y-spacing-md mb-spacing-2xl"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1.2 }}
      >
        <p className="editorial-meta text-secondary">Itinerarium Mentis</p>
        <p className="editorial-display text-2xl md:text-3xl font-serif italic text-muted-foreground leading-relaxed">
          "Caminhai enquanto tendes a luz, para que as trevas não vos surpreendam." — João 12,35
        </p>
        <hr className="editorial-rule editorial-rule--hair" />
      </motion.section>


      {/* Stats bar */}
      {stats.started > 0 && (
        <motion.div 
          className="flex items-center justify-center gap-spacing-md sm:gap-spacing-lg py-spacing-xs sm:py-spacing-sm px-spacing-sm sm:px-spacing-md bg-muted/30 rounded-premium-full"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
        >
          <div className="text-center">
            <p className="text-premium-base sm:text-premium-lg font-black text-foreground">{stats.total}</p>
            <p className="text-premium-xs sm:text-premium-xs font-black uppercase tracking-widest text-muted-foreground">Jornadas</p>
          </div>
          <div className="w-px h-spacing-xl bg-border" />
          <div className="text-center">
            <p className="text-premium-base sm:text-premium-lg font-black text-primary">{stats.started}</p>
            <p className="text-premium-xs sm:text-premium-xs font-black uppercase tracking-widest text-muted-foreground">Iniciadas</p>
          </div>
          <div className="w-px h-spacing-xl bg-border" />
          <div className="text-center">
            <p className="text-premium-base sm:text-premium-lg font-black text-emerald-500">{stats.completed}</p>
            <p className="text-premium-xs sm:text-premium-xs font-black uppercase tracking-widest text-muted-foreground">Concluídas</p>
          </div>
        </motion.div>
      )}

      {/* Active Journey Highlight */}
      <AnimatePresence>
        {activeJourneys.length > 0 && (
          <motion.div 
            className="space-y-spacing-sm"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
          >
            <div className="flex items-center gap-spacing-xs text-premium-xs font-black uppercase tracking-widest text-primary/60">
              <Icons.Flame className="w-spacing-sm h-spacing-sm" /> Continuar Jornada
            </div>
            {activeJourneys.slice(0, 1).map(journey => {
              const total = stepsCountMap[journey.id] || 1;
              const done = progressMap[journey.id] || 0;
              const pct = Math.round((done / total) * 100);
              return (
                <motion.div
                  key={`active-${journey.id}`}
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                >
                  <CathedraCard 
                    variant="interactive"
                    padding="none"
                    className="premium-card border-primary/40 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border-2 overflow-hidden shadow-premium-hover shadow-primary/5 relative cursor-pointer focus-visible:ring-4 focus-visible:ring-primary outline-none" 
                    onClick={() => navigate(`/jornadas/${journey.id}`)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => e.key === 'Enter' && navigate(`/jornadas/${journey.id}`)}
                    aria-label={`Continuar jornada ${journey.title}, ${pct}% concluída`}
                  >
                    {journey.cover_url && (
                      <div className="absolute inset-0 opacity-10 grayscale group-hover:opacity-20 transition-opacity">
                        <img 
                          src={journey.cover_url} 
                          alt="" 
                          aria-hidden="true" 
                          className="w-full h-full object-cover" 
                        />
                      </div>
                    )}

                    <div className="absolute top-spacing-0 right-0 p-spacing-md opacity-5 pointer-events-none">
                      <Icons.Flame className="w-spacing-3xl h-spacing-3xl text-primary" />
                    </div>
                    <div className="p-spacing-sm sm:p-spacing-md space-y-spacing-xs sm:space-y-spacing-sm">
                      <div className="flex items-center justify-between gap-spacing-sm">
                        <div className="flex-1 min-w-spacing-0">
                          <h3 className="font-bold text-foreground text-premium-base sm:text-premium-lg">{journey.title}</h3>
                          {journey.subtitle && (
                            <p className="text-premium-xs text-muted-foreground font-serif italic mt-spacing-3xs">{journey.subtitle}</p>
                          )}
                        </div>
                        <div className="relative w-spacing-xl h-spacing-xl sm:w-spacing-2xl sm:h-spacing-2xl flex-shrink-0">
                          <svg className="w-spacing-xl h-spacing-xl sm:w-spacing-2xl sm:h-spacing-2xl -rotate-90" viewBox="0 0 36 36">
                            <circle cx="18" cy="18" r="15.5" fill="none" className="stroke-muted" strokeWidth="3" />
                            <circle cx="18" cy="18" r="15.5" fill="none" className="stroke-primary" strokeWidth="3" strokeDasharray={`${pct} 100`} strokeLinecap="round" />
                          </svg>
                          <span className="absolute inset-0 flex items-center justify-center text-premium-xs sm:text-premium-xs font-black text-primary">{pct}%</span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <p className="text-premium-xs text-muted-foreground font-medium">{done} de {total} etapas</p>
                        <Button 
                          size="sm" 
                          className="bg-primary hover:bg-primary/90 text-white font-black text-premium-xs sm:text-premium-xs uppercase tracking-[0.15em] px-spacing-sm sm:px-spacing-md h-spacing-xl sm:h-spacing-xl rounded-premium-full sm:rounded-premium-full shadow-premium shadow-primary/20 group"
                        >
                          Continuar <Icons.ChevronRight className="w-spacing-sm h-spacing-sm ml-spacing-2xs group-hover:translate-x-0.5 transition-transform" />
                        </Button>
                      </div>
                    </div>
                  </CathedraCard>
                </motion.div>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>

      {/* CTA Diagnóstico */}
      {!Object.keys(progressMap).length && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <CathedraCard padding="md" className="premium-card bg-gradient-to-r from-primary/5 to-transparent overflow-hidden flex items-center gap-spacing-md sm:gap-spacing-lg">
              <div className="w-spacing-xl h-spacing-xl rounded-premium bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Icons.Brain className="w-spacing-md h-spacing-md text-primary" />
              </div>
              <div className="flex-1">
                <p className="text-premium-sm font-semibold text-foreground">Inicie sua caminhada</p>
                <p className="text-premium-xs text-muted-foreground">O Logos pode recomendar a melhor jornada para sua alma.</p>
              </div>
              <Button size="sm" variant="outline" onClick={() => navigate(AppRoute.DIAGNOSTICO)} className="flex-shrink-0">
                Diagnóstico <Icons.ArrowRight className="w-spacing-md h-spacing-md ml-spacing-2xs" />
              </Button>
          </CathedraCard>
        </motion.div>
      )}

      {/* Search & Filters */}
      <motion.div 
        className="space-y-spacing-md"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        <FuzzySearchInput
          value={searchQuery}
          onChange={setSearchQuery}
          placeholder="Buscar jornadas..."
          isSearching={fuzzySearch.isPending}
        />

        <div className="space-y-spacing-sm">
          <div className="flex items-center gap-spacing-xs text-premium-sm text-muted-foreground">
            <Icons.Filter className="w-spacing-md h-spacing-md" />
            <span className="font-medium">Filtrar</span>
          </div>

          <div className="flex flex-wrap gap-spacing-xs" role="list">
            <div role="listitem">
              <BubbleTag
                label="Todas"
                emoji="✨"
                index={0}
                isSelected={filterCategory === 'all'}
                onClick={() => setFilterCategory('all')}
              />
            </div>
            {categories.map((cat, i) => (
              <div key={cat} role="listitem">
                <BubbleTag
                  label={CATEGORY_LABELS[cat] || cat}
                  emoji={cat === 'oracao' ? '❤️' : cat === 'formacao' ? '📖' : cat === 'fundamentos' ? '⛪' : '🧭'}
                  index={i + 1}
                  isSelected={filterCategory === cat}
                  onClick={() => setFilterCategory(cat)}
                />
              </div>
            ))}
          </div>
        <div className="flex flex-wrap gap-spacing-2xs sm:gap-spacing-xs">
          <Button
            onClick={() => setFilterDifficulty('all')}
            className={`px-spacing-xs sm:px-spacing-sm py-spacing-2xs sm:py-spacing-2xs rounded-premium-full text-premium-xs sm:text-premium-xs font-semibold transition-all duration-200 focus-visible:ring-2 focus-visible:ring-primary outline-none ${
              filterDifficulty === 'all' ? 'bg-foreground text-background shadow-premium' : 'bg-muted text-muted-foreground hover:bg-muted/80'
            }`}
            aria-pressed={filterDifficulty === 'all'}
          >
            Todos os níveis
          </Button>

          {difficulties.map(diff => (
            <Button
              key={diff}
              onClick={() => setFilterDifficulty(diff)}
              className={`px-spacing-xs sm:px-spacing-sm py-spacing-2xs sm:py-spacing-2xs rounded-premium-full text-premium-xs sm:text-premium-xs font-semibold transition-all duration-200 focus-visible:ring-2 focus-visible:ring-primary outline-none ${
                filterDifficulty === diff ? 'bg-foreground text-background shadow-premium' : 'bg-muted text-muted-foreground hover:bg-muted/80'
              }`}
              aria-pressed={filterDifficulty === diff}
            >
              {DIFFICULTY_LABELS[diff] || diff}
            </Button>
          ))}

        </div>
      </div>
    </motion.div>

      {/* Search Results as SearchResultCards */}
      {searchQuery.trim().length >= 2 && fuzzySearch.results && fuzzySearch.results.length > 0 && (
        <AnimatePresence mode="popLayout">
        <div className="space-y-spacing-xs">
          <p className="text-premium-xs font-black uppercase tracking-widest text-muted-foreground">Resultados da busca</p>
          {fuzzySearch.results.map((j, i) => (
            <SearchResultCard
              key={j.id}
              title={j.title}
              subtitle={j.subtitle || j.description}
              score={(j as any).similarityScore}
              icon={<Icons.Compass className="w-spacing-md h-spacing-md" />}
              onClick={() => navigate(`/jornadas/${j.id}`)}
              index={i}
            />
          ))}
        </div>
        </AnimatePresence>
      )}

      {/* Journey Cards */}
      <motion.div 
        className="space-y-spacing-sm sm:space-y-spacing-md"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        key={`${filterCategory}-${filterDifficulty}`}
      >
        <AnimatePresence mode="popLayout">
          {filteredJourneys.map((journey) => {
            const totalSteps = stepsCountMap[journey.id] || 0;
            const completedSteps = progressMap[journey.id] || 0;
            const progressPercent = totalSteps > 0 ? (completedSteps / totalSteps) * 100 : 0;
            const hasStarted = completedSteps > 0;
            const isComplete = completedSteps >= totalSteps && totalSteps > 0;
            const gradientClass = CATEGORY_COLORS[journey.category] || 'from-muted/20 to-transparent';

            return (
              <motion.div
                key={journey.id}
                variants={cardVariants}
                layout
                exit="exit"
              >
                <motion.div
                  whileHover={{ scale: 1.01, y: -2 }}
                  whileTap={{ scale: 0.99 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                >
                  <CathedraCard
                    padding="none"
                    variant="interactive"
                    className={`overflow-hidden cursor-pointer transition-all group relative focus-visible:ring-4 focus-visible:ring-primary outline-none ${
                      isComplete 
                        ? 'border-emerald-500/30 ring-1 ring-emerald-500/10' 
                        : hasStarted 
                          ? 'border-primary/20'
                          : 'border-border hover:border-primary/30'
                    }`}
                    onClick={() => navigate(`/jornadas/${journey.id}`)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => e.key === 'Enter' && navigate(`/jornadas/${journey.id}`)}
                    aria-label={`Jornada ${journey.title}. ${isComplete ? 'Concluída' : hasStarted ? `${Math.round(progressPercent)}% concluída` : 'Não iniciada'}`}
                  >

                    {/* Gradient accent */}
                    <div className={`absolute inset-0 bg-gradient-to-br ${gradientClass} opacity-60 pointer-events-none`} />
                    
                    {journey.cover_url && (
                      <div className="relative w-full h-spacing-4xl sm:h-spacing-4xl overflow-hidden">
                        <img
                          src={journey.cover_url}
                          alt={journey.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                          loading="lazy"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-card via-card/40 to-transparent" />
                        {isComplete && (
                          <div className="absolute top-spacing-sm right-spacing-sm bg-emerald-500 text-white px-spacing-xs py-spacing-2xs rounded-premium text-premium-xs font-black uppercase tracking-widest flex items-center gap-spacing-2xs shadow-premium">
                            <Icons.Check className="w-spacing-sm h-spacing-sm" /> Concluída
                          </div>
                        )}
                      </div>
                    )}

                    <div className="p-spacing-sm sm:p-spacing-md space-y-spacing-xs sm:space-y-spacing-sm relative">
                      {/* Title row */}
                      <div className="flex items-start justify-between gap-spacing-sm">
                        <div className="flex-1 min-w-spacing-0">
                            <div className="flex items-center gap-spacing-2xs sm:gap-spacing-xs flex-wrap mb-spacing-2xs">
                              <div className="w-spacing-lg h-spacing-lg sm:w-spacing-xl sm:h-spacing-xl rounded-premium-full sm:rounded-premium bg-muted/80 flex items-center justify-center opacity-80 group-hover:opacity-100 transition-opacity">
                              {CATEGORY_ICONS[journey.category] || <Icons.BookOpen className="w-spacing-md h-spacing-md" />}
                            </div>
                            <div className="flex-1 min-w-spacing-0">
                              <h2 className="text-premium-sm sm:text-premium-base font-bold font-serif text-foreground truncate">{journey.title}</h2>
                              {journey.subtitle && (
                                <p className="text-premium-xs text-muted-foreground font-serif italic truncate">{journey.subtitle}</p>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-spacing-xs flex-shrink-0">
                          {searchQuery.trim().length >= 2 && (
                            <RelevanceBadge score={fuzzyScoreMap[journey.id]} size="xs" />
                          )}
                          {journey.is_premium && (
                            <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20 text-premium-xs px-spacing-xs">
                              <Icons.Sparkles className="w-spacing-sm h-spacing-sm mr-spacing-3xs" /> PRO
                            </Badge>
                          )}
                          <Icons.ChevronRight className="w-spacing-md h-spacing-md text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all flex-shrink-0" />
                        </div>
                      </div>

                      {/* Description */}
                      {journey.description && (
                        <p className="text-premium-xs text-muted-foreground leading-relaxed line-clamp-spacing-xs">{journey.description}</p>
                      )}

                      {/* Tags */}
                      {journey.tags && journey.tags.length > 0 && (
                        <div className="flex flex-wrap gap-spacing-2xs">
                          {journey.tags.slice(0, 3).map((tag: string) => (
                            <span key={tag} className="text-premium-xs px-spacing-xs py-spacing-3xs rounded-premium-full bg-muted text-muted-foreground font-medium">
                              {tag}
                            </span>
                          ))}
                          {journey.tags.length > 3 && (
                            <span className="text-premium-xs px-spacing-xs py-spacing-3xs rounded-premium-full bg-muted text-muted-foreground font-medium">
                              +{journey.tags.length - 3}
                            </span>
                          )}
                        </div>
                      )}

                      {/* Meta */}
                      <div className="flex items-center gap-spacing-xs sm:gap-spacing-sm text-premium-xs sm:text-premium-xs text-muted-foreground flex-wrap">
                        <span className="flex items-center gap-spacing-2xs">
                          <Icons.Clock className="w-spacing-sm h-spacing-sm" /> ~{journey.estimated_days}d
                        </span>
                        <span className={`px-spacing-xs py-spacing-3xs rounded-premium-full text-premium-xs font-bold ${DIFFICULTY_COLORS[journey.difficulty] || 'bg-muted text-muted-foreground'}`}>
                          {DIFFICULTY_LABELS[journey.difficulty] || journey.difficulty}
                        </span>
                        <span className="flex items-center gap-spacing-2xs">
                          <Icons.Layout className="w-spacing-sm h-spacing-sm" /> {totalSteps} etapas
                        </span>
                      </div>

                      {/* Progress */}
                      {totalSteps > 0 && (
                        <div className="space-y-spacing-2xs pt-spacing-2xs">
                          <div className="relative">
                            <Progress value={progressPercent} className="h-spacing-xs" />
                          </div>
                          <div className="flex justify-between text-premium-xs text-muted-foreground">
                            <span className="font-medium">
                              {hasStarted 
                                ? `${completedSteps}/${totalSteps} etapas concluídas` 
                                : 'Não iniciada'}
                            </span>
                            {hasStarted && !isComplete && (
                              <span className="text-primary font-bold">{Math.round(progressPercent)}%</span>
                            )}
                            {isComplete && !journey.cover_url && (
                              <span className="text-emerald-500 font-bold flex items-center gap-spacing-2xs">
                                <Icons.Check className="w-spacing-sm h-spacing-sm" /> Concluída
                              </span>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </CathedraCard>
                </motion.div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </motion.div>

      {filteredJourneys.length === 0 && (
        <motion.div 
          className="text-center py-spacing-2xl space-y-spacing-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <div className="w-spacing-3xl h-spacing-3xl mx-auto rounded-premium bg-muted/50 flex items-center justify-center mb-spacing-md">
            <Icons.Search className="w-spacing-lg h-spacing-lg text-muted-foreground" />
          </div>
          <p className="text-muted-foreground">
            {journeys.length === 0
              ? 'Nenhuma jornada disponível ainda.'
              : 'Nenhuma jornada encontrada com esses filtros.'}
          </p>
          {journeys.length > 0 && (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => { setFilterCategory('all'); setFilterDifficulty('all'); }}
              className="mt-spacing-xs"
            >
              Limpar filtros
            </Button>
          )}
        </motion.div>
      )}
        </div>
      </div>
    </ContemplativeLayout>
  );
});

JornadasPage.displayName = 'JornadasPage';

export default JornadasPage;
