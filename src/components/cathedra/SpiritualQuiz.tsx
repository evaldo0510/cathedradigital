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
import { updateUserStreak } from '@/lib/streak';

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
  const [deepeningAnswers, setDeepeningAnswers] = useState<Record<string, string>>({});
  const [isSavingReflection, setIsSavingReflection] = useState(false);

  useEffect(() => {
    const activeId = existing || result;
    if (!user || !activeId) return;
    
    // Fetch trail progress
    supabase
      .from('trail_progress')
      .select('step_index')
      .eq('user_id', user.id)
      .eq('trail_id', activeId)
      .then(({ data }) => {
        if (data) setCompletedSteps(data.map(d => d.step_index));
      });

    // Fetch deepening answers
    supabase
      .from('user_notes')
      .select('content_id, note_text')
      .eq('user_id', user.id)
      .eq('content_type', 'quiz_deepening')
      .then(({ data }) => {
        if (data) {
          const map: Record<string, string> = {};
          data.forEach(n => { map[n.content_id] = n.note_text; });
          setDeepeningAnswers(map);
        }
      });
  }, [user, existing, result]);

  const saveDeepeningAnswer = async (question: string, answer: string) => {
    if (!user) return;
    setIsSavingReflection(true);
    try {
      await (supabase as any)
        .from('user_notes')
        .upsert({
          user_id: user.id,
          content_type: 'quiz_deepening',
          content_id: question,
          note_text: answer,
        }, { onConflict: 'user_id,content_type,content_id' });
    } catch (err) {
      console.error('Error saving reflection:', err);
    } finally {
      setIsSavingReflection(false);
    }
  };

  const toggleStep = async (index: number) => {
    const activeId = existing || result;
    if (!user || !activeId) return;
    
    const isCompleted = completedSteps.includes(index);
    if (isCompleted) {
      await supabase
        .from('trail_progress')
        .delete()
        .eq('user_id', user.id)
        .eq('trail_id', activeId)
        .eq('step_index', index);
      setCompletedSteps(prev => prev.filter(i => i !== index));
    } else {
      await (supabase as any)
        .from('trail_progress')
        .insert({
          user_id: user.id,
          trail_id: activeId,
          step_index: index
        });
      setCompletedSteps(prev => [...prev, index]);
      
      // Update streak and last_action_at via helper
      await updateUserStreak(user.id);
      
      // Also add XP
      await (supabase as any)
        .from('profiles')
        .update({
          xp: ((user as any).xp || 0) + 10
        })
        .eq('id', user.id);
    }
  };

  const [hasPartialProgress, setHasPartialProgress] = useState(false);

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
          setHasPartialProgress(true);
          setAnswers(res.answers);
          setStep(res.current_step);
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
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-10">
        <div className="rounded-[2.5rem] border border-border/10 bg-card p-10 md:p-16 space-y-12 shadow-premium reading-sepia text-center relative overflow-hidden">
          <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-primary/20 to-transparent" />
          
          <div className="flex flex-col items-center justify-between gap-6">
            <span className="text-[10px] font-black uppercase tracking-[0.4em] text-primary/30">Seu Perfil Espiritual</span>
            <Button onClick={reset} variant="ghost" className="text-[10px] font-black uppercase tracking-widest text-primary/20 hover:text-primary transition-colors">
              Refazer Diagnóstico
            </Button>
          </div>

          <div className="space-y-8">
            <div className="w-20 h-20 rounded-full bg-primary/[0.02] mx-auto flex items-center justify-center border border-primary/5">
              <Compass className="w-10 h-10 text-primary/40" />
            </div>
            <div className="space-y-3">
              <h3 className="text-4xl md:text-5xl font-display text-primary tracking-tightest">{p.title}</h3>
              <p className="text-xl md:text-2xl font-monastery text-primary/60 italic leading-relaxed max-w-xl mx-auto">
                "{p.message}"
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-xl mx-auto">
            <div className="p-8 rounded-[2rem] bg-primary/[0.01] border border-primary/5 space-y-4">
              <div className="w-10 h-10 rounded-full bg-primary/[0.02] mx-auto flex items-center justify-center">
                <Heart className="w-5 h-5 text-primary/20" />
              </div>
              <div className="space-y-1">
                <p className="text-[9px] font-black uppercase tracking-widest text-primary/20">Sede da Alma</p>
                <p className="text-base font-bold text-primary/70">{painLabel}</p>
              </div>
            </div>
            <div className="p-8 rounded-[2rem] bg-primary/[0.01] border border-primary/5 space-y-4">
              <div className="w-10 h-10 rounded-full bg-primary/[0.02] mx-auto flex items-center justify-center">
                <Flame className="w-5 h-5 text-primary/20" />
              </div>
              <div className="space-y-1">
                <p className="text-[9px] font-black uppercase tracking-widest text-primary/20">Caminho de Luz</p>
                <p className="text-base font-bold text-primary/70">{dirLabel}</p>
              </div>
            </div>
          </div>

          <div className="space-y-16 pt-12 border-t border-primary/5">
            <div className="space-y-6 max-w-xl mx-auto">
              <p className="text-[10px] font-black uppercase tracking-[0.4em] text-primary/30">Reflexão para o Caminho</p>
              <div className="text-lg md:text-xl font-serif italic text-primary/80 leading-relaxed bg-primary/[0.01] p-10 rounded-[2.5rem] border border-primary/5">
                {p.deepReflection}
              </div>
            </div>

            <div className="space-y-10 max-w-xl mx-auto">
              <p className="text-[10px] font-black uppercase tracking-[0.4em] text-primary/30">Questões de Profundidade</p>
              <div className="space-y-10">
                {p.questions.map((q, idx) => (
                  <div key={idx} className="space-y-4">
                    <p className="text-sm font-bold text-primary/60 tracking-tight text-center px-4">{q}</p>
                    <textarea
                      value={deepeningAnswers[q] || ''}
                      onChange={(e) => setDeepeningAnswers(prev => ({ ...prev, [q]: e.target.value }))}
                      onBlur={(e) => saveDeepeningAnswer(q, e.target.value)}
                      placeholder="Responda em silêncio..."
                      className="w-full bg-primary/[0.01] border border-primary/5 rounded-[1.5rem] p-6 text-base font-serif italic focus:outline-none focus:border-primary/20 transition-all min-h-[120px] resize-none text-center"
                    />
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-8 max-w-xl mx-auto">
              <p className="text-[10px] font-black uppercase tracking-[0.4em] text-primary/30">Sua Trilha Contemplativa</p>
              <div className="space-y-4">
                {p.steps.map((step, idx) => (
                  <button
                    key={idx}
                    onClick={() => toggleStep(idx)}
                    className={`w-full flex items-center justify-between p-8 rounded-[2rem] border transition-all duration-700 ${
                      completedSteps.includes(idx)
                        ? 'bg-primary/5 border-primary/10 opacity-60'
                        : 'bg-primary/[0.01] border-primary/5 hover:border-primary/20 hover:bg-primary/[0.02]'
                    }`}
                  >
                    <div className="flex items-center gap-6">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center border transition-all duration-700 ${
                        completedSteps.includes(idx) ? 'bg-primary border-primary text-primary-foreground shadow-premium' : 'border-primary/5 text-primary/20'
                      }`}>
                        {completedSteps.includes(idx) ? <Sparkles className="w-5 h-5" /> : <step.icon className="w-5 h-5" />}
                      </div>
                      <div className="text-left">
                        <p className={`text-lg font-bold ${completedSteps.includes(idx) ? 'line-through text-primary/40' : 'text-primary'}`}>{step.title}</p>
                        <div className="flex items-center gap-3">
                          <p className="text-[10px] text-primary/40 uppercase tracking-[0.2em]">{step.time}</p>
                          <span className="w-1 h-1 rounded-full bg-primary/20" />
                          <p className="text-xs text-primary/40 italic font-serif">{step.action}</p>
                        </div>
                      </div>
                    </div>
                    <div className={`w-8 h-8 rounded-full border flex items-center justify-center transition-all duration-700 ${
                      completedSteps.includes(idx) ? 'bg-primary border-primary' : 'border-primary/5'
                    }`}>
                      {completedSteps.includes(idx) && <Sparkles className="w-4 h-4 text-primary-foreground" />}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="pt-12 border-t border-primary/5 flex flex-col sm:flex-row gap-4 justify-center">
            <Button onClick={() => navigate(AppRoute.JORNADAS)} className="rounded-full h-16 px-12 gap-4 font-black uppercase text-[10px] tracking-[0.4em] bg-primary text-primary-foreground shadow-premium hover:scale-[1.02] transition-all">
              <Sparkles className="w-4 h-4" /> Iniciar Trilha
            </Button>
            <Button variant="outline" onClick={() => {
               const chatBtn = document.querySelector('button[aria-label*="Logos"]') as HTMLButtonElement;
               if (chatBtn) chatBtn.click();
            }} className="rounded-full h-16 px-12 gap-4 font-black uppercase text-[10px] tracking-[0.4em] border-primary/10 text-primary hover:bg-primary/5 transition-all">
              <Compass className="w-4 h-4" /> Consultar Logos
            </Button>
          </div>
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

        <div className="space-y-12 pt-12 border-t border-primary/5 text-center">
          <div className="space-y-4 max-w-xl mx-auto">
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-primary/30">Reflexão Profunda</p>
            <p className="text-lg font-serif italic text-primary/80 leading-relaxed bg-primary/[0.02] p-8 rounded-[2rem] border border-primary/5">
              {p.deepReflection}
            </p>
          </div>

          <div className="space-y-8 max-w-xl mx-auto">
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-primary/30">Questões para o Coração</p>
            <div className="space-y-8">
              {p.questions.map((q, idx) => (
                <div key={idx} className="space-y-4">
                  <p className="text-sm font-bold text-primary/70">{q}</p>
                  <textarea
                    value={deepeningAnswers[q] || ''}
                    onChange={(e) => setDeepeningAnswers(prev => ({ ...prev, [q]: e.target.value }))}
                    onBlur={(e) => saveDeepeningAnswer(q, e.target.value)}
                    placeholder="Sua reflexão sincera..."
                    className="w-full bg-primary/[0.01] border border-primary/5 rounded-[1.5rem] p-6 text-base font-serif italic focus:outline-none focus:border-primary/20 transition-all min-h-[120px] resize-none"
                  />
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-6 max-w-xl mx-auto">
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-primary/30">Trilha de Purificação</p>
            <div className="space-y-4">
              {p.steps.map((step, idx) => (
                <button
                  key={idx}
                  onClick={() => toggleStep(idx)}
                  className={`w-full flex items-center justify-between p-6 rounded-[2rem] border transition-all ${
                    completedSteps.includes(idx)
                      ? 'bg-primary/10 border-primary/20 opacity-60'
                      : 'bg-primary/[0.02] border-primary/5 hover:border-primary/20'
                  }`}
                >
                  <div className="flex items-center gap-6">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center border ${
                      completedSteps.includes(idx) ? 'bg-primary border-primary text-primary-foreground' : 'border-primary/10 text-primary/40'
                    }`}>
                      {completedSteps.includes(idx) ? <Sparkles className="w-6 h-6" /> : <step.icon className="w-6 h-6" />}
                    </div>
                    <div className="text-left">
                      <p className={`text-lg font-bold ${completedSteps.includes(idx) ? 'line-through text-primary/40' : 'text-primary'}`}>{step.title}</p>
                      <div className="flex items-center gap-3">
                        <p className="text-xs text-primary/40 uppercase tracking-widest">{step.time}</p>
                        <span className="w-1 h-1 rounded-full bg-primary/20" />
                        <p className="text-xs text-primary/40 italic">{step.action}</p>
                      </div>
                    </div>
                  </div>
                  <div className={`w-8 h-8 rounded-full border flex items-center justify-center ${
                    completedSteps.includes(idx) ? 'bg-primary border-primary' : 'border-primary/10'
                  }`}>
                    {completedSteps.includes(idx) && <Sparkles className="w-4 h-4 text-primary-foreground" />}
                  </div>
                </button>
              ))}
            </div>
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
        className="min-h-[70vh] flex flex-col items-center justify-center text-center space-y-16 px-6"
      >
        <div className="space-y-8 max-w-2xl">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 1.5, ease: [0.16, 1, 0.3, 1] }}
            className="w-24 h-24 rounded-full bg-primary/[0.02] mx-auto flex items-center justify-center border border-primary/5 shadow-[0_0_40px_rgba(0,0,0,0.02)]"
          >
            <Scroll className="w-10 h-10 text-primary/20" />
          </motion.div>
          
          <div className="space-y-4">
            <motion.span 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 1 }}
              className="text-[10px] font-black uppercase tracking-[0.6em] text-primary/20 block"
            >
              Conhece-te a ti mesmo
            </motion.span>
            <motion.h2 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 1 }}
              className="text-5xl md:text-7xl font-display text-primary tracking-tightest"
            >
              Interioridade
            </motion.h2>
          </div>
          
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8, duration: 1.5 }}
            className="text-xl md:text-2xl font-monastery text-primary/40 italic leading-relaxed max-w-xl mx-auto"
          >
            "Não queira ir fora de ti, entra em ti mesmo; no homem interior habita a verdade." <br />
            <span className="text-[10px] font-black uppercase tracking-widest mt-4 block">— Santo Agostinho</span>
          </motion.p>
        </div>
        
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.2, duration: 1 }}
          className="flex flex-col items-center gap-10 w-full max-w-md"
        >
          <div className="flex flex-col sm:flex-row gap-6 w-full">
            <Button
              onClick={() => { setPhase('quiz'); setStep(0); setAnswers({}); setHasPartialProgress(false); }}
              variant="outline"
              className="flex-1 rounded-full h-16 gap-4 font-black uppercase text-[10px] tracking-[0.4em] border-primary/10 text-primary/60 hover:bg-primary/5 hover:text-primary transition-all duration-700"
            >
              {hasPartialProgress ? "Reiniciar" : "Iniciar Silêncio"}
            </Button>
            {hasPartialProgress && (
              <Button
                onClick={() => setPhase('quiz')}
                className="flex-1 rounded-full h-16 gap-4 font-black uppercase text-[10px] tracking-[0.4em] bg-primary text-primary-foreground shadow-premium hover:scale-[1.02] transition-all duration-700 group"
              >
                Retomar <Sparkles className="w-4 h-4 animate-pulse group-hover:rotate-12 transition-transform" />
              </Button>
            )}
          </div>

          <div className="flex items-center gap-4 text-primary/10">
            <div className="w-8 h-px bg-current" />
            <span className="text-[9px] font-black uppercase tracking-[0.5em]">Um portal para sua alma</span>
            <div className="w-8 h-px bg-current" />
          </div>
        </motion.div>
      </motion.div>
    );
  }

  // ── Quiz phase ──
  const q = QUESTIONS[step];

  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center py-12 px-6">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="max-w-4xl mx-auto w-full space-y-24"
      >
        <div className="space-y-8 max-w-sm mx-auto">
          <div className="flex items-center justify-between text-primary/20">
            <span className="text-[10px] font-black uppercase tracking-[0.6em]">Exame Interior</span>
            <span className="text-[10px] font-black uppercase tracking-[0.4em]">{step + 1} / {QUESTIONS.length}</span>
          </div>
          <div className="h-0.5 bg-primary/[0.03] rounded-full overflow-hidden">
            <motion.div 
              className="h-full bg-secondary/30" 
              animate={{ width: `${progress}%` }} 
              transition={{ type: 'spring', damping: 30, stiffness: 100 }} 
            />
          </div>
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={q.id}
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.02 }}
            transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
            className="space-y-20"
          >
            <div className="space-y-10 text-center">
              <motion.p 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 1 }}
                className="text-lg md:text-xl font-monastery text-primary/30 italic leading-relaxed max-w-lg mx-auto whitespace-pre-line"
              >
                {q.intro}
              </motion.p>
              <motion.h3 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, duration: 1 }}
                className="text-3xl md:text-5xl lg:text-6xl font-display text-primary tracking-tight leading-tight"
              >
                {q.question}
              </motion.h3>
            </div>

            <div className="grid grid-cols-1 gap-4 max-w-xl mx-auto">
              {q.options.map((opt, idx) => (
                <motion.button
                  key={idx}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 + (idx * 0.1), duration: 0.8 }}
                  onClick={() => handleAnswer(opt.value)}
                  className={`w-full p-8 text-center rounded-[2.5rem] border transition-all duration-700 relative overflow-hidden group ${
                    answers[q.id] === opt.value
                      ? 'bg-primary text-primary-foreground border-primary shadow-premium'
                      : 'bg-primary/[0.01] border-primary/5 text-primary/50 hover:bg-primary/[0.03] hover:border-primary/10 hover:text-primary hover:scale-[1.01]'
                  }`}
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary-foreground/5 to-transparent -translate-x-[100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
                  <span className="relative z-10 text-sm md:text-base font-bold uppercase tracking-[0.2em]">{opt.label}</span>
                </motion.button>
              ))}
            </div>
          </motion.div>
        </AnimatePresence>

        <div className="pt-12 flex justify-center">
          <button 
            onClick={() => step > 0 && setStep(step - 1)}
            disabled={step === 0}
            className="flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.4em] text-primary/10 hover:text-primary/30 transition-colors disabled:opacity-0"
          >
            <ArrowLeft className="w-4 h-4" /> Anterior
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default SpiritualQuiz;
