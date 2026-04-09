import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Compass, Sparkles, Clock, ChevronRight, ArrowRight, Filter } from 'lucide-react';
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

const CATEGORY_ICONS: Record<string, string> = {
  fundamentos: '🌱',
  formacao: '📚',
  rotina: '🔁',
  oracao: '🙏',
  mistico: '✨',
  cura: '💛',
};

const JornadasPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [journeys, setJourneys] = useState<any[]>([]);
  const [progressMap, setProgressMap] = useState<Record<string, number>>({});
  const [stepsCountMap, setStepsCountMap] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

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

      // Load step counts per journey in parallel
      const { data: countsData } = await supabase
        .from('journey_steps')
        .select('journey_id')
        .in('journey_id', journeyData.map(j => j.id));

      const counts: Record<string, number> = {};
      countsData?.forEach(s => {
        counts[s.journey_id] = (counts[s.journey_id] || 0) + 1;
      });
      setStepsCountMap(counts);

      // Load user progress
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
      <div className="flex items-center justify-center min-h-[40vh]">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      {/* Header */}
      <div className="text-center space-y-3">
        <Compass className="w-10 h-10 mx-auto text-primary" />
        <h1 className="text-2xl md:text-3xl font-bold font-serif text-foreground">🌱 Jornadas de Transformação</h1>
        <p className="text-muted-foreground font-serif italic max-w-md mx-auto">
          "Não é sobre assistir… é sobre atravessar."
        </p>
      </div>

      {/* CTA Diagnóstico */}
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="p-4 flex items-center gap-4">
          <div className="flex-1">
            <p className="text-sm font-semibold text-foreground">Não sabe por onde começar?</p>
            <p className="text-xs text-muted-foreground">Faça nosso diagnóstico espiritual e descubra a jornada ideal.</p>
          </div>
          <Button size="sm" variant="outline" onClick={() => navigate(AppRoute.DIAGNOSTICO)}>
            Diagnóstico <ArrowRight className="w-4 h-4 ml-1" />
          </Button>
        </CardContent>
      </Card>

      {/* Journey Cards */}
      <div className="space-y-4">
        {journeys.map((journey, i) => {
          const totalSteps = stepsCountMap[journey.id] || 0;
          const completedSteps = progressMap[journey.id] || 0;
          const progressPercent = totalSteps > 0 ? (completedSteps / totalSteps) * 100 : 0;
          const hasStarted = completedSteps > 0;
          const isComplete = completedSteps >= totalSteps && totalSteps > 0;

          return (
            <motion.div
              key={journey.id}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
            >
              <Card
                className={`overflow-hidden cursor-pointer hover:border-primary/40 transition-all group ${
                  isComplete ? 'border-primary/30 bg-primary/5' : ''
                }`}
                onClick={() => navigate(`/jornadas/${journey.id}`)}
              >
                {journey.cover_url && (
                  <div className="w-full h-36 overflow-hidden">
                    <img
                      src={journey.cover_url}
                      alt={journey.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      loading="lazy"
                    />
                  </div>
                )}
                <CardContent className="p-5 space-y-4">
                  {/* Title row */}
                    <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="text-xl">{CATEGORY_ICONS[journey.category] || '📖'}</span>
                        <h2 className="text-lg font-bold font-serif text-foreground">{journey.title}</h2>
                        {journey.is_premium && (
                          <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20 text-[10px]">
                            <Sparkles className="w-3 h-3 mr-0.5" /> PRO
                          </Badge>
                        )}
                      </div>
                      {journey.subtitle && (
                        <p className="text-sm text-muted-foreground font-serif italic">{journey.subtitle}</p>
                      )}
                    </div>
                    <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors flex-shrink-0 mt-1" />
                  </div>

                  {/* Description */}
                  {journey.description && (
                    <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">{journey.description}</p>
                  )}

                  {/* Meta */}
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" /> ~{journey.estimated_days} dias
                    </span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${DIFFICULTY_COLORS[journey.difficulty] || 'bg-muted text-muted-foreground'}`}>
                      {DIFFICULTY_LABELS[journey.difficulty] || journey.difficulty}
                    </span>
                    <span>{totalSteps} etapas</span>
                  </div>

                  {/* Progress */}
                  {totalSteps > 0 && (
                    <div className="space-y-1.5">
                      <Progress value={progressPercent} className="h-1.5" />
                      <div className="flex justify-between text-[10px] text-muted-foreground">
                        <span>{hasStarted ? `${completedSteps}/${totalSteps} concluídas` : 'Não iniciada'}</span>
                        {isComplete && <span className="text-primary font-semibold">✓ Concluída</span>}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {journeys.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">Nenhuma jornada disponível ainda.</p>
        </div>
      )}
    </div>
  );
};

export default JornadasPage;
