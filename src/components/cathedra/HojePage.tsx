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

const HojePage: React.FC = () => {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const { t } = useContext(LangContext);
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
        // No progress yet — load recommended journey from diagnosis
        loadRecommendedJourney();
      }
    } catch (err) {
      console.error('Failed to load active journey:', err);
    }
  };

  const loadRecommendedJourney = async () => {
    if (!user || !profile?._sensitive?.diagnosis_result) return;
    try {
      const result = profile._sensitive.diagnosis_result as Record<string, string>;
      const { moment, prayer, knowledge, goal } = result;
      let category = 'fundamentos';
      if (moment === 'beginning' || knowledge === 'basic') category = 'fundamentos';
      else if (moment === 'struggling' || goal === 'peace') category = 'mistico';
      else if (prayer === 'contemplative' || goal === 'transformation') category = 'mistico';
      else if (goal === 'routine' || prayer === 'rarely' || prayer === 'sometimes') category = 'rotina';

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
          // Standard SSE parsing if the function returns it, or just plain text if it's simplified.
          // Our function uses streaming completions.
          const lines = chunk.split('\n');
          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const data = JSON.parse(line.slice(6));
                const content = data.choices?.[0]?.delta?.content || '';
                fullText += content;
                setLogosResponse(fullText);
              } catch (e) { /* skip partial JSON */ }
            }
          }
        }
      }

      // Extract recommendation metadata
      const match = fullText.match(/\[RECOMMENDATION:(.*?)\]/);
      if (match) {
        try {
          const recommendation = JSON.parse(match[1]);
          setLogosRecommendation(recommendation);
          
          // Fetch the journey by category
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

      {/* Recommended Journey (no progress yet) */}
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
              <Button size="sm" onClick={saveJournal} disabled={!journalText.trim()}>
                Salvar
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Quick Links */}
      <div className="grid grid-cols-2 gap-3">
        <Button variant="outline" size="sm" onClick={() => navigate(AppRoute.DIAGNOSTICO)} className="text-xs">
          Refazer Diagnóstico
        </Button>
        <Button variant="outline" size="sm" onClick={() => navigate(AppRoute.JORNADAS)} className="text-xs">
          Ver Jornadas
        </Button>
      </div>
    </div>
  );
};

export default HojePage;
