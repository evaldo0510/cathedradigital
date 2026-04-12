import React, { useState, useMemo, useCallback, useEffect, lazy, Suspense } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';

import { Icons } from '@/constants';
import { Button } from '@/components/ui/button';
import SEOHead from '@/components/SEOHead';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { AppRoute } from '@/types';
import { routeUser, type RouteRecommendation } from '@/lib/smartRouter';
import { saveUserPsychology } from '@/lib/psychologicalProfile';
import { SAINTS_DATA } from '@/data/saints';
import ReactMarkdown from 'react-markdown';
import { toast } from 'sonner';
import { getCachedLiturgy, cacheLiturgy } from '@/lib/offlineCache';

const MissalPage = lazy(() => import('./MissalPage'));
const LiturgicalCalendarPage = lazy(() => import('./LiturgicalCalendarPage'));

function usePrefetchLiturgyCache() {
  useEffect(() => {
    const prefetch = async () => {
      const now = new Date();
      for (let i = 1; i <= 6; i++) {
        const d = new Date(now);
        d.setDate(d.getDate() - i);
        const key = d.toDateString();
        const cached = await getCachedLiturgy(key);
        if (cached) continue;
        try {
          const { data } = await supabase.functions.invoke('liturgical-calendar', {
            body: { action: 'readings', day: d.getDate(), month: d.getMonth() + 1 }
          });
          if (data) await cacheLiturgy(key, data as LiturgyReadings);
        } catch { /* silent */ }
      }
    };
    prefetch();
  }, []);
}

interface Reading {
  referencia: string;
  titulo: string;
  texto: string;
}

interface LiturgyReadings {
  data: string;
  liturgia: string;
  cor: string;
  dia: string;
  primeiraLeitura: Reading;
  salmo: { referencia: string; refrao: string; texto: string };
  segundaLeitura?: Reading | string;
  evangelho: Reading;
}

const PCH_REFLECTIONS = [
  "A pressa revela onde a confiança ainda não chegou.",
  "Toda oração é um ato de coragem: você está admitindo que não está no controle.",
  "Deus não fala alto — Ele fala fundo.",
  "O silêncio não é vazio… é onde Deus começa a frase.",
  "A fé não elimina a dúvida — ela caminha ao lado dela.",
  "Você não precisa entender tudo. Precisa confiar em Quem entende.",
  "A verdadeira força não é resistir sozinho — é aceitar ser carregado.",
  "Nem toda escuta é ouvir… às vezes Deus fala no silêncio entre as palavras.",
];

function parseRefToRoute(ref: string): string {
  const match = ref.match(/^(\d?\s?[A-Za-zÀ-ú]+)\s+(\d+)/);
  if (!match) return AppRoute.BIBLE;
  const book = match[1].trim();
  const chapter = match[2];
  return `${AppRoute.BIBLE}?book=${encodeURIComponent(book)}&chapter=${chapter}`;
}

const ReadingCard: React.FC<{
  label: string;
  icon: React.ReactNode;
  reference: string;
  text: string;
  refrain?: string;
  onContext: () => void;
  onReflect: () => void;
  delay: number;
}> = ({ label, icon, reference, text, refrain, onContext, onReflect, delay }) => (
  <motion.div
    initial={{ opacity: 0, y: 24 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5, delay }}
    className="space-y-6 bg-card border border-border rounded-3xl p-8 shadow-sm hover:shadow-md transition-all group"
  >
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-xl bg-primary/5 text-primary group-hover:bg-primary group-hover:text-white transition-all">
          {icon}
        </div>
        <h2 className="text-[10px] font-black uppercase tracking-[0.25em] text-primary">{label}</h2>
      </div>
      <p className="text-[9px] font-bold text-secondary uppercase tracking-[0.2em]">{reference}</p>
    </div>

    {refrain && (
      <div className="bg-secondary/5 rounded-2xl p-5 border border-secondary/20 border-l-4">
        <p className="text-base font-serif italic text-primary leading-relaxed">℟ {refrain}</p>
      </div>
    )}

    <p className="text-lg md:text-xl leading-[2] text-primary font-serif whitespace-pre-line selection:bg-secondary/30">
      {text}
    </p>

    <div className="flex flex-col sm:flex-row gap-3 pt-4">
      <Button
        variant="outline"
        size="sm"
        className="rounded-xl text-[10px] font-black uppercase tracking-widest flex-1 h-12"
        onClick={onContext}
      >
        <Icons.Bible className="w-4 h-4 mr-2" />
        Contexto Bíblico
      </Button>
      <Button
        variant="secondary"
        size="sm"
        className="rounded-xl text-[10px] font-black uppercase tracking-widest flex-1 h-12 bg-secondary/10 border-none hover:bg-secondary/20 text-primary"
        onClick={onReflect}
      >
        <Icons.Lectio className="w-4 h-4 mr-2 text-secondary" />
        Lectio Divina
      </Button>
    </div>
  </motion.div>
);

const LiturgiaPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'liturgia';

  const { user, profile } = useAuth();
  const [selectedDate, setSelectedDate] = useState(() => new Date());
  const today = selectedDate;
  const [meditation, setMeditation] = useState<string | null>(null);
  const [isMeditationLoading, setIsMeditationLoading] = useState(false);

  const [copiedMeditation, setCopiedMeditation] = useState(false);
  const [isOfflineData, setIsOfflineData] = useState(false);
  const [emotionalRoutes, setEmotionalRoutes] = useState<RouteRecommendation[]>([]);

  usePrefetchLiturgyCache();

  const dateKey = today.toDateString();

  const goToPrevDay = () => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() - 1);
    setSelectedDate(d);
    setMeditation(null);
    setIsOfflineData(false);
    setEmotionalRoutes([]);
  };

  const goToNextDay = () => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + 1);
    if (d <= new Date()) {
      setSelectedDate(d);
      setMeditation(null);
      setIsOfflineData(false);
      setEmotionalRoutes([]);
    }
  };

  const isToday = selectedDate.toDateString() === new Date().toDateString();

  const { data: readings, isLoading } = useQuery({
    queryKey: ['liturgy-readings', dateKey],
    queryFn: async () => {
      const cached = await getCachedLiturgy(dateKey);
      try {
        const { data, error } = await supabase.functions.invoke('liturgical-calendar', {
          body: { action: 'readings', day: today.getDate(), month: today.getMonth() + 1 }
        });
        if (error) throw error;
        const result = data as LiturgyReadings;
        await cacheLiturgy(dateKey, result);
        setIsOfflineData(false);
        return result;
      } catch (e) {
        if (cached) {
          setIsOfflineData(true);
          return cached as LiturgyReadings;
        }
        throw e;
      }
    },
    staleTime: 1000 * 60 * 60,
  });

  const pchReflection = useMemo(
    () => PCH_REFLECTIONS[today.getDate() % PCH_REFLECTIONS.length],
    [today]
  );

  const saintsToday = useMemo(() => {
    const m = today.getMonth() + 1;
    const d = today.getDate();
    const matched = SAINTS_DATA.filter(s => s.feastMonth === m && s.feastDayNum === d);
    return matched.length > 0 ? matched : [SAINTS_DATA[0]];
  }, [today]);

  const navigateToLectio = (ref?: string) => {
    const q = ref ? `?ref=${encodeURIComponent(ref)}` : '';
    navigate(`${AppRoute.LECTIO_DIVINA}${q}`);
  };

  const fetchMeditation = useCallback(async () => {
    if (!readings?.evangelho?.texto || isMeditationLoading) return;
    setIsMeditationLoading(true);
    setMeditation(null);
    try {
      const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
      const anonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
      const url = `https://${projectId}.supabase.co/functions/v1/colloquium`;

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': anonKey,
        },
        body: JSON.stringify({
          messages: [{
            role: 'user',
            content: `Gere uma Meditação Diária Espiritual baseada no Evangelho do dia: ${readings.evangelho.referencia} - ${readings.evangelho.texto.substring(0, 800)}.`
          }]
        })
      });

      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const reader = response.body?.getReader();
      if (!reader) throw new Error('No reader');
      const decoder = new TextDecoder();
      let fullText = '';
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value);
        for (const line of chunk.split('\n')) {
          if (line.startsWith('data: ')) {
            const d = line.substring(6).trim();
            if (d === '[DONE]') continue;
            try {
              const json = JSON.parse(d);
              fullText += json.choices?.[0]?.delta?.content || '';
              setMeditation(fullText);
            } catch { /* partial */ }
          }
        }
      }
    } catch (e) {
      console.error(e);
      setMeditation('Erro ao gerar meditação.');
    } finally {
      setIsMeditationLoading(false);
    }
  }, [readings, isMeditationLoading]);

  useEffect(() => {
    if (meditation && !isMeditationLoading && meditation.length > 50) {
      const combinedText = `${readings?.evangelho?.texto || ''} ${meditation}`;
      setEmotionalRoutes(routeUser(combinedText));
      if (user?.id) saveUserPsychology(user.id, combinedText, 'liturgia');
    }
  }, [meditation, isMeditationLoading, readings, user?.id]);

  const shareMeditation = useCallback(async (method: 'whatsapp' | 'copy') => {
    if (!meditation) return;
    const text = `✨ Meditação do Dia — ${readings?.evangelho?.referencia || ''}\n\n${meditation}\n\n— Cathedra Digital`;
    if (method === 'whatsapp') window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
    else {
      await navigator.clipboard.writeText(text);
      setCopiedMeditation(true);
      toast.success('Copiado!');
      setTimeout(() => setCopiedMeditation(false), 2000);
    }
  }, [meditation, readings]);

  const formatDate = () => today.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <>
      <SEOHead title="Liturgia do Dia" description="Leituras do dia." path="/liturgia" keywords="liturgia" />

      <div className="max-w-4xl mx-auto px-4 py-6 space-y-10">
        {/* Navigation Tabs */}
        <div className="flex justify-center mb-8">
          <div className="bg-muted/40 p-1.5 rounded-[2rem] border border-border/40 flex gap-1 overflow-x-auto max-w-full">
            {[
              { id: 'liturgia', label: 'Liturgia', icon: <Icons.Liturgy className="w-4 h-4" /> },
              { id: 'missal', label: 'Missal', icon: <Icons.Cross className="w-4 h-4" /> },
              { id: 'calendario', label: 'Calendário', icon: <Icons.Calendar className="w-4 h-4" /> }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setSearchParams({ tab: tab.id })}
                className={`flex items-center gap-2 px-8 py-2.5 rounded-full text-sm font-semibold transition-all ${
                  activeTab === tab.id 
                    ? 'bg-background shadow-lg text-primary' 
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/60'
                }`}
              >
                {tab.icon} {tab.label}
              </button>
            ))}
          </div>
        </div>

        <Suspense fallback={<div className="flex justify-center py-20"><Icons.Loader2 className="w-10 h-10 text-secondary animate-spin" /></div>}>
          {activeTab === 'liturgia' && (
            <div className="max-w-2xl mx-auto space-y-10 animate-in fade-in duration-500">
              <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} className="space-y-4 text-center">
                <button onClick={() => navigate(-1)} className="flex items-center gap-1.5 text-muted-foreground hover:text-primary transition-colors text-sm mx-auto sm:mx-0">
                  <Icons.ChevronLeft className="w-4 h-4" />
                  <span className="text-xs font-black uppercase tracking-widest">Voltar</span>
                </button>
                <h1 className="text-3xl md:text-5xl font-display font-black text-primary tracking-tight">Liturgia do Dia</h1>
                <div className="flex items-center justify-center gap-4">
                  <button onClick={goToPrevDay} className="p-3 rounded-2xl bg-muted hover:bg-primary hover:text-white transition-all text-primary">
                    <Icons.ChevronLeft className="w-5 h-5" />
                  </button>
                  <p className="text-sm font-bold text-primary capitalize min-w-[200px]">
                    {formatDate()}
                    {isToday && <span className="ml-2 text-secondary">(Hoje)</span>}
                  </p>
                  <button onClick={goToNextDay} disabled={isToday} className="p-3 rounded-2xl bg-muted hover:bg-primary hover:text-white transition-all text-primary disabled:opacity-20">
                    <Icons.ChevronRight className="w-5 h-5" />
                  </button>
                </div>
                {isOfflineData && (
                  <div className="flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest text-muted-foreground bg-muted/50 rounded-full px-4 py-2 mt-4 mx-auto w-fit">
                    <Icons.WifiOff className="w-3.5 h-3.5" /> <span>Modo Offline</span>
                  </div>
                )}
              </motion.div>

              {profile?.diocese && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-secondary/5 border border-secondary/20 rounded-2xl p-4 flex items-center justify-between group"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-secondary/10 text-secondary">
                      <Icons.Church className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-secondary/60">Sua Diocese</p>
                      <h3 className="text-sm font-bold text-primary">{profile.diocese}</h3>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-[9px] font-medium text-muted-foreground uppercase tracking-widest">Estado</p>
                    <p className="text-xs font-bold text-primary">{profile.estado}</p>
                  </div>
                </motion.div>
              )}

              {isLoading && <div className="flex justify-center py-20"><Icons.Loader2 className="w-10 h-10 text-secondary animate-spin" /></div>}

              {readings && (
                <div className="space-y-8">
                  {readings.primeiraLeitura && (
                    <ReadingCard label="Primeira Leitura" icon={<Icons.Bible className="w-5 h-5" />} reference={readings.primeiraLeitura.referencia} text={readings.primeiraLeitura.texto} onContext={() => navigate(parseRefToRoute(readings.primeiraLeitura.referencia))} onReflect={() => navigateToLectio(readings.primeiraLeitura.referencia)} delay={0.1} />
                  )}
                  {readings.salmo && (
                    <ReadingCard label="Salmo Responsorial" icon={<Icons.Music className="w-5 h-5" />} reference={readings.salmo.referencia} text={readings.salmo.texto} refrain={readings.salmo.refrao} onContext={() => navigate(parseRefToRoute(readings.salmo.referencia))} onReflect={() => navigateToLectio(readings.salmo.referencia)} delay={0.2} />
                  )}
                  {readings.segundaLeitura && typeof readings.segundaLeitura === 'object' && (
                    <ReadingCard label="Segunda Leitura" icon={<Icons.BookOpen className="w-5 h-5" />} reference={(readings.segundaLeitura as Reading).referencia} text={(readings.segundaLeitura as Reading).texto} onContext={() => navigate(parseRefToRoute((readings.segundaLeitura as Reading).referencia))} onReflect={() => navigateToLectio((readings.segundaLeitura as Reading).referencia)} delay={0.25} />
                  )}
                  {readings.evangelho && (
                    <ReadingCard label="Evangelho" icon={<Icons.Lectio className="w-5 h-5" />} reference={readings.evangelho.referencia} text={readings.evangelho.texto} onContext={() => navigate(parseRefToRoute(readings.evangelho.referencia))} onReflect={() => navigateToLectio(readings.evangelho.referencia)} delay={0.3} />
                  )}
                </div>
              )}

              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="bg-primary text-white rounded-[2rem] p-10 text-center space-y-6 shadow-2xl">
                <Icons.Brain className="w-8 h-8 text-secondary mx-auto" />
                <p className="text-[10px] font-black uppercase tracking-[0.4em] opacity-60">Reflexão do Dia</p>
                <p className="text-xl md:text-2xl font-serif italic leading-relaxed">"{pchReflection}"</p>
              </motion.div>

              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.55 }} className="bg-card border border-border rounded-[2rem] p-8 space-y-6 shadow-sm">
                <div className="text-center space-y-2">
                  <Icons.Sparkles className="w-6 h-6 text-secondary mx-auto" />
                  <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground">Meditação com IARA</p>
                </div>
                {!meditation && !isMeditationLoading && (
                  <Button onClick={fetchMeditation} className="w-full h-14 rounded-2xl bg-primary text-white font-black uppercase tracking-widest hover:scale-[1.02] transition-transform">Gerar Meditação Personalizada</Button>
                )}
                {isMeditationLoading && <div className="flex flex-col items-center gap-3 py-6"><Icons.Loader2 className="w-8 h-8 text-secondary animate-spin" /><p className="text-xs font-bold text-muted-foreground animate-pulse">Sintonizando frequências espirituais...</p></div>}
                {meditation && (
                  <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-1000">
                    <div className="prose prose-sm dark:prose-invert font-serif leading-relaxed text-primary max-w-none"><ReactMarkdown>{meditation}</ReactMarkdown></div>
                    <div className="flex gap-2"><Button variant="outline" className="flex-1 h-12 rounded-xl text-[10px] font-black uppercase tracking-widest border-secondary/20" onClick={() => shareMeditation('whatsapp')}>WhatsApp</Button><Button variant="outline" className="flex-1 h-12 rounded-xl text-[10px] font-black uppercase tracking-widest" onClick={() => shareMeditation('copy')}>{copiedMeditation ? 'Copiado!' : 'Copiar'}</Button></div>
                  </div>
                )}
              </motion.div>

              {saintsToday.length > 0 && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }} className="bg-muted/30 border border-border rounded-[2rem] p-8 flex flex-col items-center text-center space-y-4">
                  <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-secondary p-1 shadow-lg shadow-secondary/10">
                    <img src={saintsToday[0].image} alt={saintsToday[0].name} className="w-full h-full object-cover rounded-full" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-[9px] font-black uppercase tracking-[0.3em] text-secondary">
                      {saintsToday.length > 1 ? 'Santos do Dia' : 'Santo do Dia'}
                    </p>
                    <h3 className="text-xl font-display font-black text-primary">
                      {saintsToday.map(s => s.name).join(' e ')}
                    </h3>
                  </div>
                  <div className="flex flex-col gap-2 w-full">
                    <Button 
                      variant="ghost" 
                      className="text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:bg-primary/5 h-10" 
                      onClick={() => navigate(AppRoute.SAINTS)}
                    >
                      Conhecer História <Icons.ChevronRight className="w-4 h-4 ml-2" />
                    </Button>
                    <Button 
                      className="text-[10px] font-black uppercase tracking-widest bg-primary text-primary-foreground hover:bg-primary/90 h-11 rounded-xl shadow-lg shadow-primary/10" 
                      onClick={() => navigate(`${AppRoute.SAINTS}?action=reflect`)}
                    >
                      Refletir com Logos <Icons.Sparkles className="w-3.5 h-3.5 ml-2" />
                    </Button>
                  </div>
                </motion.div>
              )}
            </div>
          )}
          {activeTab === 'missal' && <div className="animate-in fade-in slide-in-from-bottom-4 duration-500"><MissalPage /></div>}
          {activeTab === 'calendario' && <div className="animate-in fade-in slide-in-from-bottom-4 duration-500"><LiturgicalCalendarPage /></div>}
        </Suspense>
      </div>
    </>
  );
};

export default LiturgiaPage;
