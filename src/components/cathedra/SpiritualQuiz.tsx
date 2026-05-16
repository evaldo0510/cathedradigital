import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Sparkles, Heart, BookOpen, Sun, ArrowRight, ArrowLeft, 
  Flame, Brain, Clock, Shield, Eye, Wind, Anchor, 
  Mountain, Users, Church, Compass, Scroll, Quote 
} from 'lucide-react';
import { Button } from '@/components/cathedra/Button';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { AppRoute } from '@/types';

/* ── Types ── */
export type ProfileId = 'ferido_em_busca' | 'ansioso_buscador' | 'sedento_de_sentido' | 'firme_aprofundando' | 'ardente_missionario';
export type PainId = 'ansiedade' | 'culpa' | 'vazio' | 'distancia' | 'solidao';
export type DirectionId = 'silencio' | 'perdao' | 'proposito' | 'oracao' | 'servico';

export interface SpiritualStep {
  title: string;
  action: string;
  time: string;
  icon: React.ElementType;
}

export interface ProfileResult {
  title: string;
  emoji: string;
  message: string;
  pain: { id: PainId; label: string };
  direction: { id: DirectionId; label: string };
  journeyName: string;
  theme: string;
  color: string;
  bgGradient: string;
  logosPrompt: string;
  greeting: string;
  deepReflection: string;
  questions: string[];
  readingRecommendations: { title: string; ref: string }[];
  steps: SpiritualStep[];
}

export const PROFILES: Record<ProfileId, ProfileResult> = {
  ferido_em_busca: {
    title: 'Ferido em Busca',
    emoji: '💔',
    message: 'Existe um cansaço silencioso dentro de você… mas também um desejo de paz. Deus vê essa dor e já começou a curar.',
    pain: { id: 'ansiedade', label: 'Ansiedade' },
    direction: { id: 'silencio', label: 'Silenciar e reorganizar o interior' },
    journeyName: 'Silêncio Interior',
    theme: 'Paz',
    color: 'text-primary',
    bgGradient: 'from-primary/5 via-background to-primary/5',
    logosPrompt: 'Estou ansioso e ferido. Preciso encontrar paz interior.',
    greeting: 'Que a paz de Cristo alcance o seu coração hoje.',
    deepReflection: 'A ferida é o lugar por onde a luz entra, como diz o poeta. Não fuja do seu cansaço; nele Deus quer sussurrar algo.',
    questions: ['Onde você se sente mais cansado?', 'Como você costuma lidar com a dor?'],
    readingRecommendations: [{ title: 'Salmos de Confiança', ref: 'Sl 23' }],
    steps: [{ title: 'Lectio Divina', action: 'Ler o Salmo 23', time: '10 min', icon: BookOpen }]
  },
  ansioso_buscador: {
    title: 'Ansioso Buscador',
    emoji: '🌊',
    message: 'Você carrega peso demais sozinho. Mas quem busca, encontra — e você já está buscando. Permita-se descansar n\'Aquele que carrega o mundo.',
    pain: { id: 'culpa', label: 'Culpa ou peso interior' },
    direction: { id: 'perdao', label: 'Acolher o perdão e se libertar' },
    journeyName: 'Libertação Interior',
    theme: 'Perdão',
    color: 'text-primary',
    bgGradient: 'from-primary/5 via-background to-primary/5',
    logosPrompt: 'Sinto culpa e peso interior. Preciso entender o perdão de Deus.',
    greeting: 'Deus já perdoou. Agora é a sua vez de se libertar.',
    deepReflection: 'A culpa que não leva ao amor é apenas uma prisão. O perdão de Deus não é um prêmio, é um abraço.',
    questions: ['O que te impede de perdoar a si mesmo?', 'Onde está sua maior necessidade de misericórdia?'],
    readingRecommendations: [{ title: 'Parábola do Filho Pródigo', ref: 'Lc 15' }],
    steps: [{ title: 'Exame de Consciência', action: 'Refletir sobre o dia', time: '5 min', icon: Clock }]
  },
  sedento_de_sentido: {
    title: 'Sedento de Sentido',
    emoji: '🔍',
    message: 'Algo dentro de você sabe que a vida pede mais. Essa inquietação não é fraqueza — é vocação.',
    pain: { id: 'vazio', label: 'Vazio existencial' },
    direction: { id: 'proposito', label: 'Descobrir o propósito verdadeiro' },
    journeyName: 'Propósito Interior',
    theme: 'Fé',
    color: 'text-primary',
    bgGradient: 'from-primary/5 via-background to-primary/5',
    logosPrompt: 'Sinto vazio existencial e busco propósito.',
    greeting: 'Quem busca de coração, encontra. Continue caminhando.',
    deepReflection: 'O vazio que você sente é o formato exato de Deus dentro de ti.',
    questions: ['O que te faz vibrar de alegria?', 'Onde você gostaria de servir?'],
    readingRecommendations: [{ title: 'Confissões', ref: 'Agostinho' }],
    steps: [{ title: 'Meditação Guiada', action: 'Oração de Entrega', time: '15 min', icon: Anchor }]
  },
  firme_aprofundando: {
    title: 'Firme e Aprofundando',
    emoji: '📖',
    message: 'Você já caminha com firmeza, mas sente o chamado para ir mais fundo. A santidade não é destino — é caminho diário.',
    pain: { id: 'distancia', label: 'Desejo de mais profundidade' },
    direction: { id: 'oracao', label: 'Mergulhar na oração contemplativa' },
    journeyName: 'Formação Teológica',
    theme: 'Oração',
    color: 'text-primary',
    bgGradient: 'from-primary/5 via-background to-primary/5',
    logosPrompt: 'Quero aprofundar minha fé e vida de oração.',
    greeting: 'Persevere na santidade. Cada dia é um passo.',
    deepReflection: 'Deus quer levar-te a águas mais profundas.',
    questions: ['Qual virtude você quer cultivar?', 'Como está sua intimidade com Jesus?'],
    readingRecommendations: [{ title: 'Imitação de Cristo', ref: 'Kempis' }],
    steps: [{ title: 'Adoração Eucarística', action: 'Visita ao Santíssimo', time: '30 min', icon: Sun }]
  },
  ardente_missionario: {
    title: 'Ardente Missionário',
    emoji: '🔥',
    message: 'O fogo que arde em você não é acaso — é o Espírito Santo.',
    pain: { id: 'solidao', label: 'Solidão na missão' },
    direction: { id: 'servico', label: 'Servir com raízes profundas' },
    journeyName: 'Vida Mística',
    theme: 'Propósito',
    color: 'text-primary',
    bgGradient: 'from-primary/5 via-background to-primary/5',
    logosPrompt: 'Sou missionário e quero servir melhor.',
    greeting: 'O Espírito arde em você. Vá e incendeie o mundo.',
    deepReflection: 'Não podes dar o que não tens. Antes de servir, adora.',
    questions: ['Quem precisa do seu testemunho hoje?', 'Onde está sua maior dificuldade no serviço?'],
    readingRecommendations: [{ title: 'Atos dos Apóstolos', ref: 'At 2' }],
    steps: [{ title: 'Serviço Fraterno', action: 'Praticar caridade concreta', time: '60 min', icon: Users }]
  },
};

/* ── Questions ── */
interface QuizOption {
  label: string;
  value: string;
  weight: Record<ProfileId, number>;
}

interface QuizQuestion {
  id: string;
  intro: string;
  question: string;
  options: QuizOption[];
}

const QUESTIONS: QuizQuestion[] = [
  {
    id: 'estado',
    intro: 'Respire fundo.\nOnde o seu interior se encontra agora?',
    question: 'Como você descreveria seu estado interior?',
    options: [
      { label: 'Um peso silencioso, um cansaço da alma', value: 'pesado', weight: { ferido_em_busca: 4, ansioso_buscador: 2, sedento_de_sentido: 0, firme_aprofundando: 0, ardente_missionario: 0 } },
      { label: 'Uma inquietação que busca algo maior', value: 'inquieto', weight: { ferido_em_busca: 1, ansioso_buscador: 1, sedento_de_sentido: 4, firme_aprofundando: 0, ardente_missionario: 0 } },
      { label: 'Uma paz estável, mas com sede de profundidade', value: 'estavel', weight: { ferido_em_busca: 0, ansioso_buscador: 0, sedento_de_sentido: 1, firme_aprofundando: 4, ardente_missionario: 1 } },
      { label: 'Um ardor pronto para o serviço e a missão', value: 'aceso', weight: { ferido_em_busca: 0, ansioso_buscador: 0, sedento_de_sentido: 0, firme_aprofundando: 1, ardente_missionario: 4 } },
    ],
  },
  {
    id: 'dor',
    intro: 'Deus conhece cada dobra do seu coração.\nNão tenha medo de olhar para o que dói.',
    question: 'O que mais pesa em sua caminhada hoje?',
    options: [
      { label: 'O medo do amanhã e a ansiedade constante', value: 'ansiedade', weight: { ferido_em_busca: 4, ansioso_buscador: 2, sedento_de_sentido: 1, firme_aprofundando: 0, ardente_missionario: 0 } },
      { label: 'O peso da culpa ou de feridas não curadas', value: 'culpa', weight: { ferido_em_busca: 1, ansioso_buscador: 4, sedento_de_sentido: 1, firme_aprofundando: 0, ardente_missionario: 0 } },
      { label: 'A sensação de que falta um sentido real', value: 'vazio', weight: { ferido_em_busca: 0, ansioso_buscador: 1, sedento_de_sentido: 4, firme_aprofundando: 0, ardente_missionario: 0 } },
      { label: 'O desejo ardente de se entregar mais a Deus', value: 'chamado', weight: { ferido_em_busca: 0, ansioso_buscador: 0, sedento_de_sentido: 0, firme_aprofundando: 2, ardente_missionario: 4 } },
    ],
  },
  {
    id: 'oracao',
    intro: 'A oração é o diálogo silencioso com o Criador.\nComo tem sido esse encontro?',
    question: 'Qual a sua relação atual com a oração?',
    options: [
      { label: 'Um deserto onde raramente consigo entrar', value: 'raro', weight: { ferido_em_busca: 3, ansioso_buscador: 1, sedento_de_sentido: 2, firme_aprofundando: 0, ardente_missionario: 0 } },
      { label: 'Um refúgio buscado apenas na necessidade', value: 'crise', weight: { ferido_em_busca: 1, ansioso_buscador: 3, sedento_de_sentido: 1, firme_aprofundando: 0, ardente_missionario: 0 } },
      { label: 'Uma disciplina que tento cultivar diariamente', value: 'rotina', weight: { ferido_em_busca: 0, ansioso_buscador: 0, sedento_de_sentido: 2, firme_aprofundando: 3, ardente_missionario: 0 } },
      { label: 'O centro da minha vida, um estado de presença', value: 'profunda', weight: { ferido_em_busca: 0, ansioso_buscador: 0, sedento_de_sentido: 0, firme_aprofundando: 1, ardente_missionario: 3 } },
    ],
  },
  {
    id: 'desejo',
    intro: 'O que o seu coração pede no silêncio?\nAli está a voz de Deus sussurrando a direção.',
    question: 'Qual o maior anseio da sua alma agora?',
    options: [
      { label: 'Encontrar paz e silêncio interior', value: 'paz', weight: { ferido_em_busca: 4, ansioso_buscador: 1, sedento_de_sentido: 1, firme_aprofundando: 0, ardente_missionario: 0 } },
      { label: 'Sentir o perdão e a libertação de pesos', value: 'cura', weight: { ferido_em_busca: 1, ansioso_buscador: 4, sedento_de_sentido: 0, firme_aprofundando: 0, ardente_missionario: 0 } },
      { label: 'Descobrir meu propósito e missão de vida', value: 'sentido', weight: { ferido_em_busca: 0, ansioso_buscador: 1, sedento_de_sentido: 4, firme_aprofundando: 1, ardente_missionario: 0 } },
      { label: 'Transbordar o amor de Deus em serviço', value: 'servir', weight: { ferido_em_busca: 0, ansioso_buscador: 0, sedento_de_sentido: 0, firme_aprofundando: 1, ardente_missionario: 4 } },
    ],
  },
];

function computeProfile(answers: Record<string, string>): ProfileId {
  const scores: Record<ProfileId, number> = {
    ferido_em_busca: 0, ansioso_buscador: 0, sedento_de_sentido: 0,
    firme_aprofundando: 0, ardente_missionario: 0,
  };
  for (const q of QUESTIONS) {
    const opt = q.options.find(o => o.value === answers[q.id]);
    if (opt) {
      for (const [p, w] of Object.entries(opt.weight)) scores[p as ProfileId] += w;
    }
  }
  return Object.entries(scores).sort((a, b) => b[1] - a[1])[0][0] as ProfileId;
}

const SpiritualQuiz: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [phase, setPhase] = useState<'intro' | 'quiz' | 'result'>('intro');
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [result, setResult] = useState<ProfileId | null>(null);
  const [done, setDone] = useState(false);
  const [existing, setExisting] = useState<ProfileId | null>(null);
  const [existingData, setExistingData] = useState<any>(null);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);

  useEffect(() => {
    const activeId = existing || result;
    if (!user || !activeId) return;
    supabase
      .from('trail_progress')
      .select('step_index')
      .eq('user_id', user.id)
      .eq('trail_id', activeId)
      .then(({ data }) => {
        if (data) setCompletedSteps(data.map(d => d.step_index));
      });
  }, [user, existing, result]);

  const toggleStep = async (index: number) => {
    if (!user || !existing) return;
    
    const isCompleted = completedSteps.includes(index);
    if (isCompleted) {
      await supabase
        .from('trail_progress')
        .delete()
        .eq('user_id', user.id)
        .eq('trail_id', existing)
        .eq('step_index', index);
      setCompletedSteps(prev => prev.filter(i => i !== index));
    } else {
      await supabase
        .from('trail_progress')
        .insert({
          user_id: user.id,
          trail_id: existing,
          step_index: index
        });
      setCompletedSteps(prev => [...prev, index]);
    }
  };

  useEffect(() => {
    if (!user) return;
    (supabase as any)
      .from('user_sensitive_data')
      .select('diagnosis_result')
      .eq('user_id', user.id)
      .maybeSingle()
      .then(({ data, error }: any) => {
        if (error) return;
        const res = data?.diagnosis_result;
        if (!res) return;

        // If completed
        if (res.spiritual_profile && PROFILES[res.spiritual_profile as ProfileId]) {
          setDone(true);
          setExisting(res.spiritual_profile as ProfileId);
          setExistingData(res);
        } else if (res.answers && res.current_step !== undefined) {
          // If in progress
          setAnswers(res.answers);
          setStep(res.current_step);
          setPhase('quiz');
        }
      });
  }, [user]);

  const savePartialProgress = async (currentStep: number, currentAnswers: Record<string, string>) => {
    if (!user) return;
    try {
      await (supabase as any)
        .from('user_sensitive_data')
        .upsert({
          user_id: user.id,
          diagnosis_result: {
            answers: currentAnswers,
            current_step: currentStep,
          },
        }, { onConflict: 'user_id' });
    } catch (err) {
      console.error('Failed to save partial progress:', err);
    }
  };

  const handleAnswer = useCallback((value: string) => {
    const q = QUESTIONS[step];
    const nextAnswers = { ...answers, [q.id]: value };
    setAnswers(nextAnswers);
    
    if (step < QUESTIONS.length - 1) {
      const nextStep = step + 1;
      setTimeout(() => {
        setStep(nextStep);
        savePartialProgress(nextStep, nextAnswers);
      }, 500);
    } else {
      const profileId = computeProfile(nextAnswers);
      setResult(profileId);
      setPhase('result');
      saveResult(profileId, nextAnswers);
    }
  }, [step, answers, user]);

  const saveResult = async (profileId: ProfileId, allAnswers: Record<string, string>) => {
    if (!user) return;
    try {
      const p = PROFILES[profileId];
      const painQ = QUESTIONS.find(q => q.id === 'dor');
      const painOpt = painQ?.options.find(o => o.value === allAnswers['dor']);
      const dirQ = QUESTIONS.find(q => q.id === 'desejo');
      const dirOpt = dirQ?.options.find(o => o.value === allAnswers['desejo']);

      await (supabase as any)
        .from('user_sensitive_data')
        .update({
          diagnosis_result: {
            ...allAnswers,
            spiritual_profile: profileId,
            pain: painOpt?.label || p.pain.label,
            direction: dirOpt?.label || p.direction.label,
            theme: p.theme,
            journeyName: p.journeyName,
          },
        })
        .eq('user_id', user.id);
    } catch (err) {
      console.error('Failed to save:', err);
    }
  };

  const reset = () => { setPhase('intro'); setStep(0); setAnswers({}); setResult(null); setDone(false); setExisting(null); };
  const progress = ((step + 1) / QUESTIONS.length) * 100;

  // ── Compact result ──
  if (done && existing && PROFILES[existing]) {
    const p = PROFILES[existing];
    const painLabel = existingData?.pain || p.pain.label;
    const dirLabel = existingData?.direction || p.direction.label;
    
    return (
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="rounded-[2.5rem] border border-border/10 bg-card p-8 space-y-6 shadow-premium reading-sepia">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-black uppercase tracking-[0.3em] text-primary/40">Diagnóstico Espiritual</span>
          <Button onClick={reset} variant="ghost" className="text-[10px] font-black uppercase tracking-widest text-primary/30 hover:text-primary">
            Refazer
          </Button>
        </div>

        <div className="flex items-start gap-6">
          <div className="w-16 h-16 rounded-full bg-primary/5 flex items-center justify-center border border-primary/10 shrink-0">
            <Compass className="w-8 h-8 text-primary/40" />
          </div>
          <div className="flex-1 space-y-2">
            <h3 className="text-xl font-display text-primary">{p.title}</h3>
            <p className="text-sm font-monastery text-primary/60 italic leading-relaxed">
              "{p.message}"
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 rounded-premium-sm bg-primary/[0.02] border border-primary/5">
            <p className="text-[9px] font-black uppercase tracking-widest text-primary/30 mb-1">Busca</p>
            <p className="text-xs font-bold text-primary/70">{painLabel}</p>
          </div>
          <div className="p-4 rounded-premium-sm bg-primary/[0.02] border border-primary/5">
            <p className="text-[9px] font-black uppercase tracking-widest text-primary/30 mb-1">Direção</p>
            <p className="text-xs font-bold text-primary/70">{dirLabel}</p>
          </div>
        </div>

        <div className="space-y-4 pt-4 border-t border-primary/5">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-primary/30">Trilha do Dia</p>
          <div className="space-y-2 text-center">
            {p.steps.map((step, idx) => (
              <button
                key={idx}
                onClick={() => toggleStep(idx)}
                className={`w-full flex items-center justify-between p-4 rounded-xl border transition-all ${
                  completedSteps.includes(idx)
                    ? 'bg-primary/10 border-primary/20 opacity-60'
                    : 'bg-primary/[0.02] border-primary/5 hover:border-primary/20'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center border ${
                    completedSteps.includes(idx) ? 'bg-primary border-primary text-primary-foreground' : 'border-primary/10 text-primary/40'
                  }`}>
                    {completedSteps.includes(idx) ? <Sparkles className="w-4 h-4" /> : <step.icon className="w-4 h-4" />}
                  </div>
                  <div className="text-left">
                    <p className={`text-xs font-bold ${completedSteps.includes(idx) ? 'line-through text-primary/40' : 'text-primary'}`}>{step.title}</p>
                    <p className="text-[10px] text-primary/40 uppercase tracking-widest">{step.time}</p>
                  </div>
                </div>
                <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                  completedSteps.includes(idx) ? 'bg-primary border-primary' : 'border-primary/10'
                }`}>
                  {completedSteps.includes(idx) && <Sparkles className="w-3 h-3 text-primary-foreground" />}
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="pt-4 border-t border-primary/5 flex gap-3">
          <Button size="sm" className="flex-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-primary text-primary-foreground" onClick={() => navigate(AppRoute.JORNADAS)}>
            <Sparkles className="w-3.5 h-3.5 mr-2" /> Jornadas
          </Button>
          <Button size="sm" variant="outline" className="flex-1 rounded-full text-[10px] font-black uppercase tracking-widest border-primary/10 text-primary" onClick={() => {
             const chatBtn = document.querySelector('button[aria-label*="Logos"]') as HTMLButtonElement;
             if (chatBtn) chatBtn.click();
          }}>
            <Compass className="w-3.5 h-3.5 mr-2" /> Logos
          </Button>
        </div>
      </motion.div>
    );
  }

  // ── Result phase ──
  if (phase === 'result' && result) {
    const p = PROFILES[result];
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="rounded-[3rem] border border-border/10 bg-card p-10 md:p-16 space-y-12 shadow-premium reading-sepia text-center relative overflow-hidden"
      >
        <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-primary/20 to-transparent" />
        
        <div className="space-y-6">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="w-24 h-24 rounded-full bg-primary/5 mx-auto flex items-center justify-center border border-primary/10"
          >
            <Compass className="w-10 h-10 text-primary" />
          </motion.div>
          <div className="space-y-2">
            <span className="text-[10px] font-black uppercase tracking-[0.4em] text-primary/30">Diagnóstico de Alma</span>
            <h2 className="text-4xl font-display text-primary tracking-tight">{p.title}</h2>
          </div>
          <p className="text-xl font-monastery text-primary italic leading-relaxed max-w-lg mx-auto">
            "{p.message}"
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-xl mx-auto">
          <div className="p-8 rounded-[2rem] bg-primary/[0.02] border border-primary/5 space-y-4">
            <div className="w-10 h-10 rounded-full bg-primary/5 mx-auto flex items-center justify-center">
              <Heart className="w-5 h-5 text-primary/40" />
            </div>
            <div className="space-y-1">
              <p className="text-[9px] font-black uppercase tracking-widest text-primary/20">Sua Sede</p>
              <p className="text-sm font-bold text-primary/70">{p.pain.label}</p>
            </div>
          </div>
          <div className="p-8 rounded-[2rem] bg-primary/[0.02] border border-primary/5 space-y-4">
            <div className="w-10 h-10 rounded-full bg-primary/5 mx-auto flex items-center justify-center">
              <Flame className="w-5 h-5 text-primary/40" />
            </div>
            <div className="space-y-1">
              <p className="text-[9px] font-black uppercase tracking-widest text-primary/20">Seu Norte</p>
              <p className="text-sm font-bold text-primary/70">{p.direction.label}</p>
            </div>
          </div>
        </div>

        <div className="space-y-4 pt-4 border-t border-primary/5">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-primary/30">Trilha Recomendada</p>
          <div className="space-y-2 text-center">
            {p.steps.map((step, idx) => (
              <button
                key={idx}
                onClick={() => toggleStep(idx)}
                className={`w-full flex items-center justify-between p-4 rounded-xl border transition-all ${
                  completedSteps.includes(idx)
                    ? 'bg-primary/10 border-primary/20 opacity-60'
                    : 'bg-primary/[0.02] border-primary/5 hover:border-primary/20'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center border ${
                    completedSteps.includes(idx) ? 'bg-primary border-primary text-primary-foreground' : 'border-primary/10 text-primary/40'
                  }`}>
                    {completedSteps.includes(idx) ? <Sparkles className="w-4 h-4" /> : <step.icon className="w-4 h-4" />}
                  </div>
                  <div className="text-left">
                    <p className={`text-xs font-bold ${completedSteps.includes(idx) ? 'line-through text-primary/40' : 'text-primary'}`}>{step.title}</p>
                    <p className="text-[10px] text-primary/40 uppercase tracking-widest">{step.time}</p>
                  </div>
                </div>
                <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                  completedSteps.includes(idx) ? 'bg-primary border-primary' : 'border-primary/10'
                }`}>
                  {completedSteps.includes(idx) && <Sparkles className="w-3 h-3 text-primary-foreground" />}
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-8 pt-8 border-t border-primary/5">
          <div className="space-y-4">
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-primary/30">Aprofundamento</span>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button onClick={() => navigate(AppRoute.JORNADAS)} className="rounded-full h-14 px-10 gap-3 font-black uppercase text-[10px] tracking-[0.2em] bg-primary text-primary-foreground shadow-premium">
                <Sparkles className="w-4 h-4" /> Iniciar Jornada
              </Button>
              <Button variant="outline" onClick={() => {
                 const chatBtn = document.querySelector('button[aria-label*="Logos"]') as HTMLButtonElement;
                 if (chatBtn) chatBtn.click();
              }} className="rounded-full h-14 px-10 gap-3 font-black uppercase text-[10px] tracking-[0.2em] border-primary/10 text-primary">
                <Compass className="w-4 h-4" /> Logos
              </Button>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={() => { setDone(true); setExisting(result); }} className="text-[10px] font-black uppercase tracking-widest text-primary/30 hover:text-primary">
            Concluir Diagnóstico
          </Button>
        </div>
      </motion.div>
    );
  }

  // ── Intro phase ──
  if (phase === 'intro') {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="rounded-[3rem] border border-border/10 bg-card p-10 md:p-16 space-y-10 shadow-premium text-center reading-sepia overflow-hidden relative"
      >
        <div className="space-y-6 relative z-10">
          <div className="w-20 h-20 rounded-full bg-primary/5 mx-auto flex items-center justify-center border border-primary/10">
            <Scroll className="w-10 h-10 text-primary/40" />
          </div>
          <div className="space-y-2">
            <span className="text-[10px] font-black uppercase tracking-[0.4em] text-primary/30">Conhece-te a ti mesmo</span>
            <h2 className="text-3xl font-display text-primary tracking-tight">Diagnóstico Espiritual</h2>
          </div>
          <p className="text-lg font-monastery text-primary/60 italic leading-relaxed max-w-md mx-auto">
            "Para onde eu irei, longe do teu Espírito? Para onde fugirei da tua face?" — Reflita e encontre o seu caminho.
          </p>
        </div>
        
        <div className="flex flex-col items-center gap-6 relative z-10">
          <div className="flex items-center gap-3 text-primary/30">
            <div className="w-1 h-1 rounded-full bg-primary/20" />
            <span className="text-[10px] font-black uppercase tracking-widest">4 Dimensões da Alma</span>
            <div className="w-1 h-1 rounded-full bg-primary/20" />
          </div>
          <Button
            onClick={() => setPhase('quiz')}
            className="w-full max-w-xs rounded-full h-14 gap-4 font-black uppercase text-[10px] tracking-[0.3em] bg-primary text-primary-foreground shadow-premium group"
          >
            Iniciar Reflexão <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Button>
        </div>
      </motion.div>
    );
  }

  // ── Quiz phase ──
  const q = QUESTIONS[step];

  return (
    <div className="min-h-[500px] flex flex-col justify-center py-12">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="max-w-2xl mx-auto w-full space-y-16"
      >
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-primary/30">Reflexão em Curso</span>
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-primary/30">{step + 1} / {QUESTIONS.length}</span>
          </div>
          <div className="h-0.5 bg-primary/5 rounded-full overflow-hidden">
            <motion.div 
              className="h-full bg-primary/40" 
              animate={{ width: `${progress}%` }} 
              transition={{ type: 'spring', damping: 25 }} 
            />
          </div>
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={q.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="space-y-12"
          >
            <div className="space-y-4 text-center">
              <p className="text-sm font-monastery text-primary/40 italic leading-relaxed max-w-md mx-auto whitespace-pre-line">
                {q.intro}
              </p>
              <h3 className="text-3xl font-display text-primary tracking-tight leading-tight">
                {q.question}
              </h3>
            </div>

            <div className="space-y-4" role="radiogroup" aria-label={q.question}>
              {q.options.map((opt, idx) => (
                <motion.button
                  key={opt.value}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 * idx }}
                  whileHover={{ x: 8 }}
                  whileTap={{ scale: 0.99 }}
                  onClick={() => handleAnswer(opt.value)}
                  className="w-full flex items-center justify-between p-8 rounded-[1.5rem] border border-primary/5 bg-primary/[0.01] hover:bg-primary/[0.03] hover:border-primary/20 transition-all text-left group"
                >
                  <span className="text-lg font-monastery text-primary/70 group-hover:text-primary transition-colors pr-8">
                    {opt.label}
                  </span>
                  <div className="w-6 h-6 rounded-full border border-primary/10 flex items-center justify-center group-hover:border-primary/40 transition-colors">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </motion.button>
              ))}
            </div>
          </motion.div>
        </AnimatePresence>

        <div className="flex justify-between items-center pt-8">
          {step > 0 ? (
            <Button 
              variant="ghost" 
              onClick={() => setStep(s => s - 1)} 
              className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-primary/30 hover:text-primary"
            >
              <ArrowLeft className="w-4 h-4" /> Voltar
            </Button>
          ) : <div />}
          <div className="flex gap-4">
            <Quote className="w-4 h-4 text-primary/10" />
            <Scroll className="w-4 h-4 text-primary/10" />
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default SpiritualQuiz;
