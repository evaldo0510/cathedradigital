import React, { useState, useCallback, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Icons } from '../../constants';
import { AppRoute } from '../../types';
import { Sprout, Scale, HandHeart, Cross, ScrollText, ChevronDown, ChevronRight, Check, PartyPopper } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import confetti from 'canvas-confetti';

interface TrailStep {
  label: string;
  route: AppRoute;
  description: string;
}

interface Trail {
  id: string;
  title: string;
  description: string;
  level: string;
  icon: React.ReactNode;
  color: string;
  steps: TrailStep[];
}

const TRAILS: Trail[] = [
  {
    id: 'basics', title: 'Fundamentos da Fé', description: 'O caminho essencial para quem está começando a compreender a fé católica.',
    level: 'Iniciante', icon: <Sprout className="w-6 h-6" />, color: 'text-green-600 dark:text-green-400',
    steps: [
      { label: 'O que é a fé?', route: AppRoute.CATECHISM, description: 'Catecismo §§ 1-25: O desejo de Deus e a revelação.' },
      { label: 'A Sagrada Escritura', route: AppRoute.BIBLE, description: 'Introdução à Bíblia: como ler e entender.' },
      { label: 'O Credo', route: AppRoute.CATECHISM, description: 'Catecismo §§ 185-278: A profissão de fé.' },
      { label: 'Os Sacramentos', route: AppRoute.CATECHISM, description: 'Catecismo §§ 1210-1419: Os sete sacramentos.' },
      { label: 'A Oração', route: AppRoute.ORACAO, description: 'Aprenda a rezar: Pai Nosso, Ave Maria, Rosário.' },
    ]
  },
  {
    id: 'moral', title: 'Vida Moral Cristã', description: 'Entenda os princípios morais que orientam a vida do cristão.',
    level: 'Intermediário', icon: <Scale className="w-6 h-6" />, color: 'text-secondary dark:text-secondary',
    steps: [
      { label: 'A dignidade da pessoa', route: AppRoute.CATECHISM, description: 'Catecismo §§ 1700-1761: O homem à imagem de Deus.' },
      { label: 'As virtudes', route: AppRoute.CATECHISM, description: 'As 4 virtudes cardeais e as 3 teologais.' },
      { label: 'Os Dez Mandamentos', route: AppRoute.CATECHISM, description: 'Catecismo §§ 2052-2557: A lei de Deus.' },
      { label: 'As Bem-Aventuranças', route: AppRoute.BIBLE, description: 'Mateus 5,3-12: O programa da vida cristã.' },
      { label: 'Quiz: Moral Cristã', route: AppRoute.CERTAMEN, description: 'Teste seus conhecimentos sobre a moral.' },
    ]
  },
  {
    id: 'prayer-life', title: 'Vida de Oração', description: 'Aprofunde sua intimidade com Deus através das diversas formas de oração.',
    level: 'Iniciante', icon: <HandHeart className="w-6 h-6" />, color: 'text-secondary dark:text-rose-400',
    steps: [
      { label: 'O que é oração?', route: AppRoute.CATECHISM, description: 'Catecismo §§ 2558-2565: A oração na vida cristã.' },
      { label: 'O Santo Rosário', route: AppRoute.ROSARY, description: 'Aprenda e reze os quatro mistérios do Rosário.' },
      { label: 'A Via Sacra', route: AppRoute.VIA_CRUCIS, description: 'Medite as 14 estações da Paixão de Cristo.' },
      { label: 'Orações tradicionais', route: AppRoute.ORACAO, description: 'Pai Nosso, Ave Maria, Salve Rainha e mais.' },
      { label: 'A Santa Missa', route: AppRoute.MISSAL, description: 'Entenda e acompanhe o Ordinário da Missa.' },
    ]
  },
  {
    id: 'christology', title: 'Quem é Jesus Cristo?', description: 'Estudo aprofundado sobre a pessoa de Cristo na Escritura e na Tradição.',
    level: 'Intermediário', icon: <Cross className="w-6 h-6" />, color: 'text-purple-600 dark:text-purple-400',
    steps: [
      { label: 'O Verbo se fez carne', route: AppRoute.BIBLE, description: 'João 1,1-18: O Prólogo do Evangelho.' },
      { label: 'A Encarnação', route: AppRoute.CATECHISM, description: 'Catecismo §§ 456-483: Por que o Verbo se fez carne.' },
      { label: 'Mistério Pascal', route: AppRoute.CATECHISM, description: 'Catecismo §§ 571-655: Paixão, Morte e Ressurreição.' },
      { label: 'Cristo na Suma Teológica', route: AppRoute.AQUINAS_OPERA, description: 'IIIa Pars: A conveniência da Encarnação.' },
      { label: 'Os Santos e Cristo', route: AppRoute.SAINTS, description: 'Como os santos viveram o seguimento de Cristo.' },
    ]
  },
  {
    id: 'magisterium-intro', title: 'Introdução ao Magistério', description: 'Conheça os principais documentos e ensinamentos da Igreja.',
    level: 'Avançado', icon: <ScrollText className="w-6 h-6" />, color: 'text-red-600 dark:text-red-400',
    steps: [
      { label: 'O que é o Magistério?', route: AppRoute.CATECHISM, description: 'Catecismo §§ 85-100: O papel do Magistério.' },
      { label: 'Os Concílios', route: AppRoute.MAGISTERIUM, description: 'De Niceia ao Vaticano II: os grandes Concílios.' },
      { label: 'Encíclicas papais', route: AppRoute.MAGISTERIUM, description: 'Documentos fundamentais dos Papas.' },
      { label: 'Doutrina Social', route: AppRoute.MAGISTERIUM, description: 'Rerum Novarum e a tradição social da Igreja.' },
      { label: 'São Tomás de Aquino', route: AppRoute.AQUINAS_OPERA, description: 'A Suma Teológica e seu impacto na teologia.' },
    ]
  },
];

const LEVEL_COLORS: Record<string, string> = {
  'Iniciante': 'bg-primary/5 text-primary border border-primary/20',
  'Intermediário': 'bg-secondary/10 text-secondary border border-secondary/20',
  'Avançado': 'bg-primary/20 text-primary font-bold border border-primary/30',
};

const STORAGE_KEY = 'cathedra-trail-progress';

function loadLocalProgress(): Record<string, boolean[]> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveLocalProgress(progress: Record<string, boolean[]>) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
}

function dbToProgress(rows: { trail_id: string; step_index: number }[]): Record<string, boolean[]> {
  const result: Record<string, boolean[]> = {};
  for (const row of rows) {
    const trail = TRAILS.find(t => t.id === row.trail_id);
    if (!trail) continue;
    if (!result[row.trail_id]) result[row.trail_id] = new Array(trail.steps.length).fill(false);
    if (row.step_index < trail.steps.length) result[row.trail_id][row.step_index] = true;
  }
  return result;
}

function fireConfetti() {
  const duration = 2000;
  const end = Date.now() + duration;
  const frame = () => {
    confetti({ particleCount: 3, angle: 60, spread: 55, origin: { x: 0 }, colors: ['#c8a96e', '#8B5E3C', '#d4af37'] });
    confetti({ particleCount: 3, angle: 120, spread: 55, origin: { x: 1 }, colors: ['#c8a96e', '#8B5E3C', '#d4af37'] });
    if (Date.now() < end) requestAnimationFrame(frame);
  };
  frame();
}

const TrilhasPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [expandedTrail, setExpandedTrail] = useState<string | null>(null);
  const [progress, setProgress] = useState<Record<string, boolean[]>>(loadLocalProgress);
  const completedTrailsRef = useRef<Set<string>>(new Set());

  // Load from DB when user is logged in
  useEffect(() => {
    if (!user) return;
    const load = async () => {
      const { data, error } = await supabase
        .from('trail_progress')
        .select('trail_id, step_index')
        .eq('user_id', user.id);
      if (error) {
        console.error('Error loading trail progress:', error);
        return;
      }
      if (data && data.length > 0) {
        const dbProgress = dbToProgress(data);
        setProgress(dbProgress);
        saveLocalProgress(dbProgress);
        // Track already-completed trails so we don't fire confetti on load
        for (const trail of TRAILS) {
          const arr = dbProgress[trail.id] || [];
          if (arr.length === trail.steps.length && arr.every(Boolean)) {
            completedTrailsRef.current.add(trail.id);
          }
        }
      }
    };
    load();
  }, [user]);

  const toggleStep = useCallback(async (trailId: string, stepIndex: number, e: React.MouseEvent) => {
    e.stopPropagation();
    const trail = TRAILS.find(t => t.id === trailId)!;
    
    setProgress(prev => {
      const current = prev[trailId] || new Array(trail.steps.length).fill(false);
      const updated = [...current];
      const wasCompleted = updated[stepIndex];
      updated[stepIndex] = !wasCompleted;
      const next = { ...prev, [trailId]: updated };
      saveLocalProgress(next);

      // Check if trail just became fully completed
      const allDone = updated.every(Boolean);
      if (allDone && !completedTrailsRef.current.has(trailId)) {
        completedTrailsRef.current.add(trailId);
        fireConfetti();
        toast.success(`🎉 Trilha "${trail.title}" concluída!`, { description: 'Parabéns pela sua dedicação!' });
      } else if (!allDone) {
        completedTrailsRef.current.delete(trailId);
      }

      // Sync with DB
      if (user) {
        if (!wasCompleted) {
          supabase.from('trail_progress').insert({
            user_id: user.id,
            trail_id: trailId,
            step_index: stepIndex,
          }).then(({ error }) => { if (error) console.error('Error saving progress:', error); });
        } else {
          supabase.from('trail_progress')
            .delete()
            .eq('user_id', user.id)
            .eq('trail_id', trailId)
            .eq('step_index', stepIndex)
            .then(({ error }) => { if (error) console.error('Error removing progress:', error); });
        }
      }

      return next;
    });
  }, [user]);

  const getCompleted = (trailId: string) => (progress[trailId] || []).filter(Boolean).length;

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary/10 rounded-full">
          <Icons.Feather className="w-4 h-4 text-primary" />
          <span className="text-[9px] font-black uppercase tracking-[0.2em] text-primary">Itinerarium</span>
        </div>
        <h1 className="text-3xl md:text-5xl font-serif font-bold text-foreground">Trilhas de Estudo</h1>
        <p className="text-muted-foreground font-serif italic max-w-lg mx-auto">Percursos formativos organizados para guiar sua formação na fé.</p>
      </div>

      <div className="space-y-4">
        {TRAILS.map(trail => {
          const completed = getCompleted(trail.id);
          const total = trail.steps.length;
          const pct = Math.round((completed / total) * 100);
          const isFullyDone = completed === total;

          return (
            <div key={trail.id} className={`bg-card border rounded-2xl overflow-hidden transition-all ${isFullyDone ? 'border-primary/50 shadow-md' : 'border-border hover:border-primary/30'}`}>
              <button
                onClick={() => setExpandedTrail(expandedTrail === trail.id ? null : trail.id)}
                className="w-full p-6 flex items-start gap-4 text-left hover:bg-primary/5 transition-all"
              >
                <div className={`w-12 h-12 rounded-xl bg-muted flex items-center justify-center shrink-0 ${trail.color}`}>
                  {isFullyDone ? <PartyPopper className="w-6 h-6" /> : trail.icon}
                </div>
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-lg font-serif font-bold text-foreground">{trail.title}</h3>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${LEVEL_COLORS[trail.level]}`}>{trail.level}</span>
                    {isFullyDone && <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-primary/10 text-primary">✓ Concluída</span>}
                  </div>
                  <p className="text-sm text-muted-foreground font-serif">{trail.description}</p>
                  <div className="flex items-center gap-3">
                    <Progress value={pct} className="h-2 flex-1" />
                    <span className="text-[11px] font-bold text-muted-foreground whitespace-nowrap">{completed}/{total}</span>
                  </div>
                </div>
                <ChevronDown className={`w-5 h-5 text-muted-foreground transition-transform mt-1 ${expandedTrail === trail.id ? 'rotate-180' : ''}`} />
              </button>

              {expandedTrail === trail.id && (
                <div className="border-t border-border px-6 pb-6 pt-2">
                  <div className="space-y-2">
                    {trail.steps.map((step, i) => {
                      const done = progress[trail.id]?.[i] ?? false;
                      return (
                        <div key={i} className="flex items-center gap-2">
                          <button
                            onClick={(e) => toggleStep(trail.id, i, e)}
                            className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-black shrink-0 transition-colors ${
                              done
                                ? 'bg-primary text-primary-foreground'
                                : 'bg-foreground text-background'
                            }`}
                          >
                            {done ? <Check className="w-4 h-4" /> : i + 1}
                          </button>
                          <button
                            onClick={() => navigate(step.route)}
                            className="flex-1 flex items-center gap-3 p-3 rounded-xl text-left hover:bg-primary/5 transition-all group"
                          >
                            <div className="flex-1">
                              <p className={`font-bold text-sm transition-colors ${done ? 'text-muted-foreground line-through' : 'text-foreground group-hover:text-primary'}`}>{step.label}</p>
                              <p className="text-xs text-muted-foreground">{step.description}</p>
                            </div>
                            <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default TrilhasPage;
