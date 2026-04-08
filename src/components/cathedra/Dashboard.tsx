import React, { useMemo, useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { AppRoute, User } from '../../types';
import { useAuth } from '../../hooks/useAuth';
import { useNotes } from '../../hooks/useNotes';
import { supabase } from '@/integrations/supabase/client';
import type { Saint } from '@/data/saints';
import SacredImage from './SacredImage';
import {
  BookOpen, Church, Cross, Heart, Flame, Star,
  CheckCircle2, Circle, ChevronRight, Pen, Send,
  BookMarked, FileText, Sparkles, Hand, X, Zap
} from 'lucide-react';

interface DashboardProps {
  user: User | null;
}

/* ── Fade-up animation ── */
interface FadeUpProps {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}

const FadeUp = React.forwardRef<HTMLDivElement, FadeUpProps>(({ children, delay = 0, className }, ref) => (
  <motion.div
    ref={ref}
    initial={{ opacity: 0, y: 18 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.7, delay, ease: [0.25, 0.46, 0.45, 0.94] }}
    className={className}
  >
    {children}
  </motion.div>
));

FadeUp.displayName = 'FadeUp';

/* ── Journey steps ── */
const JOURNEY_STEPS = [
  { id: 'faith', label: 'Fé', icon: Heart, verse: 'Hb 11,1' },
  { id: 'bible', label: 'Sagrada Escritura', icon: BookOpen, verse: '2Tm 3,16' },
  { id: 'christ', label: 'Cristo', icon: Cross, verse: 'Jo 14,6' },
  { id: 'church', label: 'Igreja', icon: Church, verse: 'Mt 16,18' },
  { id: 'sacraments', label: 'Sacramentos', icon: Star, verse: 'CIC §1131' },
  { id: 'life', label: 'Vida Cristã', icon: Flame, verse: 'Gl 5,22' },
  { id: 'prayer', label: 'Oração', icon: Hand, verse: '1Ts 5,17' },
];

/* ── Rosary mysteries ── */
const ROSARY_DAY: Record<number, string> = {
  0: 'Gloriosos', 1: 'Gozosos', 2: 'Dolorosos',
  3: 'Gloriosos', 4: 'Luminosos', 5: 'Dolorosos', 6: 'Gozosos',
};

/* ── Bible reading plan (sequential, by day-of-year) ── */
const BIBLE_READINGS = [
  { ref: 'Gênesis 1-2', book: 'Gn', chapter: 1 },
  { ref: 'Gênesis 3-4', book: 'Gn', chapter: 3 },
  { ref: 'Gênesis 5-6', book: 'Gn', chapter: 5 },
  { ref: 'Salmo 1', book: 'Sl', chapter: 1 },
  { ref: 'Mateus 1-2', book: 'Mt', chapter: 1 },
  { ref: 'Mateus 3-4', book: 'Mt', chapter: 3 },
  { ref: 'João 1', book: 'Jo', chapter: 1 },
  { ref: 'João 3', book: 'Jo', chapter: 3 },
  { ref: 'João 6', book: 'Jo', chapter: 6 },
  { ref: 'João 14', book: 'Jo', chapter: 14 },
  { ref: 'Romanos 1-2', book: 'Rm', chapter: 1 },
  { ref: 'Romanos 8', book: 'Rm', chapter: 8 },
  { ref: 'Salmo 23', book: 'Sl', chapter: 23 },
  { ref: 'Salmo 51', book: 'Sl', chapter: 51 },
  { ref: 'Isaías 40', book: 'Is', chapter: 40 },
  { ref: 'Isaías 53', book: 'Is', chapter: 53 },
  { ref: 'Lucas 1', book: 'Lc', chapter: 1 },
  { ref: 'Lucas 2', book: 'Lc', chapter: 2 },
  { ref: 'Lucas 15', book: 'Lc', chapter: 15 },
  { ref: 'Atos 2', book: 'At', chapter: 2 },
];

/* ── Catechism paragraphs by journey step ── */
const CIC_BY_STEP: Record<string, { para: number; topic: string }> = {
  faith: { para: 26, topic: 'Profissão de Fé' },
  bible: { para: 101, topic: 'A Sagrada Escritura' },
  christ: { para: 422, topic: 'Jesus Cristo, Filho Único' },
  church: { para: 748, topic: 'A Igreja de Cristo' },
  sacraments: { para: 1210, topic: 'Os Sete Sacramentos' },
  life: { para: 1691, topic: 'A Vida em Cristo' },
  prayer: { para: 2558, topic: 'A Oração Cristã' },
};

/* ── Spiritual quotes ── */
const QUOTES = [
  { text: '"Tarde te amei, beleza tão antiga e tão nova."', author: 'Santo Agostinho' },
  { text: '"Nada te perturbe, nada te espante. Só Deus basta."', author: 'Santa Teresa de Ávila' },
  { text: '"Fazei tudo por amor. Nada por força."', author: 'São Francisco de Sales' },
  { text: '"A oração é a elevação da alma a Deus."', author: 'São João Damasceno' },
  { text: '"Sê quem Deus quis que fosses e incendiarás o mundo."', author: 'Santa Catarina de Sena' },
  { text: '"Onde não há amor, ponha amor e recolherás amor."', author: 'São João da Cruz' },
  { text: '"Tudo posso naquele que me fortalece."', author: 'Filipenses 4,13' },
];

/* ── Main Dashboard ── */
const Dashboard: React.FC<DashboardProps> = ({ user }) => {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const { notes, addNote } = useNotes('reflection');

  // Lazy-load saints data
  const [saintsData, setSaintsData] = useState<import('@/data/saints').Saint[]>([]);
  useEffect(() => {
    import('@/data/saints').then(m => setSaintsData(m.SAINTS_DATA));
  }, []);

  // Reflection writing state
  const [showReflection, setShowReflection] = useState(false);
  const [reflectionText, setReflectionText] = useState('');
  const [saving, setSaving] = useState(false);
  const [justSaved, setJustSaved] = useState(false);

  // Active journeys progress
  const [activeJourneys, setActiveJourneys] = useState<{ id: string; title: string; icon: string; totalSteps: number; completedSteps: number }[]>([]);
  useEffect(() => {
    if (!user) return;
    const loadJourneyProgress = async () => {
      // Get journeys user has progress in
      const { data: progress } = await supabase
        .from('journey_progress')
        .select('journey_id, step_id')
        .eq('user_id', user.id);
      if (!progress?.length) return;

      const journeyIds = [...new Set(progress.map(p => p.journey_id))];
      const { data: journeys } = await supabase
        .from('journeys')
        .select('id, title, icon')
        .in('id', journeyIds);
      if (!journeys) return;

      // Get total steps per journey
      const { data: steps } = await supabase
        .from('journey_steps')
        .select('id, journey_id')
        .in('journey_id', journeyIds);

      const stepsByJourney: Record<string, number> = {};
      steps?.forEach(s => { stepsByJourney[s.journey_id] = (stepsByJourney[s.journey_id] || 0) + 1; });

      const completedByJourney: Record<string, number> = {};
      progress.forEach(p => { completedByJourney[p.journey_id] = (completedByJourney[p.journey_id] || 0) + 1; });

      setActiveJourneys(journeys.map(j => ({
        id: j.id,
        title: j.title,
        icon: j.icon,
        totalSteps: stepsByJourney[j.id] || 0,
        completedSteps: completedByJourney[j.id] || 0,
      })));
    };
    loadJourneyProgress();
  }, [user]);

  // Completed books & chapters
  const completedBooks = useMemo(() => profile?.completed_books || [], [profile?.completed_books]);

  // Load real chapters-read count
  const [totalChaptersRead, setTotalChaptersRead] = useState(0);
  useEffect(() => {
    if (!user) return;
    supabase
      .from('bible_chapters_read')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .then(({ count }) => { if (count) setTotalChaptersRead(count); });
  }, [user]);

  // Journey completion
  const completedSteps = useMemo(() => {
    const steps = new Set<string>();
    if (profile && (profile.xp ?? 0) > 0) steps.add('faith');
    if (totalChaptersRead > 0 || completedBooks.length > 0) steps.add('bible');
    return steps;
  }, [profile, totalChaptersRead, completedBooks]);

  const currentStepIndex = completedSteps.size;
  const currentStep = JOURNEY_STEPS[Math.min(currentStepIndex, JOURNEY_STEPS.length - 1)];

  const streak = profile?.streak || 0;

  // Dynamic daily suggestion based on progress
  const dailySuggestion = useMemo(() => {
    const dayOfYear = Math.floor(
      (Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000
    );
    // Bible: advance by chapters read
    const bibleIndex = (totalChaptersRead + dayOfYear) % BIBLE_READINGS.length;
    const bible = BIBLE_READINGS[bibleIndex];
    // Catechism: based on current journey step
    const cic = CIC_BY_STEP[currentStep.id] || CIC_BY_STEP.faith;
    return { bible, cic };
  }, [totalChaptersRead, currentStep]);

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
  const dailyQuote = QUOTES[Math.floor((Date.now() / 86400000)) % QUOTES.length];
  const lastNote = notes[0];

  const goTo = useCallback((route: string) => navigate(route), [navigate]);

  // Save reflection
  const handleSaveReflection = async () => {
    if (!reflectionText.trim() || saving) return;
    setSaving(true);
    const dateId = new Date().toISOString().split('T')[0];
    await addNote(dateId, reflectionText.trim(), 'gold');
    setSaving(false);
    setReflectionText('');
    setShowReflection(false);
    setJustSaved(true);
    setTimeout(() => setJustSaved(false), 3000);
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-10 md:py-16 space-y-12">

      {/* ═══ 1. HEADER — Spiritual greeting ═══ */}
      <FadeUp>
        <div className="text-center space-y-5">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 0.15 }}
            transition={{ duration: 1.2 }}
            className="text-6xl md:text-7xl leading-none select-none"
          >
            ✝
          </motion.div>
          <p className="text-[11px] font-medium uppercase tracking-[0.3em] text-muted-foreground/70">
            Cathedra Digital
          </p>
          <h1 className="text-3xl md:text-4xl font-display font-bold text-foreground leading-snug">
            Bem-vindo de volta
          </h1>
          <p className="text-lg text-muted-foreground font-serif italic leading-relaxed max-w-md mx-auto">
            Sua jornada continua.<br />
            <span className="text-sm">Etapa atual: <span className="text-foreground font-semibold">{currentStep.label}</span></span>
          </p>

          {/* Streak & XP badges */}
          <div className="flex items-center justify-center gap-4 flex-wrap">
            {streak > 0 && (
              <div className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-orange-500/10 border border-orange-500/20">
                <Flame className="w-4 h-4 text-orange-500" />
                <span className="text-sm font-bold text-orange-600 dark:text-orange-400">{streak} {streak === 1 ? 'dia' : 'dias'}</span>
              </div>
            )}
            <div className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-primary/10 border border-primary/20">
              <Zap className="w-4 h-4 text-primary" />
              <span className="text-sm font-bold text-primary">{profile?.xp || 0} XP</span>
            </div>
          </div>

          <p className="text-xs text-muted-foreground/60">
            {completedSteps.size} de {JOURNEY_STEPS.length} etapas percorridas
          </p>

          <div className="flex items-center justify-center gap-3">
            <button
              onClick={() => goTo(AppRoute.HOJE)}
              className="inline-flex items-center gap-2 px-8 py-4 bg-primary text-primary-foreground rounded-2xl font-semibold text-sm hover:opacity-90 transition-opacity shadow-lg shadow-primary/10"
            >
              Experiência do Dia <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </FadeUp>

      {/* ═══ ACTIVE JOURNEYS PROGRESS ═══ */}
      {activeJourneys.length > 0 && (
        <FadeUp delay={0.06}>
          <div className="bg-card border border-border rounded-2xl p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-serif font-bold text-foreground">Suas Jornadas</h2>
              <button onClick={() => goTo(AppRoute.JORNADAS)} className="text-xs text-primary hover:underline flex items-center gap-1">
                Ver todas <ChevronRight className="w-3 h-3" />
              </button>
            </div>
            <div className="space-y-3">
              {activeJourneys.map((j) => {
                const pct = j.totalSteps > 0 ? Math.round((j.completedSteps / j.totalSteps) * 100) : 0;
                return (
                  <button
                    key={j.id}
                    onClick={() => goTo(`/jornadas/${j.id}`)}
                    className="w-full flex items-center gap-3 p-3 rounded-xl bg-primary/[0.03] border border-primary/10 hover:border-primary/30 transition-colors text-left"
                  >
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-lg shrink-0">
                      {j.icon === 'compass' ? '🧭' : j.icon === 'cross' ? '✝' : j.icon === 'book-open' ? '📖' : '🙏'}
                    </div>
                    <div className="flex-1 min-w-0 space-y-1.5">
                      <p className="text-sm font-semibold text-foreground truncate">{j.title}</p>
                      <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
                        <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                    <span className="text-xs font-bold text-primary shrink-0">{pct}%</span>
                  </button>
                );
              })}
            </div>
          </div>
        </FadeUp>
      )}

      {/* ═══ PRO BANNER ═══ */}
      {!profile?.is_premium && (
        <FadeUp delay={0.07}>
          <button
            onClick={() => goTo(AppRoute.CHECKOUT)}
            className="w-full group relative overflow-hidden rounded-2xl border border-primary/20 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent p-5 md:p-6 text-left transition-all hover:border-primary/40 hover:shadow-lg hover:shadow-primary/10"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-primary/15 flex items-center justify-center shrink-0 group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                <Zap className="w-5 h-5 text-primary group-hover:text-primary-foreground" />
              </div>
              <div className="flex-1 min-w-0 space-y-1">
                <h3 className="font-bold text-foreground text-sm">Desbloqueie o Cathedra PRO</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  IA Teológica ilimitada, trilhas de formação e modo offline.{' '}
                  <span className="text-primary font-semibold">A partir de R$ 15,92/mês.</span>
                </p>
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
            </div>
          </button>
        </FadeUp>
      )}

      {/* ═══ DAILY QUOTE ═══ */}
      <FadeUp delay={0.05}>
        <div className="text-center py-6 border-y border-border/50 space-y-2">
          <p className="text-lg md:text-xl font-serif italic text-foreground/80 leading-relaxed max-w-lg mx-auto">
            {dailyQuote.text}
          </p>
          <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-primary/70">
            — {dailyQuote.author}
          </p>
        </div>
      </FadeUp>

      {/* ═══ 2. FAITH JOURNEY — Vertical path ═══ */}
      <FadeUp delay={0.1}>
        <div className="bg-card border border-border rounded-2xl p-6 md:p-8 shadow-sm space-y-5">
          <h2 className="text-lg font-serif font-bold text-foreground">Sua Jornada de Fé</h2>
          <div className="relative pl-4">
            {/* Vertical line */}
            <div className="absolute left-[9px] top-2 bottom-2 w-px bg-border" />
            <div className="space-y-4">
              {JOURNEY_STEPS.map((step) => {
                const done = completedSteps.has(step.id);
                const isCurrent = step.id === currentStep.id && !done;
                const Icon = step.icon;
                return (
                  <div key={step.id} className="relative flex items-center gap-4">
                    <div className="relative z-10">
                      {done ? (
                        <CheckCircle2 className="w-5 h-5 text-primary" />
                      ) : isCurrent ? (
                        <motion.div
                          animate={{ scale: [1, 1.2, 1] }}
                          transition={{ duration: 2, repeat: Infinity }}
                        >
                          <Circle className="w-5 h-5 text-primary" />
                        </motion.div>
                      ) : (
                        <Circle className="w-5 h-5 text-muted-foreground/25" />
                      )}
                    </div>
                    <Icon className={`w-4 h-4 flex-shrink-0 ${done || isCurrent ? 'text-primary/70' : 'text-muted-foreground/30'}`} />
                    <div className="flex-1 min-w-0">
                      <span className={`text-sm ${done ? 'text-foreground font-medium' : isCurrent ? 'text-foreground font-semibold' : 'text-muted-foreground/50'}`}>
                        {step.label}
                      </span>
                      {isCurrent && (
                        <p className="text-[10px] text-primary/60 mt-0.5">{step.verse}</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </FadeUp>

      {/* ═══ 3. DAILY SUGGESTION — Dynamic ═══ */}
      <FadeUp delay={0.15}>
        <div className="bg-card border border-border rounded-2xl p-6 shadow-sm space-y-5">
          <h2 className="text-lg font-serif font-bold text-foreground">Hoje para você</h2>
          <p className="text-xs text-muted-foreground/60 -mt-3 font-serif italic">
            Leitura sugerida para este dia
          </p>
          <div className="space-y-4">
            <div className="flex items-start gap-3 p-3 rounded-xl bg-primary/[0.03] border border-primary/10">
              <BookOpen className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-xs text-muted-foreground">Sagrada Escritura</p>
                <p className="text-sm font-serif font-semibold text-foreground">{dailySuggestion.bible.ref}</p>
              </div>
              <button
                onClick={() => goTo(`${AppRoute.BIBLE}?book=${dailySuggestion.bible.book}&ch=${dailySuggestion.bible.chapter}&from=dashboard`)}
                className="text-xs text-primary hover:underline flex items-center gap-1 mt-0.5"
              >
                Ler <ChevronRight className="w-3 h-3" />
              </button>
            </div>
            <div className="flex items-start gap-3 p-3 rounded-xl bg-primary/[0.03] border border-primary/10">
              <BookMarked className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-xs text-muted-foreground">Catecismo — {dailySuggestion.cic.topic}</p>
                <p className="text-sm font-serif font-semibold text-foreground">§{dailySuggestion.cic.para}</p>
              </div>
              <button
                onClick={() => goTo(`${AppRoute.CATECHISM}?p=${dailySuggestion.cic.para}&from=dashboard`)}
                className="text-xs text-primary hover:underline flex items-center gap-1 mt-0.5"
              >
                Ler <ChevronRight className="w-3 h-3" />
              </button>
            </div>
          </div>
        </div>
      </FadeUp>

      {/* ═══ 4. CONTINUE WHERE LEFT OFF ═══ */}
      {lastVisit && (
        <FadeUp delay={0.2}>
          <div className="bg-card border border-border rounded-2xl p-6 shadow-sm space-y-3">
            <h2 className="text-lg font-serif font-bold text-foreground">Continue de onde parou</h2>
            <p className="text-sm text-muted-foreground font-serif italic">{lastVisit.title}</p>
            <button
              onClick={() => goTo(lastVisit.route)}
              className="flex items-center gap-2 text-sm font-medium text-primary hover:underline"
            >
              Continuar leitura <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </FadeUp>
      )}

      {/* ═══ 5. PRAYER ═══ */}
      <FadeUp delay={0.25}>
        <div className="bg-card border border-border rounded-2xl p-6 shadow-sm space-y-4">
          <h2 className="text-lg font-serif font-bold text-foreground">Momento de oração</h2>
          <p className="text-xs text-muted-foreground/60 font-serif italic -mt-2">
            "Orai sem cessar" — 1Ts 5,17
          </p>
          <div className="flex items-start gap-3 p-3 rounded-xl bg-primary/[0.03] border border-primary/10">
            <Hand className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-xs text-muted-foreground">Rosário do dia</p>
              <p className="text-sm font-serif font-semibold text-foreground">Mistérios {mysteryOfDay}</p>
            </div>
            <button
              onClick={() => goTo(AppRoute.ROSARY)}
              className="text-xs text-primary hover:underline flex items-center gap-1 mt-0.5"
            >
              Rezar <ChevronRight className="w-3 h-3" />
            </button>
          </div>
        </div>
      </FadeUp>

      {/* ═══ SANTO DO DIA ═══ */}
      <FadeUp delay={0.28}>
        {(() => {
          const today = new Date();
          const saintOfDay = saintsData.find(s => s.feastMonth === today.getMonth() + 1 && s.feastDayNum === today.getDate()) || saintsData[0];
          return (
            <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
              <div className="flex items-stretch">
                <div className="w-24 md:w-32 flex-shrink-0">
                  <SacredImage src={saintOfDay.image || ''} alt={saintOfDay.name} className="w-full h-full min-h-[120px]" />
                </div>
                <div className="flex-1 p-4 md:p-5 space-y-1.5">
                  <p className="text-[9px] font-black uppercase tracking-widest text-primary flex items-center gap-1.5">
                    <Star className="w-3 h-3" /> Santo do Dia — {saintOfDay.feastDay}
                  </p>
                  <h3 className="text-base md:text-lg font-serif font-bold text-foreground">{saintOfDay.name}</h3>
                  <p className="text-xs text-primary/70 font-serif italic">{saintOfDay.title}</p>
                  <p className="text-xs text-muted-foreground font-serif italic line-clamp-2 leading-relaxed">{saintOfDay.quotes[0]}</p>
                  <button
                    onClick={() => goTo(AppRoute.SAINTS)}
                    className="flex items-center gap-1 text-xs font-medium text-primary hover:underline pt-1"
                  >
                    Conhecer sua vida <ChevronRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </div>
          );
        })()}
      </FadeUp>

      {/* ═══ 6. QUICK ACCESS ═══ */}
      <FadeUp delay={0.3}>
        <div className="grid grid-cols-4 gap-3">
          {[
            { label: 'Bíblia', icon: BookOpen, route: AppRoute.BIBLE },
            { label: 'Catecismo', icon: BookMarked, route: AppRoute.CATECHISM },
            { label: 'Magistério', icon: FileText, route: AppRoute.MAGISTERIUM },
            { label: 'Colloquium', icon: Sparkles, route: AppRoute.STUDY_MODE },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.label}
                onClick={() => goTo(item.route)}
                className="flex flex-col items-center gap-2.5 py-5 rounded-2xl bg-card border border-border hover:border-primary/30 hover:shadow-sm transition-all group"
              >
                <Icon className="w-5 h-5 text-primary group-hover:scale-110 transition-transform" />
                <span className="text-[10px] font-medium text-muted-foreground">{item.label}</span>
              </button>
            );
          })}
        </div>
      </FadeUp>

      {/* ═══ 7. SPIRITUAL JOURNAL — With inline writing ═══ */}
      <FadeUp delay={0.35}>
        <div className="bg-card border border-border rounded-2xl p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-serif font-bold text-foreground">Diário Espiritual</h2>
            {!showReflection && (
              <button
                onClick={() => setShowReflection(true)}
                className="flex items-center gap-1.5 text-xs font-medium text-primary hover:underline"
              >
                <Pen className="w-3.5 h-3.5" /> Escrever
              </button>
            )}
          </div>

          {/* Saved confirmation */}
          <AnimatePresence>
            {justSaved && (
              <motion.p
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="text-xs text-primary font-medium"
              >
                ✓ Reflexão salva com sucesso
              </motion.p>
            )}
          </AnimatePresence>

          {/* Inline writing area */}
          <AnimatePresence>
            {showReflection && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <div className="space-y-3">
                  <textarea
                    value={reflectionText}
                    onChange={(e) => setReflectionText(e.target.value)}
                    placeholder="O que Deus colocou em seu coração hoje?"
                    rows={4}
                    maxLength={2000}
                    className="w-full rounded-xl border border-border bg-background p-4 text-sm font-serif text-foreground placeholder:text-muted-foreground/50 placeholder:italic focus:outline-none focus:ring-1 focus:ring-primary/30 resize-none"
                  />
                  <div className="flex items-center justify-between">
                    <button
                      onClick={() => { setShowReflection(false); setReflectionText(''); }}
                      className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
                    >
                      <X className="w-3 h-3" /> Cancelar
                    </button>
                    <button
                      onClick={handleSaveReflection}
                      disabled={!reflectionText.trim() || saving}
                      className="flex items-center gap-1.5 px-5 py-2 bg-primary text-primary-foreground rounded-xl text-xs font-semibold hover:opacity-90 transition-opacity disabled:opacity-40"
                    >
                      <Send className="w-3 h-3" /> {saving ? 'Salvando...' : 'Salvar'}
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Last note */}
          {lastNote && !showReflection && (
            <div className="p-3 rounded-xl bg-primary/[0.03] border border-primary/10">
              <p className="text-sm text-foreground/80 font-serif italic leading-relaxed line-clamp-3">
                "{lastNote.note_text}"
              </p>
              <p className="text-[10px] text-muted-foreground/50 mt-2">
                {new Date(lastNote.created_at).toLocaleDateString('pt-BR', { day: 'numeric', month: 'long' })}
              </p>
            </div>
          )}
          {!lastNote && !showReflection && !justSaved && (
            <p className="text-sm text-muted-foreground font-serif italic">
              Registre seus pensamentos e inspirações diárias.
            </p>
          )}
        </div>
      </FadeUp>

      {/* Redundant footer removed as it is now global in App.tsx */}
    </div>
  );
};

export default Dashboard;
