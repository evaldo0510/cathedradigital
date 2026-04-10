import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Sun, Moon, BookOpen, Hand, PenLine, ChevronRight, Flame, Calendar, Compass, Sparkles, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { AppRoute } from '@/types';
import { LangContext } from '@/contexts/LangContext';

const getGreeting = () => {
  const h = new Date().getHours();
  if (h < 12) return { text: 'Bom dia', icon: <Sun className="w-6 h-6 text-primary" />, period: 'manhã' };
  if (h < 18) return { text: 'Boa tarde', icon: <Sun className="w-6 h-6 text-primary" />, period: 'tarde' };
  return { text: 'Boa noite', icon: <Moon className="w-6 h-6 text-primary" />, period: 'noite' };
};

const LITURGICAL_QUOTES = [
  '"Sede misericordiosos como vosso Pai é misericordioso." — Lc 6,36',
  '"Eu sou o caminho, a verdade e a vida." — Jo 14,6',
  '"Vinde a mim todos vós que estais cansados." — Mt 11,28',
  '"Não tenhais medo, eu venci o mundo." — Jo 16,33',
  '"Amai-vos uns aos outros como eu vos amei." — Jo 15,12',
];

const DEEP_INSIGHTS: Record<string, {
  theme: string;
  quote: string;
  interpretation: string;
  direction: string;
  exercise: string;
  question: string;
}> = {
  iniciante: {
    theme: 'O Silêncio de Deus',
    quote: '“O silêncio é a primeira linguagem de Deus.”',
    interpretation: 'No silêncio, conseguimos ouvir a voz de Deus em nosso coração, que fala sem palavras mas com clareza.',
    direction: 'Hoje não tente preencher todos os vazios… deixe um tempo para o Senhor falar no silêncio.',
    exercise: 'Pare por 2 minutos. Feche os olhos e apenas respire, oferecendo este tempo a Deus em silêncio.',
    question: '👉 Como você se sentiu nesse pequeno tempo de silêncio?'
  },
  intermediário: {
    theme: 'A pressa como fuga',
    quote: '“A pressa não nasce do tempo… nasce do desconforto de permanecer.”',
    interpretation: 'Você não está com pressa do mundo… você está com pressa de não sentir algo que está dentro.',
    direction: 'Hoje não tente acelerar… tente perceber o que você evita quando desacelera.',
    exercise: 'Pare por 5 minutos. Observe um momento em que você quis correr. Escreva o que estava por trás disso.',
    question: '👉 O que em você não suporta silêncio?'
  },
  avançado: {
    theme: 'A pressa como idolatria do "eu"',
    quote: '“A pressa é o ruído da alma que foge de si mesma.”',
    interpretation: 'Sua agitação não é falta de tempo, é medo do que o silêncio revelará sobre sua dependência das criaturas em vez do Criador.',
    direction: 'Identifique em qual atividade você usa a pressa para evitar o exame de consciência e a confrontação com sua própria fragilidade.',
    exercise: 'Durante uma tarefa mecânica, não use fones nem distrações. Enfrente o fluxo de pensamentos e sentimentos sem fugir pelo ruído.',
    question: '👉 Do que exatamente você está tentando fugir quando se mantém ocupado?'
  }
};

const HojePage: React.FC = () => {
  const navigate = useNavigate();
  const { user, profile, userLevel } = useAuth();
  const { t } = useContext(LangContext);
  const DEEP_INSIGHT = DEEP_INSIGHTS[userLevel];
  const greeting = getGreeting();
  const [journalText, setJournalText] = useState('');
  const [journalSaved, setJournalSaved] = useState(false);
  const [todayQuote] = useState(() => LITURGICAL_QUOTES[new Date().getDate() % LITURGICAL_QUOTES.length]);
  const [activeJourney, setActiveJourney] = useState<any>(null);
  const [journeyStep, setJourneyStep] = useState<any>(null);
  const [journeyProgress, setJourneyProgress] = useState({ completed: 0, total: 0 });
  const [recommendedJourney, setRecommendedJourney] = useState<any>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [logosResponse, setLogosResponse] = useState('');
  const [logosRecommendation, setLogosRecommendation] = useState<any>(null);
  const [recommendedLogosJourney, setRecommendedLogosJourney] = useState<any>(null);
  const [recommendedLogosStep, setRecommendedLogosStep] = useState<any>(null);
  const [showDeepInsight, setShowDeepInsight] = useState(true);


  useEffect(() => {
    if (!user) return;
    loadActiveJourney();
    loadRecommendedJourney();
  }, [user]);

  const loadActiveJourney = async () => {
    if (!user) return;
    try {
      const { data: progress } = await supabase
        .from('journey_progress')
        .select('journey_id, step_id, completed_at')
        .eq('user_id', user.id)
        .order('completed_at', { ascending: false })
        .limit(1);

      if (progress && progress.length > 0) {
        const lastJourneyId = progress[0].journey_id;
        const { data: journey } = await supabase
          .from('journeys')
          .select('*')
          .eq('id', lastJourneyId)
          .single();

        if (journey) {
          setActiveJourney(journey);
          const [completedRes, stepsRes] = await Promise.all([
            supabase
              .from('journey_progress')
              .select('step_id')
              .eq('user_id', user.id)
              .eq('journey_id', lastJourneyId),
            supabase
              .from('journey_steps')
              .select('*')
              .eq('journey_id', lastJourneyId)
              .order('step_order', { ascending: true })
          ]);

          const completedSteps = completedRes.data;
          const allSteps = stepsRes.data;

          if (allSteps) {
            const completedIds = (completedSteps || []).map(s => s.step_id);
            setJourneyProgress({ completed: completedIds.length, total: allSteps.length });
            const next = allSteps.find(s => !completedIds.includes(s.id));
            setJourneyStep(next || null);
          }
        }
      } else {
        loadRecommendedJourney();
      }
    } catch (err) {
      console.error('Failed to load active journey:', err);
    }
  };

  const loadRecommendedJourney = async () => {
    if (!user) return;
    try {
      const result = profile?._sensitive?.diagnosis_result as Record<string, string> | undefined;
      const { moment, prayer, knowledge, goal } = result || {};
      let category = 'fundamentos';
      
      if (userLevel === 'iniciante' || moment === 'beginning' || knowledge === 'basic') {
        category = 'fundamentos';
      } else if (userLevel === 'avançado' || prayer === 'contemplative' || goal === 'transformation') {
        category = 'formacao';
      } else if (moment === 'struggling' || goal === 'peace') {
        category = 'mistico';
      } else if (goal === 'routine' || prayer === 'rarely' || prayer === 'sometimes') {
        category = 'rotina';
      }

      const { data } = await supabase
        .from('journeys')
        .select('*')
        .eq('category', category)
        .eq('is_active', true)
        .order('sort_order', { ascending: true })
        .limit(1)
        .maybeSingle();

      if (data) setRecommendedJourney(data);
    } catch (err) {
      console.error('Failed to load recommended journey:', err);
    }
  };

  const analyzeReflection = async (text: string) => {
    if (!user || !text.trim()) return;
    setIsAnalyzing(true);
    setLogosResponse('');
    setLogosRecommendation(null);
    setRecommendedLogosJourney(null);

    try {
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/colloquium`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ messages: [{ role: 'user', content: text }] }),
      });

      if (!response.ok) throw new Error('Failed to fetch Logos response');

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let fullText = '';

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value);
          const lines = chunk.split('\n');
          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const data = JSON.parse(line.slice(6));
                const content = data.choices?.[0]?.delta?.content || '';
                fullText += content;
                setLogosResponse(fullText);
              } catch (e) { /* skip */ }
            }
          }
        }
      }

      const match = fullText.match(/\[RECOMMENDATION:(.*?)\]/);
      if (match) {
        try {
          const recommendation = JSON.parse(match[1]);
          setLogosRecommendation(recommendation);
          
          const { data: journey } = await supabase
            .from('journeys')
            .select('*')
            .eq('category', recommendation.category)
            .eq('is_active', true)
            .order('sort_order', { ascending: true })
            .limit(1)
            .maybeSingle();

          if (journey) {
            setRecommendedLogosJourney(journey);
            
            // Fetch next step for this journey
            const [completedRes, stepsRes] = await Promise.all([
              supabase
                .from('journey_progress')
                .select('step_id')
                .eq('user_id', user.id)
                .eq('journey_id', journey.id),
              supabase
                .from('journey_steps')
                .select('*')
                .eq('journey_id', journey.id)
                .order('step_order', { ascending: true })
            ]);

            const completedIds = (completedRes.data || []).map(s => s.step_id);
            const next = (stepsRes.data || []).find(s => !completedIds.includes(s.id));
            setRecommendedLogosStep(next || null);
          }

        } catch (e) {
          console.error('Failed to parse recommendation:', e);
        }
      }
    } catch (err) {
      console.error('Failed to analyze reflection:', err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const saveJournal = async () => {
    if (!user || !journalText.trim()) return;
    try {
      await supabase.from('spiritual_journal').insert([{
        user_id: user.id,
        content: journalText.trim(),
        entry_date: new Date().toISOString().split('T')[0],
      }]);
      setJournalSaved(true);
      await analyzeReflection(journalText);
      setTimeout(() => setJournalSaved(false), 3000);
    } catch (err) {
      console.error('Failed to save journal:', err);
    }
  };

  const streak = (profile as any)?.streak || 0;
  const userName = (profile as any)?.name || user?.email?.split('@')[0] || '';

  const dailySections = [
    {
      title: 'Liturgia do Dia',
      description: 'Leituras e reflexão da liturgia diária',
      icon: <Calendar className="w-5 h-5" />,
      route: `${AppRoute.LITURGIA}?tab=liturgia`,
      color: 'bg-primary/10 text-primary',
    },
    {
      title: 'Oração',
      description: 'Rosário, Liturgia das Horas e orações',
      icon: <Hand className="w-5 h-5" />,
      route: AppRoute.ORACAO,
      color: 'bg-accent/10 text-accent',
    },
    {
      title: 'Lectio Divina',
      description: 'Leitura orante da Palavra de Deus',
      icon: <BookOpen className="w-5 h-5" />,
      route: AppRoute.LECTIO_DIVINA,
      color: 'bg-primary/10 text-primary',
    },
  ];

  return (
    <div className="space-y-6 max-w-2xl lg:max-w-4xl mx-auto">
      {/* Greeting */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-3"
      >
        {greeting.icon}
        <div>
          <h1 className="text-2xl font-bold font-serif text-foreground">
            {greeting.text}, {userName}
          </h1>
          <p className="text-sm text-muted-foreground">
            {streak > 0 ? (
              <span className="flex items-center gap-1">
                <Flame className="w-4 h-4 text-orange-500" /> {streak} dias consecutivos
              </span>
            ) : 'Comece seu dia com Deus'}
          </p>
        </div>
      </motion.div>

      {/* Daily Quote */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="p-4">
            <p className="text-sm italic text-foreground/80 font-serif">{todayQuote}</p>
          </CardContent>
        </Card>
      </motion.div>

      {/* Deep Insight Card */}
      {showDeepInsight && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.15 }}
        >
          <Card className="border-primary/40 bg-gradient-to-br from-primary/10 via-background to-background relative overflow-hidden shadow-lg">
            <div className="absolute top-0 right-0 p-4 opacity-5">
              <Sparkles className="w-16 h-16 text-primary" />
            </div>
            <CardHeader className="pb-2 flex flex-row items-center justify-between">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <p className="text-[10px] font-black uppercase tracking-[0.3em] text-primary/70">
                    Reflexão {userLevel === 'iniciante' ? 'Guiada' : userLevel === 'intermediário' ? 'Profunda' : 'Intensiva'}
                  </p>
                  <span className="px-1 py-0.5 rounded-full text-[8px] font-black uppercase bg-primary/10 text-primary border border-primary/20">
                    {userLevel}
                  </span>
                </div>
                <CardTitle className="text-lg font-serif italic text-foreground">
                  {DEEP_INSIGHT.theme}
                </CardTitle>
              </div>
              <Sparkles className="w-5 h-5 text-primary/40" />
            </CardHeader>
            <CardContent className="space-y-6 pt-2">
              <div className="space-y-3">
                <p className="text-xl font-serif italic leading-relaxed text-foreground">
                  {DEEP_INSIGHT.quote}
                </p>
                <div className="h-px w-12 bg-primary/20" />
                <p className="text-sm text-foreground/80 leading-relaxed italic">
                  {DEEP_INSIGHT.interpretation}
                </p>
              </div>

              <div className="grid grid-cols-1 gap-4 pt-2">
                <div className="bg-primary/5 rounded-xl p-4 border border-primary/10 space-y-2">
                  <div className="flex items-center gap-2 text-primary">
                    <Compass className="w-4 h-4" />
                    <span className="text-[10px] font-black uppercase tracking-widest">Direção</span>
                  </div>
                  <p className="text-sm text-foreground/90 font-medium">
                    {DEEP_INSIGHT.direction}
                  </p>
                </div>

                <div className="bg-accent/5 rounded-xl p-4 border border-accent/10 space-y-2">
                  <div className="flex items-center gap-2 text-accent">
                    <PenLine className="w-4 h-4" />
                    <span className="text-[10px] font-black uppercase tracking-widest">Exercício</span>
                  </div>
                  <p className="text-sm text-foreground/90 font-medium">
                    {DEEP_INSIGHT.exercise}
                  </p>
                </div>
              </div>

              <div className="pt-4 border-t border-primary/10">
                <p className="text-base font-serif italic text-primary font-semibold">
                  {DEEP_INSIGHT.question}
                </p>
              </div>

              <div className="flex gap-2 pt-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full text-[10px] font-black uppercase tracking-widest h-10"
                  onClick={() => {
                    setJournalText(prev => prev ? prev + '\n\n' + DEEP_INSIGHT.question : DEEP_INSIGHT.question);
                    // Scroll to journal area
                    const journalElement = document.getElementById('spiritual-journal');
                    journalElement?.scrollIntoView({ behavior: 'smooth' });
                  }}
                >
                  <PenLine className="w-3 h-3 mr-2" /> Responder no Diário
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="w-full text-[10px] font-black uppercase tracking-widest h-10 text-muted-foreground"
                  onClick={() => setShowDeepInsight(false)}
                >
                  Ocultar
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Active Journey with Progress */}
      {activeJourney && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
        >
          <Card className="border-primary/30 overflow-hidden bg-gradient-to-br from-primary/5 to-transparent">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Flame className="w-4 h-4 text-primary" />
                Sua Jornada: {activeJourney.title}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {journeyProgress.total > 0 && (
                <div className="space-y-1.5">
                  <Progress value={journeyProgress.total > 0 ? (journeyProgress.completed / journeyProgress.total) * 100 : 0} className="h-2" />
                  <p className="text-[10px] text-muted-foreground">
                    {journeyProgress.completed}/{journeyProgress.total} etapas concluídas
                    {journeyProgress.completed >= journeyProgress.total && ' ✓ Concluída!'}
                  </p>
                </div>
              )}
              {journeyStep ? (
                <p className="text-sm text-muted-foreground">Próxima etapa: <strong className="text-foreground">{journeyStep.title}</strong></p>
              ) : (
                <p className="text-sm text-primary font-semibold">🎉 Parabéns! Jornada concluída!</p>
              )}
              <Button
                size="sm"
                onClick={() => {
                  if (journeyStep) {
                    navigate(`/jornadas/${activeJourney.id}/step?step=${journeyStep.id}`);
                  } else {
                    navigate(`/jornadas/${activeJourney.id}/complete`);
                  }
                }}
                className="w-full"
              >
                {journeyStep ? 'Continuar Jornada' : 'Ver Certificado'} <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Recommended Journey (no active journey) */}
      {!activeJourney && recommendedJourney && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
        >
          <Card className="border-primary/20 bg-primary/5">
            <CardContent className="p-4 space-y-3">
              <div className="flex items-center gap-2">
                <Compass className="w-5 h-5 text-primary" />
                <h3 className="font-semibold text-sm text-foreground">Jornada Recomendada</h3>
              </div>
              <p className="text-sm text-foreground font-bold">{recommendedJourney.title}</p>
              <p className="text-xs text-muted-foreground">{recommendedJourney.description}</p>
              <Button
                size="sm"
                onClick={() => navigate(`/jornadas/${recommendedJourney.id}`)}
                className="w-full"
              >
                Começar Jornada <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      )}

      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-foreground">Experiência Diária</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {dailySections.map((section, i) => (
            <motion.div
              key={section.title}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 + i * 0.1 }}
            >
              <Card
                className="h-full cursor-pointer hover:border-primary/40 transition-all"
                onClick={() => navigate(section.route)}
              >
                <CardContent className="p-4 flex flex-col gap-4 h-full">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${section.color}`}>
                    {section.icon}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-sm text-foreground">{section.title}</h3>
                    <p className="text-xs text-muted-foreground">{section.description}</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground self-end" />
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Spiritual Journal */}
      <motion.div
        id="spiritual-journal"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <PenLine className="w-4 h-4 text-primary" />
              Diário Espiritual
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Textarea
              placeholder="O que Deus colocou no seu coração hoje?"
              value={journalText}
              onChange={(e) => setJournalText(e.target.value)}
              className="min-h-[80px] resize-none text-sm"
            />
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground">
                {journalSaved ? '✓ Salvo com sucesso!' : 'Suas reflexões são privadas.'}
              </p>
              <Button size="sm" onClick={saveJournal} disabled={!journalText.trim() || isAnalyzing}>
                {isAnalyzing ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Salvar'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Logos Analysis Response */}
      {(isAnalyzing || logosResponse) && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="space-y-4 pb-4"
        >
          <Card className="border-primary/40 bg-gradient-to-br from-primary/10 via-background to-background relative overflow-hidden shadow-xl">
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <Sparkles className="w-12 h-12 text-primary" />
            </div>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2 text-primary font-serif">
                <Sparkles className="w-4 h-4" />
                Logos
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {isAnalyzing && !logosResponse ? (
                <div className="flex items-center gap-3 py-6">
                  <Loader2 className="w-6 h-6 text-primary animate-spin" />
                  <p className="text-sm text-muted-foreground animate-pulse font-medium">Logos está refletindo sobre sua partilha...</p>
                </div>
              ) : (
                <div className="prose prose-sm dark:prose-invert max-w-none text-foreground leading-relaxed whitespace-pre-wrap font-serif text-base italic">
                  {logosResponse.replace(/\[RECOMMENDATION:.*?\]/g, '').trim()}
                </div>
              )}
              
              {!isAnalyzing && recommendedLogosJourney && (
                <div className="mt-6 pt-6 border-t border-primary/20 space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-700">
                  <div className="flex items-center gap-2 text-primary font-bold text-sm uppercase tracking-wider">
                    <Compass className="w-4 h-4" />
                    Jornada Sugerida: {recommendedLogosJourney.title}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {logosRecommendation?.reason || "Esta jornada foi selecionada especialmente para o seu momento atual."}
                  </p>
                  <Button 
                    className="w-full bg-primary hover:bg-primary/90 text-primary-foreground h-12 text-base font-semibold shadow-lg shadow-primary/20 group"
                    onClick={() => {
                      if (recommendedLogosStep) {
                        navigate(`/jornadas/${recommendedLogosJourney.id}/step?step=${recommendedLogosStep.id}`);
                      } else {
                        navigate(`/jornadas/${recommendedLogosJourney.id}/complete`);
                      }
                    }}
                  >
                    Continuar por aqui <ChevronRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                  </Button>

                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Quick Links */}
      <div className="grid grid-cols-2 gap-3 pt-4">
        <Button variant="outline" size="sm" onClick={() => navigate(AppRoute.DIAGNOSTICO)} className="text-xs h-9">
          Refazer Diagnóstico
        </Button>
        <Button variant="outline" size="sm" onClick={() => navigate(AppRoute.JORNADAS)} className="text-xs h-9">
          Ver Jornadas
        </Button>
      </div>
    </div>
  );
};

export default HojePage;