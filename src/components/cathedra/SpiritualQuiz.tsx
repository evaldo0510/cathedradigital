import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Heart, BookOpen, Sun, ArrowRight, ArrowLeft, Flame, Brain, Clock, Shield, Eye, Wind, Anchor, Mountain, Users, Church } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { AppRoute } from '@/types';
import confetti from 'canvas-confetti';

/* ── Types ── */
export type ProfileId = 'ferido_em_busca' | 'ansioso_buscador' | 'sedento_de_sentido' | 'firme_aprofundando' | 'ardente_missionario';
export type PainId = 'ansiedade' | 'culpa' | 'vazio' | 'distancia' | 'solidao';
export type DirectionId = 'silencio' | 'perdao' | 'proposito' | 'oracao' | 'servico';

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
    color: 'text-rose-500',
    bgGradient: 'from-rose-500/5 via-card to-amber-500/5',
    logosPrompt: 'Estou ansioso e ferido. Preciso encontrar paz interior. Me ajude com uma reflexão acolhedora.',
    greeting: 'Que a paz de Cristo alcance o seu coração hoje.',
  },
  ansioso_buscador: {
    title: 'Ansioso Buscador',
    emoji: '🌊',
    message: 'Você carrega peso demais sozinho. Mas quem busca, encontra — e você já está buscando. Permita-se descansar n\'Aquele que carrega o mundo.',
    pain: { id: 'culpa', label: 'Culpa ou peso interior' },
    direction: { id: 'perdao', label: 'Acolher o perdão e se libertar' },
    journeyName: 'Libertação Interior',
    theme: 'Perdão',
    color: 'text-sky-500',
    bgGradient: 'from-sky-500/5 via-card to-violet-500/5',
    logosPrompt: 'Sinto culpa e peso interior. Preciso entender o perdão de Deus. Me ajude a me libertar.',
    greeting: 'Deus já perdoou. Agora é a sua vez de se libertar.',
  },
  sedento_de_sentido: {
    title: 'Sedento de Sentido',
    emoji: '🔍',
    message: 'Algo dentro de você sabe que a vida pede mais. Essa inquietação não é fraqueza — é vocação. O sentido que você procura tem nome.',
    pain: { id: 'vazio', label: 'Vazio existencial' },
    direction: { id: 'proposito', label: 'Descobrir o propósito verdadeiro' },
    journeyName: 'Propósito Interior',
    theme: 'Fé',
    color: 'text-amber-500',
    bgGradient: 'from-amber-500/5 via-card to-emerald-500/5',
    logosPrompt: 'Sinto vazio existencial e busco propósito. Me ajude a encontrar sentido na fé.',
    greeting: 'Quem busca de coração, encontra. Continue caminhando.',
  },
  firme_aprofundando: {
    title: 'Firme e Aprofundando',
    emoji: '📖',
    message: 'Você já caminha com firmeza, mas sente o chamado para ir mais fundo. A santidade não é destino — é caminho diário. Continue.',
    pain: { id: 'distancia', label: 'Desejo de mais profundidade' },
    direction: { id: 'oracao', label: 'Mergulhar na oração contemplativa' },
    journeyName: 'Formação Teológica',
    theme: 'Oração',
    color: 'text-primary',
    bgGradient: 'from-primary/5 via-card to-secondary/5',
    logosPrompt: 'Quero aprofundar minha fé e vida de oração. Me guie na contemplação e no estudo teológico.',
    greeting: 'Persevere na santidade. Cada dia é um passo.',
  },
  ardente_missionario: {
    title: 'Ardente Missionário',
    emoji: '🔥',
    message: 'O fogo que arde em você não é acaso — é o Espírito Santo. Você foi chamado para incendiar o mundo com a verdade do Evangelho.',
    pain: { id: 'solidao', label: 'Solidão na missão' },
    direction: { id: 'servico', label: 'Servir com raízes profundas' },
    journeyName: 'Vida Mística',
    theme: 'Propósito',
    color: 'text-red-500',
    bgGradient: 'from-red-500/5 via-card to-orange-500/5',
    logosPrompt: 'Sou missionário e quero servir melhor. Me ajude a aprofundar a missão com raízes espirituais.',
    greeting: 'O Espírito arde em você. Vá e incendeie o mundo.',
  },
};

/* ── Questions (7 perguntas) ── */
interface QuizOption {
  label: string;
  value: string;
  icon: React.ReactNode;
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
    intro: 'Respire fundo.\nEsta primeira pergunta é sobre onde você está agora.',
    question: 'Como está o seu interior neste momento?',
    options: [
      { label: 'Pesado, cansado por dentro', value: 'pesado', icon: <Heart className="w-spacing-md h-spacing-md" />, weight: { ferido_em_busca: 4, ansioso_buscador: 2, sedento_de_sentido: 0, firme_aprofundando: 0, ardente_missionario: 0 } },
      { label: 'Inquieto, procurando algo', value: 'inquieto', icon: <Wind className="w-spacing-md h-spacing-md" />, weight: { ferido_em_busca: 1, ansioso_buscador: 1, sedento_de_sentido: 4, firme_aprofundando: 0, ardente_missionario: 0 } },
      { label: 'Estável, mas querendo mais', value: 'estavel', icon: <Anchor className="w-spacing-md h-spacing-md" />, weight: { ferido_em_busca: 0, ansioso_buscador: 0, sedento_de_sentido: 1, firme_aprofundando: 4, ardente_missionario: 1 } },
      { label: 'Aceso, pronto para agir', value: 'aceso', icon: <Flame className="w-spacing-md h-spacing-md" />, weight: { ferido_em_busca: 0, ansioso_buscador: 0, sedento_de_sentido: 0, firme_aprofundando: 1, ardente_missionario: 4 } },
    ],
  },
  {
    id: 'dor',
    intro: 'Não tenha medo de olhar para dentro.\nDeus já conhece essa dor — e quer curá-la.',
    question: 'O que mais pesa no seu coração?',
    options: [
      { label: 'Ansiedade ou medo do futuro', value: 'ansiedade', icon: <Wind className="w-spacing-md h-spacing-md" />, weight: { ferido_em_busca: 4, ansioso_buscador: 2, sedento_de_sentido: 1, firme_aprofundando: 0, ardente_missionario: 0 } },
      { label: 'Culpa, remorso ou mágoas', value: 'culpa', icon: <Heart className="w-spacing-md h-spacing-md" />, weight: { ferido_em_busca: 1, ansioso_buscador: 4, sedento_de_sentido: 1, firme_aprofundando: 0, ardente_missionario: 0 } },
      { label: 'Vazio, falta de propósito', value: 'vazio', icon: <Eye className="w-spacing-md h-spacing-md" />, weight: { ferido_em_busca: 0, ansioso_buscador: 1, sedento_de_sentido: 4, firme_aprofundando: 0, ardente_missionario: 0 } },
      { label: 'Desejo de fazer mais por Deus', value: 'chamado', icon: <Flame className="w-spacing-md h-spacing-md" />, weight: { ferido_em_busca: 0, ansioso_buscador: 0, sedento_de_sentido: 0, firme_aprofundando: 2, ardente_missionario: 4 } },
    ],
  },
  {
    id: 'conhecimento',
    intro: 'A fé e a razão caminham juntas.\nConhecer a verdade nos liberta.',
    question: 'Como você avalia seu conhecimento sobre a Fé?',
    options: [
      { label: 'Estou começando agora', value: 'iniciante', icon: <BookOpen className="w-spacing-md h-spacing-md" />, weight: { ferido_em_busca: 3, ansioso_buscador: 3, sedento_de_sentido: 1, firme_aprofundando: 0, ardente_missionario: 0 } },
      { label: 'Conheço o básico, mas quero mais', value: 'medio', icon: <Brain className="w-spacing-md h-spacing-md" />, weight: { ferido_em_busca: 0, ansioso_buscador: 1, sedento_de_sentido: 3, firme_aprofundando: 1, ardente_missionario: 0 } },
      { label: 'Tenho uma boa base doutrinária', value: 'avancado', icon: <Shield className="w-spacing-md h-spacing-md" />, weight: { ferido_em_busca: 0, ansioso_buscador: 0, sedento_de_sentido: 1, firme_aprofundando: 4, ardente_missionario: 1 } },
      { label: 'Estudo profundamente há anos', value: 'mestre', icon: <Sparkles className="w-spacing-md h-spacing-md" />, weight: { ferido_em_busca: 0, ansioso_buscador: 0, sedento_de_sentido: 0, firme_aprofundando: 1, ardente_missionario: 4 } },
    ],
  },
  {
    id: 'oracao',
    intro: 'A oração é o termômetro da alma.\nEla revela onde você está — sem julgamento.',
    question: 'Qual a sua relação com a oração?',
    options: [
      { label: 'Quase não rezo', value: 'raro', icon: <Sun className="w-spacing-md h-spacing-md" />, weight: { ferido_em_busca: 3, ansioso_buscador: 1, sedento_de_sentido: 2, firme_aprofundando: 0, ardente_missionario: 0 } },
      { label: 'Rezo nos momentos difíceis', value: 'crise', icon: <Shield className="w-spacing-md h-spacing-md" />, weight: { ferido_em_busca: 1, ansioso_buscador: 3, sedento_de_sentido: 1, firme_aprofundando: 0, ardente_missionario: 0 } },
      { label: 'Tenho tentado criar uma rotina', value: 'rotina', icon: <Sparkles className="w-spacing-md h-spacing-md" />, weight: { ferido_em_busca: 0, ansioso_buscador: 0, sedento_de_sentido: 2, firme_aprofundando: 3, ardente_missionario: 0 } },
      { label: 'Rezo diariamente com profundidade', value: 'profunda', icon: <Flame className="w-spacing-md h-spacing-md" />, weight: { ferido_em_busca: 0, ansioso_buscador: 0, sedento_de_sentido: 0, firme_aprofundando: 1, ardente_missionario: 3 } },
    ],
  },
  {
    id: 'tempo',
    intro: 'Deus habita no agora.\nO tempo que damos a Ele é sagrado.',
    question: 'Quanto tempo você dedica a Deus por dia?',
    options: [
      { label: 'Menos de 15 minutos', value: 'pouco', icon: <Clock className="w-spacing-md h-spacing-md" />, weight: { ferido_em_busca: 3, ansioso_buscador: 3, sedento_de_sentido: 1, firme_aprofundando: 0, ardente_missionario: 0 } },
      { label: 'Entre 15 e 30 minutos', value: 'medio', icon: <Clock className="w-spacing-md h-spacing-md" />, weight: { ferido_em_busca: 0, ansioso_buscador: 1, sedento_de_sentido: 3, firme_aprofundando: 2, ardente_missionario: 0 } },
      { label: 'Mais de 30 minutos', value: 'muito', icon: <Clock className="w-spacing-md h-spacing-md" />, weight: { ferido_em_busca: 0, ansioso_buscador: 0, sedento_de_sentido: 1, firme_aprofundando: 3, ardente_missionario: 2 } },
      { label: 'Vivo em constante oração', value: 'contemplativo', icon: <Flame className="w-spacing-md h-spacing-md" />, weight: { ferido_em_busca: 0, ansioso_buscador: 0, sedento_de_sentido: 0, firme_aprofundando: 1, ardente_missionario: 4 } },
    ],
  },
  {
    id: 'sacramento',
    intro: 'Os sacramentos são o toque de Deus\nna concretude da sua vida.',
    question: 'Como você vive os Sacramentos?',
    options: [
      { label: 'Fui batizado mas não pratico', value: 'batizado', icon: <Church className="w-spacing-md h-spacing-md" />, weight: { ferido_em_busca: 3, ansioso_buscador: 2, sedento_de_sentido: 1, firme_aprofundando: 0, ardente_missionario: 0 } },
      { label: 'Vou à Missa quando posso', value: 'eventual', icon: <Church className="w-spacing-md h-spacing-md" />, weight: { ferido_em_busca: 0, ansioso_buscador: 1, sedento_de_sentido: 3, firme_aprofundando: 1, ardente_missionario: 0 } },
      { label: 'Missa semanal e confissão regular', value: 'regular', icon: <Sparkles className="w-spacing-md h-spacing-md" />, weight: { ferido_em_busca: 0, ansioso_buscador: 0, sedento_de_sentido: 0, firme_aprofundando: 3, ardente_missionario: 1 } },
      { label: 'Vida sacramental intensa e diária', value: 'intensa', icon: <Flame className="w-spacing-md h-spacing-md" />, weight: { ferido_em_busca: 0, ansioso_buscador: 0, sedento_de_sentido: 0, firme_aprofundando: 1, ardente_missionario: 3 } },
    ],
  },
  {
    id: 'obstaculo',
    intro: 'Identificar o obstáculo\né o primeiro passo para a superação.',
    question: 'O que mais te impede de crescer hoje?',
    options: [
      { label: 'Cansaço ou esgotamento mental', value: 'cansaco', icon: <Wind className="w-spacing-md h-spacing-md" />, weight: { ferido_em_busca: 4, ansioso_buscador: 1, sedento_de_sentido: 0, firme_aprofundando: 0, ardente_missionario: 0 } },
      { label: 'Falta de tempo e correria', value: 'tempo', icon: <Clock className="w-spacing-md h-spacing-md" />, weight: { ferido_em_busca: 0, ansioso_buscador: 4, sedento_de_sentido: 1, firme_aprofundando: 0, ardente_missionario: 0 } },
      { label: 'Falta de foco ou preguiça', value: 'foco', icon: <Brain className="w-spacing-md h-spacing-md" />, weight: { ferido_em_busca: 0, ansioso_buscador: 0, sedento_de_sentido: 2, firme_aprofundando: 3, ardente_missionario: 0 } },
      { label: 'Sentir-se sozinho na caminhada', value: 'solidao', icon: <Users className="w-spacing-md h-spacing-md" />, weight: { ferido_em_busca: 1, ansioso_buscador: 0, sedento_de_sentido: 2, firme_aprofundando: 0, ardente_missionario: 3 } },
    ],
  },
  {
    id: 'comunidade',
    intro: 'Ninguém caminha sozinho.\nA fé se fortalece na comunhão.',
    question: 'Como é a sua relação com a comunidade?',
    options: [
      { label: 'Não participo de nenhum grupo', value: 'sozinho', icon: <Sun className="w-spacing-md h-spacing-md" />, weight: { ferido_em_busca: 3, ansioso_buscador: 2, sedento_de_sentido: 1, firme_aprofundando: 0, ardente_missionario: 0 } },
      { label: 'Gostaria, mas não sei como', value: 'desejo', icon: <Heart className="w-spacing-md h-spacing-md" />, weight: { ferido_em_busca: 1, ansioso_buscador: 2, sedento_de_sentido: 3, firme_aprofundando: 0, ardente_missionario: 0 } },
      { label: 'Participo de um grupo ou pastoral', value: 'ativo', icon: <Users className="w-spacing-md h-spacing-md" />, weight: { ferido_em_busca: 0, ansioso_buscador: 0, sedento_de_sentido: 0, firme_aprofundando: 3, ardente_missionario: 1 } },
      { label: 'Lidero ou sirvo ativamente', value: 'lider', icon: <Flame className="w-spacing-md h-spacing-md" />, weight: { ferido_em_busca: 0, ansioso_buscador: 0, sedento_de_sentido: 0, firme_aprofundando: 0, ardente_missionario: 3 } },
    ],
  },
  {
    id: 'desejo',
    intro: 'O desejo mais profundo do coração\nrevela a direção que Deus traçou para você.',
    question: 'O que o seu coração mais pede agora?',
    options: [
      { label: 'Paz, silêncio interior', value: 'paz', icon: <Mountain className="w-spacing-md h-spacing-md" />, weight: { ferido_em_busca: 4, ansioso_buscador: 1, sedento_de_sentido: 1, firme_aprofundando: 0, ardente_missionario: 0 } },
      { label: 'Cura, libertação de algo', value: 'cura', icon: <Heart className="w-spacing-md h-spacing-md" />, weight: { ferido_em_busca: 1, ansioso_buscador: 4, sedento_de_sentido: 0, firme_aprofundando: 0, ardente_missionario: 0 } },
      { label: 'Sentido, propósito claro', value: 'sentido', icon: <Eye className="w-spacing-md h-spacing-md" />, weight: { ferido_em_busca: 0, ansioso_buscador: 1, sedento_de_sentido: 4, firme_aprofundando: 1, ardente_missionario: 0 } },
      { label: 'Servir, fazer diferença', value: 'servir', icon: <Flame className="w-spacing-md h-spacing-md" />, weight: { ferido_em_busca: 0, ansioso_buscador: 0, sedento_de_sentido: 0, firme_aprofundando: 1, ardente_missionario: 4 } },
    ],
  },
  {
    id: 'passo',
    intro: 'Esta é a última pergunta.\nResponda com sinceridade — não para acertar,\nmas para se encontrar.',
    question: 'Qual seria o próximo passo ideal para você?',
    options: [
      { label: 'Parar, respirar e acolher a dor', value: 'parar', icon: <Mountain className="w-spacing-md h-spacing-md" />, weight: { ferido_em_busca: 4, ansioso_buscador: 2, sedento_de_sentido: 0, firme_aprofundando: 0, ardente_missionario: 0 } },
      { label: 'Entender melhor a fé católica', value: 'entender', icon: <BookOpen className="w-spacing-md h-spacing-md" />, weight: { ferido_em_busca: 0, ansioso_buscador: 1, sedento_de_sentido: 4, firme_aprofundando: 1, ardente_missionario: 0 } },
      { label: 'Aprofundar na vida espiritual', value: 'aprofundar', icon: <Sparkles className="w-spacing-md h-spacing-md" />, weight: { ferido_em_busca: 0, ansioso_buscador: 0, sedento_de_sentido: 1, firme_aprofundando: 4, ardente_missionario: 1 } },
      { label: 'Evangelizar e servir na missão', value: 'missao', icon: <Flame className="w-spacing-md h-spacing-md" />, weight: { ferido_em_busca: 0, ansioso_buscador: 0, sedento_de_sentido: 0, firme_aprofundando: 0, ardente_missionario: 4 } },
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

/* ── Component ── */
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

  useEffect(() => {
    if (!user) return;
    (supabase as any)
      .from('user_sensitive_data')
      .select('diagnosis_result')
      .eq('user_id', user.id)
      .maybeSingle()
      .then(({ data }: any) => {
        const res = data?.diagnosis_result;
        const sp = res?.spiritual_profile;
        if (sp && PROFILES[sp as ProfileId]) {
          setDone(true);
          setExisting(sp);
          setExistingData(res);
        }
      });
  }, [user]);

  const handleAnswer = useCallback((value: string) => {
    const q = QUESTIONS[step];
    const next = { ...answers, [q.id]: value };
    setAnswers(next);
    if (step < QUESTIONS.length - 1) {
      setTimeout(() => setStep(s => s + 1), 350);
    } else {
      const profileId = computeProfile(next);
      setResult(profileId);
      setPhase('result');
      confetti({ particleCount: 120, spread: 80, origin: { y: 0.6 }, colors: ['#FFD700', '#8B5CF6', '#F43F5E'] });
      saveResult(profileId, next);
    }
  }, [step, answers]);

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

  // ── Compact result (already done) ──
  if (done && existing && PROFILES[existing]) {
    const p = PROFILES[existing];
    const painLabel = existingData?.pain || p.pain.label;
    const dirLabel = existingData?.direction || p.direction.label;
    
    return (
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="rounded-premium border border-border bg-card p-spacing-md space-y-spacing-sm">
        <div className="flex items-center justify-between">
          <span className="text-xs font-black uppercase tracking-[0.3em] text-muted-foreground">Seu Perfil Espiritual</span>
          <Button 
            onClick={reset} 
            className="text-xs text-primary hover:underline focus-visible:ring-2 focus-visible:ring-primary outline-none rounded px-spacing-2xs"
            aria-label="Refazer teste de perfil espiritual"
          >
            Refazer
          </Button>
        </div>

        <div className="flex items-center gap-spacing-sm">
          <span className="text-3xl">{p.emoji}</span>
          <div className="flex-1 min-w-0">
            <h3 className={`text-base font-bold ${p.color}`}>{p.title}</h3>
            <p className="text-premium-small text-muted-foreground mt-spacing-3xs">💔 {painLabel} · 🔥 {dirLabel}</p>
          </div>
        </div>
        <div className="flex gap-spacing-xs">
          <Button size="sm" className="flex-1 rounded-full text-xs bg-primary text-primary-foreground" onClick={() => navigate(AppRoute.JORNADAS)}>
            <Sparkles className="w-spacing-sm h-spacing-sm mr-spacing-2xs" /> {p.journeyName}
          </Button>
          <Button size="sm" variant="outline" className="rounded-full text-xs" onClick={() => navigate(AppRoute.STUDY_MODE)}>
            <Brain className="w-spacing-sm h-spacing-sm mr-spacing-2xs" /> Logos
          </Button>
        </div>
      </motion.div>
    );
  }

  // ── Result ──
  if (phase === 'result' && result) {
    const p = PROFILES[result];
    const painQ = QUESTIONS.find(q => q.id === 'dor');
    const painOpt = painQ?.options.find(o => o.value === answers['dor']);
    const painLabel = painOpt?.label || p.pain.label;

    const dirQ = QUESTIONS.find(q => q.id === 'desejo');
    const dirOpt = dirQ?.options.find(o => o.value === answers['desejo']);
    const dirLabel = dirOpt?.label || p.direction.label;

    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className={`rounded-full border border-secondary/20 bg-gradient-to-br ${p.bgGradient} p-spacing-lg md:p-spacing-xl space-y-spacing-lg shadow-premium`}
      >
        <div className="text-center space-y-spacing-sm">
          <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', delay: 0.2 }} className="text-5xl block">{p.emoji}</motion.span>
          <p className="text-xs font-black uppercase tracking-[0.3em] text-secondary">✨ Seu momento atual</p>
          <h2 className={`text-2xl font-black ${p.color}`}>{p.title}</h2>
          <p className="text-sm text-foreground/80 leading-relaxed max-w-spacing-sm mx-auto italic font-serif">"{p.message}"</p>
        </div>

        <div className="h-px bg-gradient-to-r from-transparent via-border to-transparent" />

        <div className="grid grid-cols-2 gap-spacing-sm">
          <div className="p-spacing-sm rounded-premium bg-background/60 border border-border space-y-spacing-2xs text-center">
            <p className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground">💔 O que te trava</p>
            <p className="text-sm font-bold text-foreground">{painLabel}</p>
          </div>
          <div className="p-spacing-sm rounded-premium bg-background/60 border border-border space-y-spacing-2xs text-center">
            <p className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground">🔥 Seu caminho</p>
            <p className="text-sm font-bold text-foreground">{dirLabel}</p>
          </div>
        </div>

        <div className="h-px bg-gradient-to-r from-transparent via-border to-transparent" />

        <div className="space-y-spacing-xs">
          <p className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground text-center">Recomendado para você</p>
          <div className="space-y-spacing-xs text-sm">
            <div className="flex items-center gap-spacing-xs px-spacing-sm py-spacing-xs rounded-premium bg-primary/[0.04] border border-primary/10">
              <Sparkles className="w-spacing-md h-spacing-md text-primary shrink-0" />
              <span className="text-foreground/80">Jornada: <strong className="text-foreground">{p.journeyName}</strong></span>
            </div>
            <div className="flex items-center gap-spacing-xs px-spacing-sm py-spacing-xs rounded-premium bg-primary/[0.04] border border-primary/10">
              <BookOpen className="w-spacing-md h-spacing-md text-primary shrink-0" />
              <span className="text-foreground/80">Tema: <strong className="text-foreground">{p.theme}</strong></span>
            </div>
            <div className="flex items-center gap-spacing-xs px-spacing-sm py-spacing-xs rounded-premium bg-secondary/[0.06] border border-secondary/10">
              <Brain className="w-spacing-md h-spacing-md text-secondary shrink-0" />
              <span className="text-foreground/80">Reflexão com <strong className="text-foreground">Logos IA</strong></span>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-spacing-sm">
          <Button onClick={() => navigate(AppRoute.JORNADAS)} className="rounded-full h-spacing-2xl gap-spacing-xs font-bold text-xs uppercase tracking-widest bg-primary text-primary-foreground">
            <Sparkles className="w-spacing-md h-spacing-md" /> Começar agora
          </Button>
          <Button variant="outline" onClick={() => navigate(AppRoute.STUDY_MODE)} className="rounded-full h-spacing-xl gap-spacing-xs text-xs font-bold border-secondary/30 text-secondary hover:bg-secondary/5">
            <Brain className="w-spacing-md h-spacing-md" /> Refletir com Logos
          </Button>
          <Button variant="ghost" size="sm" onClick={() => { setDone(true); setExisting(result); }} className="text-xs text-muted-foreground">
            Continuar navegando
          </Button>
        </div>
      </motion.div>
    );
  }

  // ── Intro ──
  if (phase === 'intro') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-full border border-secondary/20 bg-gradient-to-br from-card to-secondary/5 p-spacing-lg md:p-spacing-xl space-y-spacing-md shadow-md text-center"
      >
        <div className="space-y-spacing-sm">
          <span className="text-4xl block">🧠</span>
          <h2 className="text-xl font-black text-foreground leading-tight">Descubra seu momento espiritual</h2>
          <p className="text-sm text-muted-foreground leading-relaxed max-w-spacing-xs mx-auto">
            Responda {QUESTIONS.length} perguntas rápidas e receba um caminho personalizado
          </p>
        </div>
        <div className="flex items-center justify-center gap-spacing-2xs text-muted-foreground">
          <Clock className="w-spacing-sm h-spacing-sm" />
          <span className="text-premium-small font-medium">Leva menos de 2 minutos</span>
        </div>
        <Button
          onClick={() => setPhase('quiz')}
          className="w-full rounded-full h-spacing-2xl gap-spacing-xs font-bold text-xs uppercase tracking-widest bg-secondary text-secondary-foreground hover:bg-secondary/90"
        >
          Começar <ArrowRight className="w-spacing-md h-spacing-md" />
        </Button>
      </motion.div>
    );
  }

  // ── Quiz ──
  const q = QUESTIONS[step];

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-full border border-secondary/20 bg-gradient-to-br from-card to-secondary/5 p-spacing-lg space-y-spacing-md shadow-md"
    >
      <div className="space-y-spacing-2xs">
        <div className="flex items-center justify-between">
          <p className="text-xs font-black uppercase tracking-[0.3em] text-secondary">Quiz Espiritual</p>
          <p className="text-xs font-bold text-muted-foreground">Pergunta {step + 1} de {QUESTIONS.length}</p>
        </div>
        <div className="h-spacing-2xs bg-muted rounded-premium overflow-hidden">
          <motion.div className="h-full bg-secondary rounded-premium" animate={{ width: `${progress}%` }} transition={{ type: 'spring', damping: 20 }} />
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={q.id}
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -30 }}
          transition={{ duration: 0.3 }}
          className="space-y-spacing-md"
        >
          <p className="text-xs text-muted-foreground text-center italic leading-relaxed whitespace-pre-line font-serif">{q.intro}</p>
          <h3 className="text-base font-bold text-foreground text-center leading-snug">{q.question}</h3>
          <div className="space-y-spacing-xs" role="radiogroup" aria-label={q.question}>
            {q.options.map((opt) => (
              <motion.button
                key={opt.value}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleAnswer(opt.value)}
                role="radio"
                aria-checked={answers[q.id] === opt.value}
                className="w-full flex items-center gap-spacing-sm p-spacing-sm rounded-full border border-border bg-card hover:border-secondary/40 hover:bg-secondary/5 transition-all text-left group focus-visible:ring-2 focus-visible:ring-secondary outline-none"
              >
                <span className="text-secondary/60 group-hover:text-secondary transition-colors shrink-0" aria-hidden="true">{opt.icon}</span>
                <span className="text-sm font-medium text-foreground/80 group-hover:text-foreground transition-colors">{opt.label}</span>
              </motion.button>
            ))}
          </div>

        </motion.div>
      </AnimatePresence>

      {step > 0 && (
        <Button onClick={() => setStep(s => s - 1)} className="flex items-center gap-spacing-2xs text-xs text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="w-spacing-sm h-spacing-sm" /> Voltar
        </Button>
      )}
    </motion.div>
  );
};

export default SpiritualQuiz;
