import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import SEOHead from '@/components/SEOHead';
import { motion, AnimatePresence } from 'framer-motion';
import { Icons } from '@/constants';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { AppRoute } from '@/types';

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

const JornadasPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [journeys, setJourneys] = useState<any[]>([]);
  const [progressMap, setProgressMap] = useState<Record<string, number>>({});
  const [stepsCountMap, setStepsCountMap] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterDifficulty, setFilterDifficulty] = useState<string>('all');

  const categories = useMemo(() => {
    const cats = [...new Set(journeys.map(j => j.category))];
    return cats.sort();
  }, [journeys]);

  const difficulties = useMemo(() => {
    const normalize = (d: string) => d.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
    const seen = new Set<string>();
    const result: string[] = [];
    journeys.forEach(j => {
      const key = normalize(j.difficulty);
      if (!seen.has(key)) {
        seen.add(key);
        result.push(j.difficulty);
      }
    });
    return result;
  }, [journeys]);

  const difficultyMatches = (journeyDiff: string, filterDiff: string) => {
    const normalize = (d: string) => d.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
    return normalize(journeyDiff) === normalize(filterDiff);
  };

  const filteredJourneys = useMemo(() => {
    return journeys.filter(j => {
      if (filterCategory !== 'all' && j.category !== filterCategory) return false;
      if (filterDifficulty !== 'all' && !difficultyMatches(j.difficulty, filterDifficulty)) return false;
      return true;
    });
  }, [journeys, filterCategory, filterDifficulty]);

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
      const { data: journeyData } = await supabase
        .from('journeys')
        .select('*')
        .order('sort_order', { ascending: true });

      if (!journeyData) { setLoading(false); return; }
      setJourneys(journeyData);

      const { data: countsData } = await supabase
        .from('journey_steps')
        .select('journey_id')
        .in('journey_id', journeyData.map(j => j.id));

      const counts: Record<string, number> = {};
      countsData?.forEach(s => {
        counts[s.journey_id] = (counts[s.journey_id] || 0) + 1;
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
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 max-w-2xl mx-auto pb-24">
        <div className="text-center space-y-3 pt-4">
          <div className="w-8 h-8 mx-auto rounded-full bg-primary/20 animate-pulse" />
          <div className="h-7 w-48 mx-auto bg-muted/60 rounded-lg animate-pulse" />
          <div className="h-4 w-64 mx-auto bg-muted/40 rounded-lg animate-pulse" />
        </div>
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-44 rounded-2xl bg-muted/40 animate-pulse" style={{ animationDelay: `${i * 150}ms` }} />
          ))}
        </div>
      </div>
    );
  }

  const activeJourneys = journeys.filter(j => progressMap[j.id] > 0 && progressMap[j.id] < (stepsCountMap[j.id] || 0));

  return (
    <>
    <SEOHead title="Jornadas Espirituais" description="Percorra jornadas de transformação espiritual com conteúdos guiados de formação católica." path="/jornadas" keywords="jornada espiritual, formação católica, crescimento espiritual" breadcrumbs={[{ name: "Início", path: "/" }, { name: "Jornadas", path: "/jornadas" }]} />
    <div className="space-y-6 max-w-2xl mx-auto pb-24">
      {/* Header */}
      <motion.div 
        className="text-center space-y-3 pt-4"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Icons.Compass className="w-8 h-8 mx-auto text-primary" />
        <h1 className="text-2xl md:text-3xl font-bold font-serif text-foreground">Jornadas Espirituais</h1>
        <p className="text-muted-foreground font-serif italic max-w-md mx-auto text-sm">
          "Não é sobre assistir… é sobre atravessar."
        </p>
      </motion.div>

      {/* Stats bar */}
      {stats.started > 0 && (
        <motion.div 
          className="flex items-center justify-center gap-6 py-3 px-4 bg-muted/50 rounded-2xl"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
        >
          <div className="text-center">
            <p className="text-lg font-black text-foreground">{stats.total}</p>
            <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">Jornadas</p>
          </div>
          <div className="w-px h-8 bg-border" />
          <div className="text-center">
            <p className="text-lg font-black text-primary">{stats.started}</p>
            <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">Iniciadas</p>
          </div>
          <div className="w-px h-8 bg-border" />
          <div className="text-center">
            <p className="text-lg font-black text-emerald-500">{stats.completed}</p>
            <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">Concluídas</p>
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
            <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-primary/60">
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
                  <Card className="border-primary/40 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border-2 overflow-hidden shadow-xl shadow-primary/5 relative cursor-pointer" onClick={() => navigate(`/jornadas/${journey.id}`)}>
                    <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                      <Icons.Flame className="w-16 h-16 text-primary" />
                    </div>
                    <CardContent className="p-5 space-y-3">
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-bold text-foreground text-lg">{journey.title}</h3>
                          {journey.subtitle && (
                            <p className="text-xs text-muted-foreground font-serif italic mt-0.5">{journey.subtitle}</p>
                          )}
                        </div>
                        <div className="relative w-14 h-14 flex-shrink-0">
                          <svg className="w-14 h-14 -rotate-90" viewBox="0 0 36 36">
                            <circle cx="18" cy="18" r="15.5" fill="none" className="stroke-muted" strokeWidth="3" />
                            <circle cx="18" cy="18" r="15.5" fill="none" className="stroke-primary" strokeWidth="3" strokeDasharray={`${pct} 100`} strokeLinecap="round" />
                          </svg>
                          <span className="absolute inset-0 flex items-center justify-center text-xs font-black text-primary">{pct}%</span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <p className="text-[10px] text-muted-foreground font-medium">{done} de {total} etapas</p>
                        <Button 
                          size="sm" 
                          className="bg-primary hover:bg-primary/90 text-white font-black text-[9px] uppercase tracking-[0.15em] px-5 h-9 rounded-xl shadow-lg shadow-primary/20 group"
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
          <Card className="border-primary/20 bg-gradient-to-r from-primary/5 to-transparent overflow-hidden">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
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

      {/* Filters */}
      <motion.div 
        className="space-y-3"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Icons.Filter className="w-4 h-4" />
          <span className="font-medium">Filtrar</span>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setFilterCategory('all')}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all duration-200 ${
              filterCategory === 'all' ? 'bg-foreground text-background shadow-md' : 'bg-muted text-muted-foreground hover:bg-muted/80'
            }`}
          >
            Todas
          </button>
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setFilterCategory(cat)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all duration-200 flex items-center gap-1.5 ${
                filterCategory === cat ? 'bg-foreground text-background shadow-md' : 'bg-muted text-muted-foreground hover:bg-muted/80'
              }`}
            >
              {CATEGORY_ICONS[cat] ? React.cloneElement(CATEGORY_ICONS[cat] as React.ReactElement, { className: 'w-3.5 h-3.5' }) : null}
              {CATEGORY_LABELS[cat] || cat}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setFilterDifficulty('all')}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all duration-200 ${
              filterDifficulty === 'all' ? 'bg-foreground text-background shadow-md' : 'bg-muted text-muted-foreground hover:bg-muted/80'
            }`}
          >
            Todos os níveis
          </button>
          {difficulties.map(diff => (
            <button
              key={diff}
              onClick={() => setFilterDifficulty(diff)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all duration-200 ${
                filterDifficulty === diff ? 'bg-foreground text-background shadow-md' : 'bg-muted text-muted-foreground hover:bg-muted/80'
              }`}
            >
              {DIFFICULTY_LABELS[diff] || diff}
            </button>
          ))}
        </div>
      </motion.div>

      {/* Journey Cards */}
      <motion.div 
        className="space-y-4"
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
                    className={`overflow-hidden cursor-pointer transition-all group relative ${
                      isComplete 
                        ? 'border-emerald-500/30 ring-1 ring-emerald-500/10' 
                        : hasStarted 
                          ? 'border-primary/20'
                          : 'border-border hover:border-primary/30'
                    }`}
                    onClick={() => navigate(`/jornadas/${journey.id}`)}
                  >
                    {/* Gradient accent */}
                    <div className={`absolute inset-0 bg-gradient-to-br ${gradientClass} opacity-60 pointer-events-none`} />
                    
                    {journey.cover_url && (
                      <div className="relative w-full h-32 overflow-hidden">
                        <img
                          src={journey.cover_url}
                          alt={journey.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                          loading="lazy"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-card via-card/40 to-transparent" />
                        {isComplete && (
                          <div className="absolute top-3 right-3 bg-emerald-500 text-white px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest flex items-center gap-1 shadow-lg">
                            <Icons.Check className="w-3 h-3" /> Concluída
                          </div>
                        )}
                      </div>
                    )}

                    <CardContent className="p-5 space-y-3.5 relative">
                      {/* Title row */}
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            <div className="w-8 h-8 rounded-xl bg-muted/80 flex items-center justify-center opacity-80 group-hover:opacity-100 transition-opacity">
                              {CATEGORY_ICONS[journey.category] || <Icons.BookOpen className="w-4 h-4" />}
                            </div>
                            <div className="flex-1 min-w-0">
                              <h2 className="text-base font-bold font-serif text-foreground truncate">{journey.title}</h2>
                              {journey.subtitle && (
                                <p className="text-xs text-muted-foreground font-serif italic truncate">{journey.subtitle}</p>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          {journey.is_premium && (
                            <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20 text-[9px] px-2">
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
                            <span key={tag} className="text-[9px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground font-medium">
                              {tag}
                            </span>
                          ))}
                          {journey.tags.length > 3 && (
                            <span className="text-[9px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground font-medium">
                              +{journey.tags.length - 3}
                            </span>
                          )}
                        </div>
                      )}

                      {/* Meta */}
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Icons.Clock className="w-3.5 h-3.5" /> ~{journey.estimated_days}d
                        </span>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${DIFFICULTY_COLORS[journey.difficulty] || 'bg-muted text-muted-foreground'}`}>
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
                          <div className="flex justify-between text-[10px] text-muted-foreground">
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
          <div className="w-16 h-16 mx-auto rounded-2xl bg-muted/50 flex items-center justify-center mb-4">
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
    </>
  );
};

export default JornadasPage;
