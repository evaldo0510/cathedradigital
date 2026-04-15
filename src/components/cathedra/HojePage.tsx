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
import { useSaintsToday, useOfficialSaint } from '@/hooks/useSaints';
import SacredImage from './SacredImage';
import AudioContentPlayer from './AudioContentPlayer';
import { toast } from 'sonner';
import SEOHead from '@/components/SEOHead';

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
  const [logosThemeContents, setLogosThemeContents] = useState<any[]>([]);
  const [logosThemeName, setLogosThemeName] = useState<string>('');

  const { data: officialSaint } = useOfficialSaint();
  const { data: allSaintsToday = [] } = useSaintsToday();

  const featuredSaint = useMemo(() => {
    // Priority: Official Saint from Edge Function if it has a name and isn't a fallback
    if (officialSaint && officialSaint.name !== "Santo do Dia" && officialSaint.name !== "Menu") {
      // Find matching local saint if possible to get more data
      const match = allSaintsToday.find((s: any) => 
        officialSaint.name.toLowerCase().includes(s.name.toLowerCase()) ||
        s.name.toLowerCase().includes(officialSaint.name.toLowerCase())
      );
      if (match) {
        return { 
          ...match, 
          ...officialSaint,
          // Prioritize local fullBio if official is missing or too short
          fullBio: (officialSaint.fullBio && officialSaint.fullBio.length > 50) ? 
                   officialSaint.fullBio : 
                   (match.fullBio || match.bio || officialSaint.description || officialSaint.fullBio)
        };
      }
      return { 
        id: 'official-today',
        name: officialSaint.name,
        title: 'Santo do Dia',
        bio: officialSaint.description,
        fullBio: officialSaint.fullBio || officialSaint.description,
        image: officialSaint.image,
        url: officialSaint.url,
        category: 'confessor' as const,
        works: (officialSaint.writings || []).map((w: string) => ({ title: w })),
        quotes: officialSaint.writings || [],
        feastDay: '',
        feastMonth: 0,
        feastDayNum: 0,
        born: '',
        died: '',
        patronOf: []
      };
    }

    if (allSaintsToday.length === 0) return null;
    if (allSaintsToday.length === 1) return allSaintsToday[0];
    
    // Priority based on active journey category
    if (activeJourney) {
      const categoryMap: Record<string, string[]> = {
        'fundamentos': ['apostle', 'martyr'],
        'formacao': ['doctor'],
        'mistico': ['mystic', 'virgin'],
        'rotina': ['confessor', 'founder']
      };
      
      const preferredCategories = categoryMap[activeJourney.category] || [];
      const match = allSaintsToday.find((s: any) => preferredCategories.includes(s.category));
      if (match) return match;
    }
    
    return allSaintsToday[0];
  }, [allSaintsToday, activeJourney, officialSaint]);

  const [logosSaint, setLogosSaint] = useState<any>(null);

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
    setLogosThemeContents([]);
    setLogosThemeName('');

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
          
          // Recommend a saint based on emotional state
          const mainState = recommendation.main_state;
          const virtueMap: Record<string, string[]> = {
            'ansiedade': ['Paz', 'Confiança', 'Paciência', 'Abandono a Deus'],
            'confusao': ['Sabedoria', 'Discernimento', 'Clareza', 'Busca pela Verdade'],
            'dor_emocional': ['Esperança', 'Consolação', 'Fortaleza', 'Cura'],
            'busca_espiritual': ['Contemplação', 'Mística', 'Oração', 'Silêncio']
          };
          const targetVirtues = virtueMap[mainState] || [];
          import('@/services/saintsService').then(m => {
            m.findSaintByVirtues(targetVirtues).then(s => {
              if (s) setLogosSaint(s);
            });
          });

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

          // Fetch theme contents based on main_state
          const stateToThemeSlugs: Record<string, string[]> = {
            'ansiedade': ['oracao', 'esperanca', 'fe'],
            'confusao': ['fe', 'sabedoria', 'humildade'],
            'dor_emocional': ['sofrimento', 'perdao', 'esperanca', 'amor'],
            'busca_espiritual': ['santidade', 'vocacao', 'fe', 'oracao'],
            'virtudes_e_missao': ['caridade', 'missao', 'humildade', 'santidade'],
          };
          const themeSlugs = stateToThemeSlugs[mainState] || ['fe', 'amor', 'oracao'];
          
          const { data: matchedThemes } = await supabase
            .from('themes')
            .select('id, name, slug')
            .in('slug', themeSlugs)
            .limit(3);

          if (matchedThemes && matchedThemes.length > 0) {
            setLogosThemeName(matchedThemes[0].name);
            const themeIds = matchedThemes.map(t => t.id);
            const { data: contents } = await supabase
              .from('theme_contents')
              .select('*')
              .in('theme_id', themeIds)
              .limit(6);
            if (contents) setLogosThemeContents(contents);
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
      // 1. Initial save is awaited to ensure it's in the DB
      await supabase.from('spiritual_journal').insert([{
        user_id: user.id,
        content: journalText.trim(),
        entry_date: new Date().toISOString().split('T')[0],
      }]);
      
      // 2. Give immediate feedback
      setJournalSaved(true);
      setTimeout(() => setJournalSaved(false), 3000);
      
      // 3. Analysis is non-blocking (doesn't hold up the "saved" UI state)
      analyzeReflection(journalText).catch(e => console.error('BG Analysis failed:', e));
      
    } catch (err) {
      console.error('Failed to save journal:', err);
      toast.error('Erro ao salvar diário');
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
    <div className="desktop-layout pt-6 md:pt-12">
      <SEOHead 
        title="Hoje - Sua Jornada Espiritual" 
        description="Acompanhe sua caminhada de fé diária com a liturgia, vida dos santos e direção espiritual personalizada."
        path="/hoje"
      />
      {/* ═══ MAIN COLUMN ═══ */}
      <div className="desktop-main space-y-12 max-w-2xl mx-auto lg:max-w-none lg:mx-0">
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

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
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

          <Button 
            size="lg" 
            variant="outline"
            className="h-16 px-12 rounded-full text-base font-bold uppercase tracking-widest border-2 hover:bg-secondary/50 transition-all"
            onClick={() => navigate(AppRoute.CERTAMEN)}
          >
            <Icons.Trophy className="w-5 h-5 mr-3" />
            Quiz da Fé
          </Button>
        </div>
      </motion.div>

      {/* Main Content Sections */}
      <div className="pt-8 space-y-10">
        
        {/* Santo do Dia - Highlight */}
        {featuredSaint && (
          <motion.section 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="space-y-4"
          >
            <div className="flex items-center gap-3">
              <div className="h-px w-6 bg-primary/30" />
              <h3 className="text-[11px] font-black uppercase tracking-[0.3em] text-primary flex items-center gap-2">
                <Icons.Saints className="w-3.5 h-3.5" />
                Santo do Dia
              </h3>
            </div>
            
            <div 
              onClick={() => navigate(`${AppRoute.SAINTS}?action=reflect`)}
              className="group cursor-pointer bg-card border border-border rounded-[2.5rem] overflow-hidden hover:border-primary/30 transition-all shadow-xl"
            >
              <div className="flex flex-col md:flex-row h-full">
                <div className="w-full md:w-1/3 h-64 md:h-auto relative">
                  <SacredImage 
                    src={featuredSaint.image} 
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" 
                    alt={featuredSaint.name} 
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                  <div className="absolute bottom-6 left-6 right-6 text-white">
                    <span className="text-[10px] font-black uppercase tracking-widest bg-primary px-2 py-1 rounded-md mb-2 inline-block">
                      Hoje
                    </span>
                    <h3 className="text-2xl font-serif font-bold leading-tight">{featuredSaint.name}</h3>
                  </div>
                </div>

                <div className="flex-1 p-8 space-y-6">
                  <div>
                    <p className="text-lg text-primary font-serif italic mb-4">"{featuredSaint.title}"</p>
                    <p className="text-muted-foreground leading-relaxed line-clamp-3 font-serif italic text-sm">
                      {featuredSaint.bio}
                    </p>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-border/50">
                    <div className="flex gap-1">
                      {featuredSaint.virtues?.slice(0, 2).map(v => (
                        <span key={v} className="px-2 py-1 bg-primary/10 text-primary text-[9px] font-black uppercase rounded-lg">{v}</span>
                      ))}
                    </div>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="text-primary hover:bg-primary/5 text-[10px] font-black uppercase tracking-widest gap-2"
                    >
                      Ver História <Icons.ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </motion.section>
        )}

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
                  <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary/20 transition-colors">
                    <Icons.Flame className="w-6 h-6" />
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

        {/* Santo do Dia - Enhanced for Journey */}
        {featuredSaint && (
          <section className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-250">
            <div className="flex items-center justify-between">
              <h2 className="text-[11px] font-black uppercase tracking-[0.3em] text-muted-foreground/60 flex items-center gap-3">
                <div className="h-px w-6 bg-muted-foreground/30" />
                Santo do Dia
              </h2>
              {activeJourney && (
                <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[9px] font-bold uppercase tracking-wider border border-primary/20">
                  <Icons.Star className="w-2.5 h-2.5 fill-primary" />
                  Especial para sua jornada
                </div>
              )}
            </div>
            
            <motion.div
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              onClick={() => navigate(`${AppRoute.SAINTS}/${featuredSaint.id}?action=reflect`)}
              className="group cursor-pointer p-0 rounded-3xl border border-border bg-card overflow-hidden shadow-sm hover:border-primary/30 transition-all flex flex-col sm:flex-row h-full"
            >
              <div className="w-full sm:w-1/3 h-40 sm:h-auto relative shrink-0 overflow-hidden">
                <SacredImage 
                  src={featuredSaint.image} 
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
                  alt={featuredSaint.name} 
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                <div className="absolute bottom-4 left-4 right-4">
                  <p className="text-[10px] font-black uppercase tracking-widest text-white/70 mb-1">{featuredSaint.feastDay}</p>
                  <h3 className="text-xl font-serif font-bold text-white leading-tight">{featuredSaint.name}</h3>
                </div>
              </div>
              <div className="flex-1 p-6 space-y-4 flex flex-col justify-center">
                <div className="space-y-2">
                  <p className="text-xs text-muted-foreground font-serif italic line-clamp-2 italic">
                    {featuredSaint.quotes?.[0] || featuredSaint.bio}
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

        {/* Recomendação de Santo Baseada no Momento Emocional */}
        {logosSaint && (
          <section className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <h2 className="text-[11px] font-black uppercase tracking-[0.3em] text-primary flex items-center gap-3">
              <div className="h-px w-6 bg-primary/30" />
              Sugerido para seu momento
            </h2>
            
            <motion.div
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              onClick={() => navigate(`${AppRoute.SAINTS}/${logosSaint.id}`)}
              className="group cursor-pointer p-6 rounded-3xl border border-primary/20 bg-primary/5 hover:border-primary/40 transition-all shadow-sm"
            >
              <div className="flex items-center gap-5">
                <div className="w-16 h-16 rounded-2xl overflow-hidden shrink-0 border border-primary/10">
                  <SacredImage src={logosSaint.image} className="w-full h-full object-cover" alt={logosSaint.name} />
                </div>
                <div className="flex-1">
                  <h3 className="text-base font-bold text-foreground">São {logosSaint.name}</h3>
                  <p className="text-xs text-muted-foreground mt-1 font-medium">
                    {logosSaint.patronOf?.[0] ? `Padroeiro(a) de ${logosSaint.patronOf[0]}` : logosSaint.title}
                  </p>
                </div>
                <div className="w-10 h-10 rounded-full bg-background border border-border flex items-center justify-center text-primary group-hover:border-primary/30 transition-all">
                  <Icons.ChevronRight className="w-5 h-5 group-hover:translate-x-0.5 transition-transform" />
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
              <CardHeader className="pb-2 flex flex-row items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2 text-primary font-serif italic">
                  <Icons.Sparkles className="w-5 h-5" />
                  Logos
                </CardTitle>
                {logosResponse && !isAnalyzing && (
                  <AudioContentPlayer 
                    text={logosResponse} 
                    title="Ouvir reflexão" 
                    showTitle={false}
                  />
                )}
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

        {/* Theme-Connected Content Recommendations */}
        {!isAnalyzing && logosThemeContents.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="space-y-4"
          >
            <div className="flex items-center gap-3">
              <div className="h-px w-6 bg-primary/30" />
              <h3 className="text-[11px] font-black uppercase tracking-[0.3em] text-primary flex items-center gap-2">
                <Icons.Tag className="w-3.5 h-3.5" />
                Conteúdos Conectados{logosThemeName ? ` — ${logosThemeName}` : ''}
              </h3>
            </div>
            
            <div className="grid grid-cols-1 gap-3">
              {logosThemeContents.map((item: any) => {
                const typeConfig: Record<string, { icon: React.ReactNode; label: string; color: string }> = {
                  bible: { icon: <Icons.BookOpen className="w-4 h-4" />, label: 'Bíblia', color: 'bg-blue-500/10 text-blue-600 dark:text-blue-400' },
                  catechism: { icon: <Icons.Bookmark className="w-4 h-4" />, label: 'Catecismo', color: 'bg-amber-500/10 text-amber-600 dark:text-amber-400' },
                  magisterium: { icon: <Icons.FileText className="w-4 h-4" />, label: 'Magistério', color: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' },
                };
                const config = typeConfig[item.content_type] || typeConfig.bible;
                
                return (
                  <motion.div
                    key={item.id}
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    onClick={() => navigate(AppRoute.TEMAS)}
                    className="group cursor-pointer p-5 rounded-2xl border border-border bg-card hover:border-primary/30 hover:bg-primary/5 transition-all shadow-sm"
                  >
                    <div className="flex items-start gap-4">
                      <div className={`p-2.5 rounded-xl ${config.color} shrink-0`}>
                        {config.icon}
                      </div>
                      <div className="flex-1 min-w-0 space-y-1.5">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{config.label}</span>
                          <span className="text-[10px] text-primary/70 font-semibold">{item.reference}</span>
                        </div>
                        <p className="text-sm font-semibold text-foreground leading-snug">{item.title || item.reference}</p>
                        {item.text_content && (
                          <p className="text-xs text-muted-foreground italic line-clamp-2 font-serif leading-relaxed">
                            "{item.text_content}"
                          </p>
                        )}
                      </div>
                      <Icons.ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors shrink-0 mt-1" />
                    </div>
                  </motion.div>
                );
              })}
            </div>

            <Button
              variant="outline"
              size="sm"
              className="w-full rounded-xl border-primary/20 text-primary hover:bg-primary/5 font-bold uppercase text-[10px] tracking-widest"
              onClick={() => navigate(AppRoute.TEMAS)}
            >
              Ver todos os temas conectados
            </Button>
          </motion.div>
        )}

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="relative space-y-4"
        >
          <div className="flex flex-wrap gap-2 mb-2">
            {[
              { label: 'Gratidão', icon: '🙏', text: 'Hoje sou grato por...' },
              { label: 'Pedido', icon: '🤲', text: 'Peço a Deus por...' },
              { label: 'Dúvida', icon: '🤔', text: 'Tenho uma dúvida sobre...' },
              { label: 'Reflexão', icon: '📖', text: 'Refletindo sobre a liturgia de hoje...' }
            ].map((prompt) => (
              <Button
                key={prompt.label}
                variant="outline"
                size="sm"
                className="rounded-full text-[10px] font-bold uppercase tracking-widest h-8 border-primary/20 hover:bg-primary/5 hover:border-primary/40 transition-all"
                onClick={() => setJournalText(prev => prev ? `${prev}\n\n${prompt.text}` : prompt.text)}
              >
                <span className="mr-1.5">{prompt.icon}</span> {prompt.label}
              </Button>
            ))}
          </div>

          <div className="relative">
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

      </div>{/* end desktop-main */}

      {/* ═══ DESKTOP RIGHT PANEL ═══ */}
      <aside className="desktop-aside">
        {/* Acesso Rápido - Sidebar version */}
        <div className="desktop-card space-y-4">
          <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-muted-foreground">Acesso Rápido</h3>
          <div className="space-y-2">
            {dailySections.map((section) => (
              <button
                key={section.title}
                onClick={() => navigate(section.route)}
                className="w-full flex items-center gap-3 p-3 rounded-xl border border-border hover:border-primary/30 hover:bg-primary/5 transition-all text-left group"
              >
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${section.color} group-hover:scale-110 transition-transform`}>
                  {section.icon}
                </div>
                <span className="text-sm font-semibold text-foreground">{section.title}</span>
                <Icons.ChevronRight className="w-4 h-4 text-muted-foreground ml-auto group-hover:translate-x-0.5 transition-transform" />
              </button>
            ))}
          </div>
        </div>

        {/* Streak & Stats Card */}
        <div className="desktop-card space-y-4">
          <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-muted-foreground">Sua Semana</h3>
          <div className="grid grid-cols-2 gap-3">
            <div className="text-center p-3 rounded-xl bg-primary/[0.04] border border-primary/10">
              <p className="text-2xl font-bold text-foreground">{profile?.streak || 0}</p>
              <p className="text-[9px] text-muted-foreground font-medium mt-1">
                <Icons.Flame className="w-3 h-3 inline mr-1" />{t('streak')}
              </p>
            </div>
            <div className="text-center p-3 rounded-xl bg-primary/[0.04] border border-primary/10">
              <p className="text-2xl font-bold text-foreground">{profile?.xp || 0}</p>
              <p className="text-[9px] text-muted-foreground font-medium mt-1">
                <Icons.Star className="w-3 h-3 inline mr-1" />XP
              </p>
            </div>
          </div>
        </div>

        {/* Daily Quote */}
        <div className="desktop-card space-y-3">
          <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-muted-foreground">Palavra do Dia</h3>
          <p className="text-sm font-serif italic text-foreground leading-relaxed">
            "{todayQuote}"
          </p>
        </div>

        {/* Quick Navigation */}
        <div className="desktop-card space-y-3">
          <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-muted-foreground">Explorar</h3>
          <div className="space-y-1.5">
            {[
              { label: 'A-Z da Fé', route: AppRoute.AZ_FAITH, icon: <Icons.AZ className="w-4 h-4" /> },
              { label: 'Jornadas', route: AppRoute.JORNADAS, icon: <Icons.Route className="w-4 h-4" /> },
              { label: 'Comunidade', route: AppRoute.COMMUNITY, icon: <Icons.Users className="w-4 h-4" /> },
            ].map((item) => (
              <button
                key={item.label}
                onClick={() => navigate(item.route)}
                className="w-full flex items-center gap-3 p-2.5 rounded-xl hover:bg-muted/50 transition-all text-left group"
              >
                <span className="text-muted-foreground group-hover:text-primary transition-colors">{item.icon}</span>
                <span className="text-sm font-medium text-foreground">{item.label}</span>
              </button>
            ))}
          </div>
        </div>
      </aside>
    </div>
  );
};

export default HojePage;
