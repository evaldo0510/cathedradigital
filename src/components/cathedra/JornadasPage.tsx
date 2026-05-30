import React, { useState, useEffect, useMemo } from 'react';
import { normalizeText } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';
import SEOHead from '@/components/SEOHead';
import { motion, AnimatePresence } from 'framer-motion';
import { Icons } from '@/constants';
import { Card, CardContent } from '@/components/ui/card';
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
  fundamentos: <Icons.Sparkles className="w-5 h-5" />,
  formacao: <Icons.BookOpen className="w-5 h-5" />,
  rotina: <Icons.Calendar className="w-5 h-5" />,
  oracao: <Icons.Heart className="w-5 h-5" />,
  mistico: <Icons.Sun className="w-5 h-5" />,
  cura: <Icons.Stethoscope className="w-5 h-5" />,
  transformacao: <Icons.Zap className="w-5 h-5" />,
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
      <div className="space-y-6 max-w-2xl mx-auto pb-24">
        <div className="text-center space-y-3 pt-4">
          <div className="w-8 h-8 mx-auto rounded-premium bg-primary/20 animate-pulse" />
          <div className="h-7 w-48 mx-auto bg-muted/60 rounded-premium animate-pulse" />
          <div className="h-4 w-64 mx-auto bg-muted/40 rounded-premium animate-pulse" />
        </div>
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-44 rounded-premium bg-muted/40 animate-pulse" style={{ animationDelay: `${i * 150}ms` }} />
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
      <div ref={ref} className="desktop-layout">
        <div className="desktop-main space-y-8 md:space-y-12">
          
          {/* Journey Reminder Settings */}
          {user && (
            <div className="flex justify-end mb-4">
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm" className="rounded-full gap-2 text-[10px] font-black uppercase tracking-widest border-primary/20 hover:bg-primary/5">
                    <Icons.Bell className="w-3.5 h-3.5" /> Lembrete
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px]">
                  <DialogHeader>
                    <DialogTitle className="font-display text-2xl text-primary">Lembrete de Jornada</DialogTitle>
                  </DialogHeader>
                  <div className="py-4 space-y-6">
                    <div className="space-y-3">
                      <label className="text-xs font-bold uppercase tracking-widest text-primary/60">Horário Preferencial</label>
                      <div className="flex gap-2">
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

      {/* Quote */}
      <motion.div 
        className="text-center space-y-4 max-w-3xl mx-auto mb-12"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1.2 }}
      >
        <p className="text-muted-foreground font-serif italic text-lg md:text-xl leading-relaxed">
          "Caminhai enquanto tendes a luz, para que as trevas não vos surpreendam." — João 12,35
        </p>
      </motion.div>

      {/* Stats bar */}
      {stats.started > 0 && (
        <motion.div 
          className="flex items-center justify-center gap-4 sm:gap-6 py-2.5 sm:py-3 px-3 sm:px-4 bg-muted/30 rounded-full"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
        >
          <div className="text-center">
            <p className="text-base sm:text-lg font-black text-foreground">{stats.total}</p>
            <p className="text-premium-tiny sm:text-premium-tiny font-black uppercase tracking-widest text-muted-foreground">Jornadas</p>
          </div>
          <div className="w-px h-8 bg-border" />
          <div className="text-center">
            <p className="text-base sm:text-lg font-black text-primary">{stats.started}</p>
            <p className="text-premium-tiny sm:text-premium-tiny font-black uppercase tracking-widest text-muted-foreground">Iniciadas</p>
          </div>
          <div className="w-px h-8 bg-border" />
          <div className="text-center">
            <p className="text-base sm:text-lg font-black text-emerald-500">{stats.completed}</p>
            <p className="text-premium-tiny sm:text-premium-tiny font-black uppercase tracking-widest text-muted-foreground">Concluídas</p>
          </div>
        </motion.div>
      )}

      {/* Active Journey Highlight */}
      <AnimatePresence>
        {activeJourneys.length > 0 && (
          <motion.div 
            className="space-y-3"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
          >
            <div className="flex items-center gap-2 text-premium-tiny font-black uppercase tracking-widest text-primary/60">
              <Icons.Flame className="w-3 h-3" /> Continuar Jornada
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
                  <Card 
                    className="premium-card border-primary/40 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border-2 overflow-hidden shadow-premium-hover shadow-primary/5 relative cursor-pointer focus-visible:ring-4 focus-visible:ring-primary outline-none" 
                    onClick={() => navigate(`/jornadas/${journey.id}`)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => e.key === 'Enter' && navigate(`/jornadas/${journey.id}`)}
                    aria-label={`Continuar jornada ${journey.title}, ${pct}% concluída`}
                  >

                    <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                      <Icons.Flame className="w-16 h-16 text-primary" />
                    </div>
                    <CardContent className="p-3.5 sm:p-5 space-y-2.5 sm:space-y-3">
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-bold text-foreground text-base sm:text-lg">{journey.title}</h3>
                          {journey.subtitle && (
                            <p className="text-xs text-muted-foreground font-serif italic mt-0.5">{journey.subtitle}</p>
                          )}
                        </div>
                        <div className="relative w-11 h-11 sm:w-14 sm:h-14 flex-shrink-0">
                          <svg className="w-11 h-11 sm:w-14 sm:h-14 -rotate-90" viewBox="0 0 36 36">
                            <circle cx="18" cy="18" r="15.5" fill="none" className="stroke-muted" strokeWidth="3" />
                            <circle cx="18" cy="18" r="15.5" fill="none" className="stroke-primary" strokeWidth="3" strokeDasharray={`${pct} 100`} strokeLinecap="round" />
                          </svg>
                          <span className="absolute inset-0 flex items-center justify-center text-premium-tiny sm:text-xs font-black text-primary">{pct}%</span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <p className="text-premium-tiny text-muted-foreground font-medium">{done} de {total} etapas</p>
                        <Button 
                          size="sm" 
                          className="bg-primary hover:bg-primary/90 text-white font-black text-premium-tiny sm:text-premium-tiny uppercase tracking-[0.15em] px-3 sm:px-5 h-8 sm:h-9 rounded-full sm:rounded-full shadow-premium shadow-primary/20 group"
                        >
                          Continuar <Icons.ChevronRight className="w-3.5 h-3.5 ml-1 group-hover:translate-x-0.5 transition-transform" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
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
          <Card className="premium-card bg-gradient-to-r from-primary/5 to-transparent overflow-hidden">
            <CardContent className="p-4 sm:p-6 flex items-center gap-4 sm:gap-6">
              <div className="w-10 h-10 rounded-premium bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Icons.Brain className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-foreground">Inicie sua caminhada</p>
                <p className="text-xs text-muted-foreground">O Logos pode recomendar a melhor jornada para sua alma.</p>
              </div>
              <Button size="sm" variant="outline" onClick={() => navigate(AppRoute.DIAGNOSTICO)} className="flex-shrink-0">
                Diagnóstico <Icons.ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Search & Filters */}
      <motion.div 
        className="space-y-4"
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

        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Icons.Filter className="w-4 h-4" />
            <span className="font-medium">Filtrar</span>
          </div>

          <div className="flex flex-wrap gap-2" role="list">
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
        <div className="flex flex-wrap gap-1.5 sm:gap-2">
          <Button
            onClick={() => setFilterDifficulty('all')}
            className={`px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full text-premium-tiny sm:text-xs font-semibold transition-all duration-200 focus-visible:ring-2 focus-visible:ring-primary outline-none ${
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
              className={`px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full text-premium-tiny sm:text-xs font-semibold transition-all duration-200 focus-visible:ring-2 focus-visible:ring-primary outline-none ${
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
        <div className="space-y-2">
          <p className="text-premium-tiny font-black uppercase tracking-widest text-muted-foreground">Resultados da busca</p>
          {fuzzySearch.results.map((j, i) => (
            <SearchResultCard
              key={j.id}
              title={j.title}
              subtitle={j.subtitle || j.description}
              score={(j as any).similarityScore}
              icon={<Icons.Compass className="w-4 h-4" />}
              onClick={() => navigate(`/jornadas/${j.id}`)}
              index={i}
            />
          ))}
        </div>
        </AnimatePresence>
      )}

      {/* Journey Cards */}
      <motion.div 
        className="space-y-3 sm:space-y-4"
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
                  <Card
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
                      <div className="relative w-full h-24 sm:h-32 overflow-hidden">
                        <img
                          src={journey.cover_url}
                          alt={journey.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                          loading="lazy"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-card via-card/40 to-transparent" />
                        {isComplete && (
                          <div className="absolute top-3 right-3 bg-emerald-500 text-white px-2.5 py-1 rounded-premium text-premium-tiny font-black uppercase tracking-widest flex items-center gap-1 shadow-premium">
                            <Icons.Check className="w-3 h-3" /> Concluída
                          </div>
                        )}
                      </div>
                    )}

                    <CardContent className="p-3.5 sm:p-5 space-y-2.5 sm:space-y-3.5 relative">
                      {/* Title row */}
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap mb-1">
                              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full sm:rounded-premium bg-muted/80 flex items-center justify-center opacity-80 group-hover:opacity-100 transition-opacity">
                              {CATEGORY_ICONS[journey.category] || <Icons.BookOpen className="w-4 h-4" />}
                            </div>
                            <div className="flex-1 min-w-0">
                              <h2 className="text-sm sm:text-base font-bold font-serif text-foreground truncate">{journey.title}</h2>
                              {journey.subtitle && (
                                <p className="text-xs text-muted-foreground font-serif italic truncate">{journey.subtitle}</p>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          {searchQuery.trim().length >= 2 && (
                            <RelevanceBadge score={fuzzyScoreMap[journey.id]} size="xs" />
                          )}
                          {journey.is_premium && (
                            <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20 text-premium-tiny px-2">
                              <Icons.Sparkles className="w-3 h-3 mr-0.5" /> PRO
                            </Badge>
                          )}
                          <Icons.ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all flex-shrink-0" />
                        </div>
                      </div>

                      {/* Description */}
                      {journey.description && (
                        <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">{journey.description}</p>
                      )}

                      {/* Tags */}
                      {journey.tags && journey.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {journey.tags.slice(0, 3).map((tag: string) => (
                            <span key={tag} className="text-premium-tiny px-2 py-0.5 rounded-full bg-muted text-muted-foreground font-medium">
                              {tag}
                            </span>
                          ))}
                          {journey.tags.length > 3 && (
                            <span className="text-premium-tiny px-2 py-0.5 rounded-full bg-muted text-muted-foreground font-medium">
                              +{journey.tags.length - 3}
                            </span>
                          )}
                        </div>
                      )}

                      {/* Meta */}
                      <div className="flex items-center gap-2 sm:gap-3 text-premium-tiny sm:text-xs text-muted-foreground flex-wrap">
                        <span className="flex items-center gap-1">
                          <Icons.Clock className="w-3.5 h-3.5" /> ~{journey.estimated_days}d
                        </span>
                        <span className={`px-2 py-0.5 rounded-full text-premium-tiny font-bold ${DIFFICULTY_COLORS[journey.difficulty] || 'bg-muted text-muted-foreground'}`}>
                          {DIFFICULTY_LABELS[journey.difficulty] || journey.difficulty}
                        </span>
                        <span className="flex items-center gap-1">
                          <Icons.Layout className="w-3.5 h-3.5" /> {totalSteps} etapas
                        </span>
                      </div>

                      {/* Progress */}
                      {totalSteps > 0 && (
                        <div className="space-y-1.5 pt-1">
                          <div className="relative">
                            <Progress value={progressPercent} className="h-2" />
                          </div>
                          <div className="flex justify-between text-premium-tiny text-muted-foreground">
                            <span className="font-medium">
                              {hasStarted 
                                ? `${completedSteps}/${totalSteps} etapas concluídas` 
                                : 'Não iniciada'}
                            </span>
                            {hasStarted && !isComplete && (
                              <span className="text-primary font-bold">{Math.round(progressPercent)}%</span>
                            )}
                            {isComplete && !journey.cover_url && (
                              <span className="text-emerald-500 font-bold flex items-center gap-1">
                                <Icons.Check className="w-3 h-3" /> Concluída
                              </span>
                            )}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </motion.div>

      {filteredJourneys.length === 0 && (
        <motion.div 
          className="text-center py-12 space-y-3"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <div className="w-16 h-16 mx-auto rounded-premium bg-muted/50 flex items-center justify-center mb-4">
            <Icons.Search className="w-7 h-7 text-muted-foreground" />
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
              className="mt-2"
            >
              Limpar filtros
            </Button>
          )}
        </motion.div>
      )}
        </div>
        <aside className="desktop-aside space-y-6 hidden xl:block">
          <div className="desktop-card bg-primary/5 border-primary/20">
            <h3 className="text-premium-small font-black uppercase tracking-widest text-primary mb-3">Sua Formação</h3>
            <p className="text-xs text-muted-foreground leading-relaxed italic">
              Percorra trilhas guiadas pela tradição da Igreja. Cada passo aproxima você da verdade que liberta.
            </p>
          </div>
          <div className="desktop-card">
            <h3 className="text-premium-small font-black uppercase tracking-widest text-secondary mb-3">Mais Populares</h3>
            <div className="space-y-3">
              <div className="p-3 rounded-premium bg-muted/20 border border-border/40 text-premium-tiny font-bold text-foreground">1. O Caminho da Perfeição</div>
              <div className="p-3 rounded-premium bg-muted/20 border border-border/40 text-premium-tiny font-bold text-foreground">2. Catecismo Explicado</div>
              <div className="p-3 rounded-premium bg-muted/20 border border-border/40 text-premium-tiny font-bold text-foreground">3. Mistérios Gloriosos</div>
            </div>
          </div>
        </aside>
      </div>
    </ContemplativeLayout>
  );
});

JornadasPage.displayName = 'JornadasPage';

export default JornadasPage;
