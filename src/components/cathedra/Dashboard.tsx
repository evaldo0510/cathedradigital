import React, { useMemo, useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { AppRoute, User } from '../../types';
import { useAuth } from '../../hooks/useAuth';
import { useNotes } from '../../hooks/useNotes';
import { supabase } from '@/integrations/supabase/client';
import {
  BookOpen, Church, Cross, Heart, Flame, Star,
  CheckCircle2, Circle, ChevronRight, Pen,
  BookMarked, FileText, Sparkles, Hand
} from 'lucide-react';

interface DashboardProps {
  user: User | null;
}

/* ── Fade-up animation wrapper ── */
const FadeUp: React.FC<{ children: React.ReactNode; delay?: number; className?: string }> = ({ children, delay = 0, className }) => (
  <motion.div
    initial={{ opacity: 0, y: 16 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.6, delay, ease: 'easeOut' }}
    className={className}
  >
    {children}
  </motion.div>
);

/* ── Journey steps ── */
const JOURNEY_STEPS = [
  { id: 'faith', label: 'Fé', icon: Heart },
  { id: 'bible', label: 'Bíblia', icon: BookOpen },
  { id: 'christ', label: 'Cristo', icon: Cross },
  { id: 'church', label: 'Igreja', icon: Church },
  { id: 'sacraments', label: 'Sacramentos', icon: Star },
  { id: 'life', label: 'Vida Cristã', icon: Flame },
  { id: 'prayer', label: 'Oração', icon: Hand },
];

/* ── Rosary mysteries by day ── */
const ROSARY_DAY: Record<number, string> = {
  0: 'Gloriosos',
  1: 'Gozosos',
  2: 'Dolorosos',
  3: 'Gloriosos',
  4: 'Luminosos',
  5: 'Dolorosos',
  6: 'Gozosos',
};

/* ── Main Dashboard ── */
const Dashboard: React.FC<DashboardProps> = ({ user }) => {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const { notes } = useNotes('reflection');

  // Calculate completed steps (simple heuristic based on profile progress)
  const completedBooks = useMemo(() => profile?.completed_books || [], [profile?.completed_books]);
  const totalChaptersRead = useMemo(() => {
    // Simple heuristic: if they've read chapters, they've started Bible
    return completedBooks.length;
  }, [completedBooks]);

  // Determine which journey steps are complete
  const completedSteps = useMemo(() => {
    const steps = new Set<string>();
    // Faith is always the first — mark complete if user has any activity
    if (profile && (profile.xp ?? 0) > 0) steps.add('faith');
    if (totalChaptersRead > 0) steps.add('bible');
    return steps;
  }, [profile, totalChaptersRead]);

  const currentStepIndex = completedSteps.size;
  const currentStep = JOURNEY_STEPS[Math.min(currentStepIndex, JOURNEY_STEPS.length - 1)];

  // Last visited content
  const [lastVisit, setLastVisit] = useState<{ title: string; route: string } | null>(null);
  useEffect(() => {
    if (!user) return;
    supabase
      .from('user_history')
      .select('title, route')
      .eq('user_id', user.id)
      .order('visited_at', { ascending: false })
      .limit(1)
      .then(({ data }) => {
        if (data?.[0]) setLastVisit({ title: data[0].title, route: data[0].route });
      });
  }, [user]);

  const today = new Date();
  const mysteryOfDay = ROSARY_DAY[today.getDay()];
  const lastNote = notes[0];

  const goTo = useCallback((route: string) => navigate(route), [navigate]);

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 md:py-12 space-y-10 pb-24">

      {/* ═══ 1. HEADER ═══ */}
      <FadeUp>
        <div className="space-y-4 text-center">
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
            Cathedra Digital
          </p>
          <h1 className="text-3xl md:text-4xl font-serif font-bold text-foreground leading-tight">
            Bem-vindo de volta
          </h1>
          <p className="text-base text-muted-foreground font-serif italic">
            Sua jornada continua
          </p>

          <div className="pt-2 space-y-2">
            <p className="text-sm text-muted-foreground">
              Etapa: <span className="font-semibold text-foreground">{currentStep.label}</span>
            </p>
            <p className="text-sm text-muted-foreground">
              {completedSteps.size} de {JOURNEY_STEPS.length} completadas
            </p>
          </div>

          <button
            onClick={() => {
              const routes: Record<string, string> = {
                faith: AppRoute.CATECHISM,
                bible: AppRoute.BIBLE,
                christ: AppRoute.CATECHISM,
                church: AppRoute.MAGISTERIUM,
                sacraments: AppRoute.CATECHISM,
                life: AppRoute.CATECHISM,
                prayer: AppRoute.ORACAO,
              };
              goTo(routes[currentStep.id] || AppRoute.BIBLE);
            }}
            className="mt-4 w-full max-w-xs mx-auto px-8 py-4 bg-primary text-primary-foreground rounded-2xl font-semibold text-sm tracking-wide hover:opacity-90 transition-opacity shadow-lg shadow-primary/15"
          >
            Continuar sua jornada
          </button>
        </div>
      </FadeUp>

      {/* ═══ 2. PROGRESS – FAITH JOURNEY ═══ */}
      <FadeUp delay={0.1}>
        <div className="bg-card border border-border rounded-2xl p-6 shadow-sm space-y-5">
          <h2 className="text-lg font-serif font-bold text-foreground">Sua Jornada de Fé</h2>
          <div className="space-y-3">
            {JOURNEY_STEPS.map((step, i) => {
              const done = completedSteps.has(step.id);
              const Icon = step.icon;
              return (
                <div
                  key={step.id}
                  className={`flex items-center gap-3 py-2 transition-opacity ${
                    done ? 'opacity-100' : 'opacity-50'
                  }`}
                >
                  {done ? (
                    <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0" />
                  ) : (
                    <Circle className="w-5 h-5 text-muted-foreground/40 flex-shrink-0" />
                  )}
                  <Icon className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                  <span
                    className={`text-sm ${
                      done ? 'font-semibold text-foreground line-through decoration-primary/40' : 'text-muted-foreground'
                    }`}
                  >
                    {step.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </FadeUp>

      {/* ═══ 3. DAILY SUGGESTION ═══ */}
      <FadeUp delay={0.15}>
        <div className="bg-card border border-border rounded-2xl p-6 shadow-sm space-y-4">
          <h2 className="text-lg font-serif font-bold text-foreground">Hoje para você</h2>
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <BookOpen className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm text-muted-foreground">Leitura bíblica</p>
                <p className="text-sm font-semibold text-foreground">João 6</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <BookMarked className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm text-muted-foreground">Catecismo</p>
                <p className="text-sm font-semibold text-foreground">§1322</p>
              </div>
            </div>
          </div>
          <button
            onClick={() => goTo(AppRoute.BIBLE)}
            className="flex items-center gap-2 text-sm font-medium text-primary hover:underline"
          >
            Ler agora <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </FadeUp>

      {/* ═══ 4. CONTINUE WHERE LEFT OFF ═══ */}
      {lastVisit && (
        <FadeUp delay={0.2}>
          <div className="bg-card border border-border rounded-2xl p-6 shadow-sm space-y-3">
            <h2 className="text-lg font-serif font-bold text-foreground">Continue de onde parou</h2>
            <p className="text-sm text-muted-foreground">{lastVisit.title}</p>
            <button
              onClick={() => goTo(lastVisit.route)}
              className="flex items-center gap-2 text-sm font-medium text-primary hover:underline"
            >
              Continuar leitura <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </FadeUp>
      )}

      {/* ═══ 5. PRAYER SECTION ═══ */}
      <FadeUp delay={0.25}>
        <div className="bg-card border border-border rounded-2xl p-6 shadow-sm space-y-3">
          <h2 className="text-lg font-serif font-bold text-foreground">Momento de oração</h2>
          <div className="flex items-start gap-3">
            <Hand className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm text-muted-foreground">Rosário do dia</p>
              <p className="text-sm font-semibold text-foreground">Mistérios {mysteryOfDay}</p>
            </div>
          </div>
          <button
            onClick={() => goTo(AppRoute.ROSARY)}
            className="flex items-center gap-2 text-sm font-medium text-primary hover:underline"
          >
            Rezar agora <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </FadeUp>

      {/* ═══ 6. QUICK ACCESS ═══ */}
      <FadeUp delay={0.3}>
        <div className="grid grid-cols-4 gap-3">
          {[
            { label: 'Bíblia', icon: BookOpen, route: AppRoute.BIBLE },
            { label: 'Catecismo', icon: BookMarked, route: AppRoute.CATECHISM },
            { label: 'Documentos', icon: FileText, route: AppRoute.MAGISTERIUM },
            { label: 'Assistente', icon: Sparkles, route: AppRoute.STUDY_MODE },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.label}
                onClick={() => goTo(item.route)}
                className="flex flex-col items-center gap-2 py-4 rounded-2xl bg-card border border-border hover:border-primary/30 hover:shadow-sm transition-all"
              >
                <Icon className="w-5 h-5 text-primary" />
                <span className="text-[11px] font-medium text-muted-foreground">{item.label}</span>
              </button>
            );
          })}
        </div>
      </FadeUp>

      {/* ═══ 7. SPIRITUAL JOURNAL ═══ */}
      <FadeUp delay={0.35}>
        <div className="bg-card border border-border rounded-2xl p-6 shadow-sm space-y-3">
          <h2 className="text-lg font-serif font-bold text-foreground">Sua reflexão</h2>
          {lastNote ? (
            <p className="text-sm text-muted-foreground italic line-clamp-3">"{lastNote.note_text}"</p>
          ) : (
            <p className="text-sm text-muted-foreground italic">Nenhuma reflexão ainda. Comece hoje.</p>
          )}
          <button
            onClick={() => goTo(AppRoute.FAVORITES)}
            className="flex items-center gap-2 text-sm font-medium text-primary hover:underline"
          >
            <Pen className="w-3.5 h-3.5" /> Escrever reflexão
          </button>
        </div>
      </FadeUp>

      {/* ═══ 8. FOOTER TEXT ═══ */}
      <FadeUp delay={0.4}>
        <p className="text-center text-xs text-muted-foreground/60 font-serif italic pt-4">
          A fé cresce passo a passo.
        </p>
      </FadeUp>
    </div>
  );
};

export default Dashboard;
