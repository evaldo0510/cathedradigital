import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Icons } from '@/constants';
import { Button } from '@/components/ui/button';
import { MobileTopBar } from '@/components/mobile/MobileTopBar';
import { MobileBottomNav } from '@/components/mobile/MobileBottomNav';
import SEOHead from '@/components/SEOHead';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';

interface ContemplationStage {
  id: string;
  kicker: string;
  title: string;
  instruction: string;
  guidance: string;
  seconds: number; // sugestão de duração para o timer
  icon: React.ComponentType<{ className?: string }>;
}

const STAGES: ContemplationStage[] = [
  {
    id: 'preparatio',
    kicker: 'Preparação',
    title: 'Faça silêncio',
    instruction: 'Sente-se com as costas eretas. Feche os olhos e respire lentamente três vezes.',
    guidance: 'Deixe cair as preocupações do dia. Você está diante de Deus.',
    seconds: 60,
    icon: Icons.Feather,
  },
  {
    id: 'invocatio',
    kicker: 'Invocação',
    title: 'Chame o Espírito',
    instruction: 'Ore em silêncio: "Vinde, Espírito Santo. Ensina-me a estar diante de Vós."',
    guidance: 'Não busque sentimentos. Ofereça apenas a sua presença.',
    seconds: 90,
    icon: Icons.Sparkles,
  },
  {
    id: 'verbum',
    kicker: 'Palavra',
    title: 'Repouse na Palavra',
    instruction: 'Escolha uma frase breve — "Eis-me aqui, Senhor" — e a repita sem pressa no coração.',
    guidance: 'Se distrações surgirem, volte suavemente à frase.',
    seconds: 180,
    icon: Icons.Book,
  },
  {
    id: 'praesentia',
    kicker: 'Presença',
    title: 'Apenas estar',
    instruction: 'Solte a frase. Fique diante de Deus sem palavras, sem imagens. Deixe-se olhar por Ele.',
    guidance: 'A oração agora é receber. Não precisa "fazer" nada.',
    seconds: 300,
    icon: Icons.Sun,
  },
  {
    id: 'gratitudo',
    kicker: 'Gratidão',
    title: 'Agradeça e volte',
    instruction: 'Reze um Pai-Nosso lentamente. Agradeça o tempo dado a Deus e a Sua fidelidade.',
    guidance: 'Leve o silêncio para o resto do seu dia.',
    seconds: 90,
    icon: Icons.Heart,
  },
];

const STORAGE_KEY = 'cathedra:contemplatio:progress:v1';

interface ContemplationProgress {
  stageId: string;
  seconds: number;
  updatedAt: number;
}

function readProgress(): ContemplationProgress | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as ContemplationProgress) : null;
  } catch {
    return null;
  }
}

function writeProgress(p: ContemplationProgress) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(p));
  } catch {
    /* ignore */
  }
}

const formatTime = (s: number) =>
  `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`;

const ContemplatioPage: React.FC = () => {
  const navigate = useNavigate();

  const [started, setStarted] = useState(false);
  const [index, setIndex] = useState(0);
  const [seconds, setSeconds] = useState(0);
  const [completed, setCompleted] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Restaurar progresso local
  useEffect(() => {
    const saved = readProgress();
    if (saved) {
      const idx = STAGES.findIndex((s) => s.id === saved.stageId);
      if (idx >= 0) {
        setIndex(idx);
        setSeconds(saved.seconds || 0);
      }
    }
  }, []);

  const stage = STAGES[index];
  const total = STAGES.length;

  // Timer
  useEffect(() => {
    if (!started || completed) return;
    timerRef.current = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [started, completed]);

  // Persistir
  useEffect(() => {
    if (!started) return;
    writeProgress({ stageId: stage.id, seconds, updatedAt: Date.now() });
  }, [started, stage.id, seconds]);

  const goNext = useCallback(() => {
    if (index >= total - 1) {
      setCompleted(true);
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }
    setIndex((i) => i + 1);
  }, [index, total]);

  const goPrev = useCallback(() => {
    if (index === 0) return;
    setIndex((i) => i - 1);
  }, [index]);

  const restart = () => {
    setIndex(0);
    setSeconds(0);
    setCompleted(false);
    setStarted(true);
    writeProgress({ stageId: STAGES[0].id, seconds: 0, updatedAt: Date.now() });
  };

  const progressPct = useMemo(() => ((index + 1) / total) * 100, [index, total]);

  return (
    <>
      <SEOHead
        title="Modo Contemplação — Cathedra"
        description="Um roteiro guiado de oração contemplativa em cinco etapas: silêncio, invocação, palavra, presença e gratidão."
        path="/contemplatio"
      />
      <MobileTopBar title="Contemplatio" showBack onBack={() => navigate(-1)} />

      <main className="min-h-[100dvh] bg-background pb-[calc(var(--stitch-mobile-bottomnav-h)+var(--stitch-mobile-safe-bottom)+2rem)] md:pb-spacing-3xl">
        <div className="max-w-3xl mx-auto px-spacing-lg pt-spacing-2xl md:pt-spacing-3xl">
          {/* Intro */}
          {!started && !completed && (
            <motion.div
              className="text-center space-y-spacing-lg"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <div className="inline-flex items-center gap-spacing-xs px-spacing-md py-spacing-2xs bg-primary/5 border border-primary/10 rounded-premium">
                <Icons.Sun className="w-4 h-4 text-primary" />
                <span className="text-premium-xs font-black uppercase tracking-[0.2em] text-primary">
                  Modo Contemplação
                </span>
              </div>
              <h1 className="text-premium-4xl md:text-premium-6xl font-serif font-bold text-foreground tracking-tight">
                Repousar em Deus
              </h1>
              <p className="text-premium-lg text-muted-foreground font-serif italic leading-relaxed max-w-xl mx-auto">
                Um roteiro breve em cinco etapas para orar em silêncio. Sem barulho, sem
                notificações. Apenas o coração diante do Senhor.
              </p>
              <Button
                onClick={() => setStarted(true)}
                className="rounded-premium-full h-12 px-spacing-xl text-premium-xs font-black uppercase tracking-[0.2em] bg-foreground text-background hover:bg-primary hover:text-primary-foreground"
              >
                Iniciar Contemplação
                <Icons.ArrowRight className="w-4 h-4 ml-spacing-2xs" />
              </Button>

              <div className="grid grid-cols-2 md:grid-cols-5 gap-spacing-md pt-spacing-xl">
                {STAGES.map((s, i) => (
                  <div
                    key={s.id}
                    className="rounded-[1.5rem] border border-border bg-card p-spacing-md text-center space-y-spacing-xs"
                  >
                    <div className="mx-auto w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <s.icon className="w-4 h-4 text-primary" />
                    </div>
                    <p className="text-premium-xs font-black uppercase tracking-widest text-primary/60">
                      {i + 1}. {s.kicker}
                    </p>
                    <p className="font-serif text-premium-sm text-foreground">{s.title}</p>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Ativo */}
          {started && !completed && (
            <div className="space-y-spacing-xl">
              {/* Barra + timer */}
              <div className="space-y-spacing-sm">
                <div className="flex items-center justify-between text-premium-xs text-muted-foreground">
                  <span className="font-black uppercase tracking-widest">
                    Etapa {index + 1} de {total}
                  </span>
                  <span className="font-mono tabular-nums text-foreground">{formatTime(seconds)}</span>
                </div>
                <div className="h-1.5 rounded-full bg-border overflow-hidden">
                  <motion.div
                    className="h-full bg-primary"
                    initial={false}
                    animate={{ width: `${progressPct}%` }}
                    transition={{ duration: 0.5 }}
                  />
                </div>
              </div>

              <AnimatePresence mode="wait">
                <motion.div
                  key={stage.id}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -16 }}
                  transition={{ duration: 0.5 }}
                  className="bg-card border border-border rounded-[2.5rem] p-spacing-xl md:p-spacing-3xl text-center space-y-spacing-lg shadow-premium-md"
                >
                  <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                    <stage.icon className="w-7 h-7 text-primary" />
                  </div>
                  <div className="space-y-spacing-2xs">
                    <p className="text-premium-xs font-black uppercase tracking-[0.2em] text-primary/60">
                      {stage.kicker}
                    </p>
                    <h2 className="text-premium-3xl md:text-premium-5xl font-serif font-bold text-foreground tracking-tight">
                      {stage.title}
                    </h2>
                  </div>
                  <p className="text-premium-lg md:text-premium-xl font-serif text-foreground/90 leading-relaxed max-w-xl mx-auto">
                    {stage.instruction}
                  </p>
                  <p className="text-premium-sm text-muted-foreground italic font-serif max-w-lg mx-auto">
                    {stage.guidance}
                  </p>
                  <p className="text-premium-xs text-muted-foreground">
                    Sugestão: ~{Math.round(stage.seconds / 60)} min
                  </p>
                </motion.div>
              </AnimatePresence>

              <div className="flex gap-spacing-md">
                <Button
                  variant="outline"
                  disabled={index === 0}
                  onClick={goPrev}
                  className="flex-1 h-12 rounded-premium-full"
                >
                  <Icons.ChevronLeft className="w-4 h-4" /> Anterior
                </Button>
                <Button
                  onClick={goNext}
                  className={cn(
                    'flex-1 h-12 rounded-premium-full font-black uppercase text-premium-xs tracking-widest',
                    index === total - 1
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-foreground text-background hover:bg-primary hover:text-primary-foreground',
                  )}
                >
                  {index === total - 1 ? (
                    <>
                      <Icons.CheckCircle2 className="w-4 h-4" /> Concluir
                    </>
                  ) : (
                    <>
                      Próxima etapa <Icons.ChevronRight className="w-4 h-4" />
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}

          {/* Concluído */}
          {completed && (
            <motion.div
              className="text-center space-y-spacing-lg pt-spacing-2xl"
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
            >
              <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                <Icons.CheckCircle2 className="w-10 h-10 text-primary" />
              </div>
              <h2 className="text-premium-3xl md:text-premium-5xl font-serif font-bold text-foreground">
                Amém.
              </h2>
              <p className="text-premium-lg text-muted-foreground font-serif italic">
                {formatTime(seconds)} de silêncio ofertados. Volte amanhã.
              </p>
              <div className="flex gap-spacing-md justify-center">
                <Button
                  variant="outline"
                  onClick={restart}
                  className="rounded-premium-full h-12 px-spacing-xl text-premium-xs font-black uppercase tracking-widest"
                >
                  <Icons.RotateCcw className="w-4 h-4 mr-spacing-2xs" /> Nova sessão
                </Button>
                <Button
                  onClick={() => navigate('/lectio')}
                  className="rounded-premium-full h-12 px-spacing-xl text-premium-xs font-black uppercase tracking-widest bg-primary text-primary-foreground"
                >
                  Ir ao Modo Estudo
                </Button>
              </div>
            </motion.div>
          )}
        </div>
      </main>

      <MobileBottomNav />
    </>
  );
};

export default ContemplatioPage;
