import React, { useState, useEffect, useContext, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Icons } from '@/constants';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { AppRoute } from '@/types';
import { LangContext } from '@/contexts/LangContext';
import ProConversionBanner from './ProConversionBanner';
import { SAINTS_DATA } from '@/data/saints';
import SacredImage from './SacredImage';

const LITURGICAL_QUOTES = [
  '"Sede misericordiosos como vosso Pai é misericordioso." — Lc 6,36',
  '"Eu sou o caminho, a verdade e a vida." — Jo 14,6',
  '"Vinde a mim todos vós que estais cansados." — Mt 11,28',
  '"Não tenhais medo, eu venci o mundo." — Jo 16,33',
  '"Amai-vos uns aos outros como eu vos amei." — Jo 15,12',
];

const HojePage: React.FC = () => {
  const navigate = useNavigate();
  const { user, profile, userLevel } = useAuth();
  const { t } = useContext(LangContext);
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
  const saintsToday = useMemo(() => {
    const day = new Date().getDate();
    const month = new Date().getMonth() + 1;
    return SAINTS_DATA.filter(s => s.feastMonth === month && s.feastDayNum === day);
  }, []);

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

  const dailySections = [
    {
      title: 'Liturgia',
      icon: <Icons.Calendar className="w-5 h-5" />,
      route: `${AppRoute.LITURGIA}?tab=liturgia`,
      color: 'bg-primary/10 text-primary',
    },
    {
      title: 'Oração',
      icon: <Icons.Hand className="w-5 h-5" />,
      route: AppRoute.ORACAO,
      color: 'bg-accent/10 text-accent',
    },
    {
      title: 'Escritura',
      icon: <Icons.BookOpen className="w-5 h-5" />,
      route: AppRoute.BIBLE,
      color: 'bg-primary/10 text-primary',
    },
  ];

  return (
    <div className="space-y-12 max-w-2xl mx-auto pt-6 md:pt-12">
      {/* Logos IA Highlight - Centralized */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center space-y-8"
      >
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-[10px] font-black uppercase tracking-[0.2em] border border-primary/20">
          <Icons.Sparkles className="w-3 h-3" />
          Logos Inteligência Artificial
        </div>
        
        <div className="space-y-4">
          <h1 className="text-4xl md:text-5xl font-serif text-foreground leading-tight">
            Sua jornada espiritual <br />
            <span className="text-primary italic">guiada pela Sabedoria.</span>
          </h1>
          
          <p className="text-sm md:text-base text-muted-foreground leading-relaxed max-w-lg mx-auto italic font-serif">
            "O que Deus colocou no seu coração hoje? Compartilhe suas dúvidas ou orações e receba uma direção espiritual personalizada."
          </p>
        </div>

        <Button 
          size="lg" 
          className="h-16 px-12 bg-primary hover:bg-primary/90 text-primary-foreground font-bold uppercase tracking-widest shadow-2xl shadow-primary/20 group rounded-full text-base transition-all hover:scale-105 active:scale-95 border-b-4 border-primary-foreground/20"
          onClick={() => {
            const journalElement = document.getElementById('spiritual-journal');
            journalElement?.scrollIntoView({ behavior: 'smooth' });
            const textarea = document.querySelector('textarea');
            textarea?.focus();
          }}
        >
          <Icons.PenLine className="w-5 h-5 mr-3 group-hover:rotate-12 transition-transform" />
          Escreva sua reflexão
        </Button>
      </motion.div>

      {/* Main Content Sections */}
      <div className="pt-8 space-y-10">
        {/* Continuar Jornada */}
        {(activeJourney || recommendedJourney) && (
          <section className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-200">
            <h2 className="text-[11px] font-black uppercase tracking-[0.3em] text-muted-foreground/60 flex items-center gap-3">
              <div className="h-px w-6 bg-muted-foreground/30" />
              Continuar Jornada
            </h2>
            
            {activeJourney ? (
              <motion.div
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                onClick={() => {
                  if (journeyStep) {
                    navigate(`/jornadas/${activeJourney.id}/step?step=${journeyStep.id}`);
                  } else {
                    navigate(`/jornadas/${activeJourney.id}/complete`);
                  }
                }}
                className="group cursor-pointer p-6 rounded-3xl border border-primary/20 bg-gradient-to-br from-primary/5 via-transparent to-transparent hover:border-primary/40 transition-all shadow-sm hover:shadow-md"
              >
                <div className="flex items-center gap-5">
                  <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary/20 transition-colors">
                    <Icons.Flame className="w-7 h-7" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-base font-bold text-foreground">{activeJourney.title}</h3>
                    <div className="mt-3 flex items-center gap-4">
                      <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-primary transition-all duration-1000 ease-out" 
                          style={{ width: `${journeyProgress.total > 0 ? (journeyProgress.completed / journeyProgress.total) * 100 : 0}%` }} 
                        />
                      </div>
                      <span className="text-[11px] font-black text-primary uppercase tabular-nums">
                        {journeyProgress.completed}/{journeyProgress.total}
                      </span>
                    </div>
                  </div>
                  <Icons.ChevronRight className="w-6 h-6 text-muted-foreground group-hover:translate-x-1 transition-transform" />
                </div>
              </motion.div>
            ) : (
              <motion.div
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                onClick={() => navigate(`/jornadas/${recommendedJourney.id}`)}
                className="group cursor-pointer p-6 rounded-3xl border border-border bg-muted/20 hover:border-primary/20 transition-all shadow-sm"
              >
                <div className="flex items-center gap-5">
                  <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center text-muted-foreground group-hover:text-primary transition-colors">
                    <Icons.Compass className="w-7 h-7" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-base font-bold text-foreground">{recommendedJourney.title}</h3>
                    <p className="text-xs text-muted-foreground mt-1 font-medium">Sugerido especialmente para seu perfil</p>
                  </div>
                  <Icons.ChevronRight className="w-6 h-6 text-muted-foreground group-hover:translate-x-1 transition-transform" />
                </div>
              </motion.div>
            )}
          </section>
        )}

        {/* Santo do Dia - Logos Reflection Suggestion */}
        {saintsToday.length > 0 && (
          <section className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-250">
            <h2 className="text-[11px] font-black uppercase tracking-[0.3em] text-muted-foreground/60 flex items-center gap-3">
              <div className="h-px w-6 bg-muted-foreground/30" />
              Santo do Dia
            </h2>
            
            <motion.div
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              onClick={() => navigate(`${AppRoute.SAINTS}?action=reflect`)}
              className="group cursor-pointer p-0 rounded-3xl border border-border bg-card overflow-hidden shadow-sm hover:border-primary/30 transition-all flex flex-col sm:flex-row h-full"
            >
              <div className="w-full sm:w-1/3 h-40 sm:h-auto relative shrink-0 overflow-hidden">
                <SacredImage 
                  src={saintsToday[0].image} 
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
                  alt={saintsToday[0].name} 
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                <div className="absolute bottom-4 left-4 right-4">
                  <p className="text-[10px] font-black uppercase tracking-widest text-white/70 mb-1">{saintsToday[0].feastDay}</p>
                  <h3 className="text-xl font-serif font-bold text-white leading-tight">{saintsToday[0].name}</h3>
                </div>
              </div>
              <div className="flex-1 p-6 space-y-4 flex flex-col justify-center">
                <div className="space-y-2">
                  <p className="text-xs text-muted-foreground font-serif italic line-clamp-2 italic">
                    {saintsToday[0].quotes?.[0] || saintsToday[0].bio}
                  </p>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                      <Icons.Sparkles className="w-4 h-4" />
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-primary">Refletir com Logos</span>
                  </div>
                  <Icons.ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-all group-hover:translate-x-1" />
                </div>
              </div>
            </motion.div>
          </section>
        )}

        {/* Acesso Rápido */}
        <section className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-300">
          <h2 className="text-[11px] font-black uppercase tracking-[0.3em] text-muted-foreground/60 flex items-center gap-3">
            <div className="h-px w-6 bg-muted-foreground/30" />
            Acesso Rápido
          </h2>
          
          <div className="grid grid-cols-3 gap-4">
            {dailySections.map((section, i) => (
              <motion.div
                key={section.title}
                whileHover={{ y: -4 }}
                whileTap={{ scale: 0.96 }}
                onClick={() => navigate(section.route)}
                className="group cursor-pointer p-4 rounded-2xl border border-border bg-background hover:border-primary/30 hover:bg-primary/5 transition-all text-center space-y-3"
              >
                <div className={`mx-auto w-12 h-12 rounded-xl flex items-center justify-center ${section.color} group-hover:scale-110 transition-transform`}>
                  {section.icon}
                </div>
                <h3 className="font-bold text-[11px] text-foreground leading-tight uppercase tracking-wider">{section.title}</h3>
              </motion.div>
            ))}
          </div>
        </section>
      </div>

      {/* Spiritual Journal Area */}
      <div id="spiritual-journal" className="pt-12 scroll-mt-24 space-y-6">
        {(isAnalyzing || logosResponse) && (
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="space-y-6"
          >
            <Card className="border-primary/30 bg-gradient-to-br from-primary/10 via-background to-background relative overflow-hidden shadow-2xl rounded-3xl">
              <div className="absolute top-0 right-0 p-6 opacity-10">
                <Icons.Sparkles className="w-16 h-16 text-primary" />
              </div>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2 text-primary font-serif italic">
                  <Icons.Sparkles className="w-5 h-5" />
                  Logos
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {isAnalyzing && !logosResponse ? (
                  <div className="flex flex-col items-center gap-4 py-12 text-center">
                    <Icons.Loader className="w-8 h-8 text-primary animate-spin" />
                    <p className="text-sm text-muted-foreground animate-pulse font-serif italic">Logos está refletindo sobre sua partilha...</p>
                  </div>
                ) : (
                  <div className="prose prose-sm dark:prose-invert max-w-none text-foreground leading-relaxed whitespace-pre-wrap font-serif text-lg italic border-l-2 border-primary/20 pl-6 py-2">
                    {logosResponse.replace(/\[RECOMMENDATION:.*?\]/g, '').trim()}
                  </div>
                )}
                
                {!isAnalyzing && recommendedLogosJourney && (
                  <div className="pt-6 border-t border-primary/10 space-y-4">
                    <p className="text-xs text-muted-foreground font-serif italic">
                      "{logosRecommendation?.reason || "Esta jornada foi selecionada especialmente para o seu momento atual."}"
                    </p>
                    <Button 
                      className="w-full bg-primary hover:bg-primary/90 text-primary-foreground h-12 text-sm font-bold uppercase tracking-widest shadow-lg shadow-primary/20 group rounded-xl"
                      onClick={() => {
                        if (recommendedLogosStep) {
                          navigate(`/jornadas/${recommendedLogosJourney.id}/step?step=${recommendedLogosStep.id}`);
                        } else {
                          navigate(`/jornadas/${recommendedLogosJourney.id}/complete`);
                        }
                      }}
                    >
                      Seguir para esta Jornada <Icons.ChevronRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        )}

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="relative"
        >
          <Textarea
            placeholder="O que Deus colocou no seu coração hoje?"
            value={journalText}
            onChange={(e) => setJournalText(e.target.value)}
            className="min-h-[160px] md:min-h-[200px] p-6 rounded-3xl border-border bg-muted/20 focus:bg-background transition-all text-base font-serif italic resize-none shadow-inner"
          />
          <div className="absolute bottom-4 right-4 flex items-center gap-4">
            {journalSaved && (
              <span className="text-[10px] font-black uppercase text-green-600 animate-in fade-in zoom-in">✓ Salvo</span>
            )}
            <Button 
              size="sm" 
              onClick={saveJournal} 
              disabled={!journalText.trim() || isAnalyzing}
              className="rounded-full px-6 font-black uppercase text-[10px] tracking-widest h-9"
            >
              {isAnalyzing ? <Icons.Loader className="w-4 h-4 animate-spin" /> : 'Refletir com Logos'}
            </Button>
          </div>
        </motion.div>
      </div>

      {/* Simplified Footer Info */}
      <div className="pt-12 border-t border-border/50 text-center pb-24 space-y-6">
        <p className="text-[11px] text-muted-foreground font-serif italic leading-relaxed px-12 max-w-md mx-auto">
          "{todayQuote}"
        </p>
        <div className="flex justify-center gap-6">
          <button onClick={() => navigate(AppRoute.DIAGNOSTICO)} className="text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:text-primary transition-colors">
            Diagnóstico
          </button>
          <button onClick={() => navigate(AppRoute.JORNADAS)} className="text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:text-primary transition-colors">
            Ver Tudo
          </button>
        </div>
      </div>
    </div>
  );
};

export default HojePage;
