import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { ArrowLeft, BookOpen, ScrollText, Music, Flame, ChevronRight, ChevronLeft, Sparkles, User, Brain, Loader2, BookMarked, Share2, Copy, Check, WifiOff } from 'lucide-react';
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

/* ─── IndexedDB cache (via offlineCache.ts) ─── */
import { getCachedLiturgy, cacheLiturgy } from '@/lib/offlineCache';

/** Pre-fetch last 7 days into IndexedDB cache on mount */
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

/* ─── Types ─── */
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

/* ─── PCH Reflections pool ─── */
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

/* ─── Parse bible reference to route params ─── */
function parseRefToRoute(ref: string): string {
  // e.g. "Jo 3,16-18" → /bible?book=Jo&chapter=3
  const match = ref.match(/^(\d?\s?[A-Za-zÀ-ú]+)\s+(\d+)/);
  if (!match) return AppRoute.BIBLE;
  const book = match[1].trim();
  const chapter = match[2];
  return `${AppRoute.BIBLE}?book=${encodeURIComponent(book)}&chapter=${chapter}`;
}

/* ─── Reading Card ─── */
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
    className="space-y-4"
  >
    <div className="flex items-center gap-2">
      {icon}
      <h2 className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground">{label}</h2>
    </div>

    <p className="text-[10px] font-bold text-primary/70 uppercase tracking-widest">{reference}</p>

    {refrain && (
      <div className="bg-primary/5 rounded-2xl p-4 border border-primary/10">
        <p className="text-sm font-serif italic text-primary">℟ {refrain}</p>
      </div>
    )}

    <p className="text-base md:text-lg leading-[2] text-foreground/90 font-serif whitespace-pre-line">
      {text}
    </p>

    <div className="flex flex-col sm:flex-row gap-2">
      <Button
        variant="outline"
        size="sm"
        className="rounded-xl border-primary/20 text-xs font-bold uppercase tracking-widest hover:bg-primary/5"
        onClick={onContext}
      >
        <BookOpen className="w-3.5 h-3.5 mr-1.5" />
        Ver no contexto bíblico
      </Button>
      <Button
        variant="ghost"
        size="sm"
        className="rounded-xl text-xs font-bold uppercase tracking-widest text-primary hover:bg-primary/10"
        onClick={onReflect}
      >
        <Sparkles className="w-3.5 h-3.5 mr-1.5" />
        Refletir sobre isso
      </Button>
    </div>

    <div className="w-full h-px bg-border" />
  </motion.div>
);

/* ─── Main Page ─── */
const LiturgiaPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [today.toDateString()]
  );

  const saintOfDay = useMemo(() => {
    const m = today.getMonth() + 1;
    const d = today.getDate();
    return SAINTS_DATA.find(s => s.feastMonth === m && s.feastDayNum === d) || SAINTS_DATA[0];
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
            content: `Gere uma Meditação Diária Espiritual baseada no Evangelho do dia: ${readings.evangelho.referencia} - ${readings.evangelho.texto.substring(0, 800)}.

Instruções:
- Antes de responder, analise internamente: qual emoção dominante este texto evoca? Qual a intenção profunda desta passagem?
- Tom: orante, poético e acolhedor (PCH — Poesia Cognitiva Hipnótica). Nunca genérico.
- Estrutura em Markdown:
  1. **Meditação Diária Espiritual** — Título com citação-chave do Evangelho
  2. **Reflexão** — Um parágrafo curto e profundo
  3. **Propósito Prático para o Dia** — Ação concreta e pessoal
  4. **Oração Final** — Curta e íntima
  5. **Próximo Passo** — Sugira uma ação na plataforma (Lectio Divina, Jornada, Santo do dia, Catecismo)
- Insira sutilmente micro-gatilhos de continuidade ("isso está só começando", "há algo mais aqui").
- Termine com uma pergunta profunda que convide o leitor a continuar refletindo.`
          }]
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

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
              const content = json.choices?.[0]?.delta?.content || '';
              fullText += content;
              setMeditation(fullText);
            } catch { /* partial chunk */ }
          }
        }
      }
    } catch (e) {
      console.error('Meditation error:', e);
      setMeditation('Não foi possível gerar a meditação. Tente novamente.');
    } finally {
      setIsMeditationLoading(false);
    }
  }, [readings, isMeditationLoading]);

  // Classify meditation text emotionally whenever it finishes
  useEffect(() => {
    if (meditation && !isMeditationLoading && meditation.length > 50) {
      const combinedText = `${readings?.evangelho?.texto || ''} ${meditation}`;
      setEmotionalRoutes(routeUser(combinedText));
    }
  }, [meditation, isMeditationLoading, readings]);

  const shareMeditation = useCallback(async (method: 'whatsapp' | 'copy') => {
    if (!meditation) return;
    const text = `✨ Meditação do Dia — ${readings?.evangelho?.referencia || ''}\n\n${meditation}\n\n— Via Cathedra Digital`;
    if (method === 'whatsapp') {
      window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
    } else {
      await navigator.clipboard.writeText(text);
      setCopiedMeditation(true);
      toast.success('Meditação copiada!');
      setTimeout(() => setCopiedMeditation(false), 2000);
    }
  }, [meditation, readings]);

  const formatDate = () =>
    today.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <>
      <SEOHead
        title="Liturgia do Dia"
        description="Leituras do dia, reflexão espiritual e santo do dia."
        path="/liturgia"
        keywords="liturgia diária, leituras do dia, evangelho do dia"
      />

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-10">
        {/* TOPO */}
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4 text-center"
        >
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors text-sm mx-auto sm:mx-0"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-xs font-bold uppercase tracking-widest">Voltar</span>
          </button>

          <h1 className="text-3xl md:text-4xl font-display font-bold text-foreground tracking-tight">
            Liturgia do Dia
          </h1>
          <div className="flex items-center justify-center gap-4">
            <button
              onClick={goToPrevDay}
              className="p-2 rounded-xl hover:bg-primary/10 transition-colors text-muted-foreground hover:text-foreground"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <p className="text-sm text-muted-foreground capitalize min-w-[200px]">
              {formatDate()}
              {isToday && <span className="ml-1 text-primary font-bold">(Hoje)</span>}
            </p>
            <button
              onClick={goToNextDay}
              disabled={isToday}
              className="p-2 rounded-xl hover:bg-primary/10 transition-colors text-muted-foreground hover:text-foreground disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          {/* Offline indicator */}
          {isOfflineData && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center justify-center gap-2 text-xs text-muted-foreground bg-muted/50 rounded-full px-3 py-1.5 mt-2"
            >
              <WifiOff className="w-3.5 h-3.5" />
              <span>Modo offline — leitura do cache local</span>
            </motion.div>
          )}
        </motion.div>

        {/* LOADING */}
        {isLoading && (
          <div className="flex justify-center py-20">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {/* READINGS */}
        {readings && (
          <div className="space-y-8">
            {/* Primeira Leitura */}
            {readings.primeiraLeitura && (
              <ReadingCard
                label="Primeira Leitura"
                icon={<ScrollText className="w-4 h-4 text-amber-600" />}
                reference={readings.primeiraLeitura.referencia}
                text={readings.primeiraLeitura.texto}
                onContext={() => navigate(parseRefToRoute(readings.primeiraLeitura.referencia))}
                onReflect={() => navigateToLectio(readings.primeiraLeitura.referencia)}
                delay={0.1}
              />
            )}

            {/* Salmo */}
            {readings.salmo && (
              <ReadingCard
                label="Salmo Responsorial"
                icon={<Music className="w-4 h-4 text-sky-600" />}
                reference={readings.salmo.referencia}
                text={readings.salmo.texto}
                refrain={readings.salmo.refrao}
                onContext={() => navigate(parseRefToRoute(readings.salmo.referencia))}
                onReflect={() => navigateToLectio(readings.salmo.referencia)}
                delay={0.2}
              />
            )}

            {/* Segunda Leitura (domingos e solenidades) */}
            {readings.segundaLeitura && typeof readings.segundaLeitura === 'object' && 'referencia' in readings.segundaLeitura && (
              <ReadingCard
                label="Segunda Leitura"
                icon={<BookMarked className="w-4 h-4 text-emerald-600" />}
                reference={(readings.segundaLeitura as Reading).referencia}
                text={(readings.segundaLeitura as Reading).texto}
                onContext={() => navigate(parseRefToRoute((readings.segundaLeitura as Reading).referencia))}
                onReflect={() => navigateToLectio((readings.segundaLeitura as Reading).referencia)}
                delay={0.25}
              />
            )}

            {readings.evangelho && (
              <ReadingCard
                label="Evangelho"
                icon={<Flame className="w-4 h-4 text-rose-600" />}
                reference={readings.evangelho.referencia}
                text={readings.evangelho.texto}
                onContext={() => navigate(parseRefToRoute(readings.evangelho.referencia))}
                onReflect={() => navigateToLectio(readings.evangelho.referencia)}
                delay={0.3}
              />
            )}
          </div>
        )}

        {/* REFLEXÃO PCH */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-primary/5 border border-primary/10 rounded-3xl p-8 text-center space-y-4"
        >
          <p className="text-[9px] font-black uppercase tracking-[0.3em] text-primary/60">🧠 Reflexão do Dia</p>
          <p className="text-lg md:text-xl font-serif italic text-foreground leading-relaxed">
            "{pchReflection}"
          </p>
        </motion.div>

        {/* MEDITAÇÃO IA (IARA) */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.55 }}
          className="bg-card border border-border rounded-3xl p-6 space-y-4"
        >
          <p className="text-[9px] font-black uppercase tracking-[0.3em] text-muted-foreground text-center">✨ Meditação com IARA</p>

          {!meditation && !isMeditationLoading && (
            <div className="text-center space-y-3">
              <p className="text-sm text-muted-foreground font-serif italic">
                Peça à IARA uma meditação personalizada baseada no Evangelho de hoje.
              </p>
              <Button
                variant="outline"
                className="rounded-xl border-primary/20 text-xs font-bold uppercase tracking-widest hover:bg-primary/5"
                onClick={fetchMeditation}
                disabled={!readings?.evangelho}
              >
                <Brain className="w-3.5 h-3.5 mr-1.5" />
                Gerar Meditação
              </Button>
            </div>
          )}

          {isMeditationLoading && !meditation && (
            <div className="flex items-center justify-center gap-2 py-4">
              <Loader2 className="w-4 h-4 animate-spin text-primary" />
              <span className="text-xs text-muted-foreground">IARA está meditando...</span>
            </div>
          )}

          {meditation && (
            <div className="prose prose-sm dark:prose-invert max-w-none font-serif">
              <ReactMarkdown>{meditation}</ReactMarkdown>
            </div>
          )}

          {meditation && !isMeditationLoading && (
            <div className="flex justify-center gap-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                className="rounded-xl border-primary/20 text-xs font-bold uppercase tracking-widest hover:bg-primary/5"
                onClick={() => shareMeditation('whatsapp')}
              >
                <Share2 className="w-3.5 h-3.5 mr-1.5" />
                WhatsApp
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="rounded-xl border-primary/20 text-xs font-bold uppercase tracking-widest hover:bg-primary/5"
                onClick={() => shareMeditation('copy')}
              >
                {copiedMeditation ? <Check className="w-3.5 h-3.5 mr-1.5" /> : <Copy className="w-3.5 h-3.5 mr-1.5" />}
                {copiedMeditation ? 'Copiado!' : 'Copiar'}
              </Button>
            </div>
          )}

          {/* Emotional classification — smart route suggestions */}
          {emotionalRoutes.length > 0 && meditation && !isMeditationLoading && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="space-y-3 pt-2"
            >
              <p className="text-[9px] font-black uppercase tracking-[0.3em] text-muted-foreground text-center">
                🧭 Próximo passo sugerido
              </p>
              <div className="grid grid-cols-2 gap-2">
                {emotionalRoutes.map((rec) => (
                  <button
                    key={rec.route}
                    onClick={() => navigate(rec.route)}
                    className="flex items-center gap-2 p-3 rounded-xl border border-border bg-background hover:bg-primary/5 transition-colors text-left group"
                  >
                    <span className="text-lg">{rec.icon}</span>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-foreground truncate">{rec.label}</p>
                      <p className="text-[10px] text-muted-foreground truncate">{rec.reason}</p>
                    </div>
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="text-center"
        >
          <Button
            size="lg"
            className="h-14 px-10 rounded-2xl bg-foreground text-background font-black uppercase tracking-[0.2em] text-sm shadow-xl hover:bg-primary hover:text-primary-foreground transition-all group"
            onClick={() => navigateToLectio(readings?.evangelho?.referencia)}
          >
            <Sparkles className="w-4 h-4 mr-2 group-hover:scale-110 transition-transform" />
            Refletir sobre isso
            <ChevronRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
          </Button>
        </motion.div>

        {/* SANTO DO DIA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="bg-card border border-border rounded-3xl p-6 space-y-3"
        >
          <p className="text-[9px] font-black uppercase tracking-[0.3em] text-muted-foreground text-center">✝️ Santo do Dia</p>
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0">
              {saintOfDay.image ? (
                <img src={saintOfDay.image} alt={saintOfDay.name} className="w-full h-full object-cover rounded-2xl" />
              ) : (
                <User className="w-6 h-6 text-primary" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-display font-bold text-foreground text-base">{saintOfDay.name}</h3>
              <p className="text-xs text-muted-foreground italic truncate">{saintOfDay.title}</p>
            </div>
          </div>
          {saintOfDay.quotes[0] && (
            <p className="text-sm font-serif italic text-foreground/80 text-center border-l-2 border-primary/20 pl-4">
              "{saintOfDay.quotes[0]}"
            </p>
          )}
          <Button
            variant="outline"
            size="sm"
            className="w-full rounded-xl border-primary/20 text-xs font-bold uppercase tracking-widest hover:bg-primary/5"
            onClick={() => navigate(`${AppRoute.SAINTS}?saint=${saintOfDay.id}`)}
          >
            Conhecer {saintOfDay.name.split(' ').pop()}
          </Button>
        </motion.div>

        {/* NAVIGATION FLOW */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="space-y-3"
        >
          <p className="text-[9px] font-black uppercase tracking-[0.3em] text-muted-foreground text-center">Continue sua jornada</p>
          <div className="grid grid-cols-2 gap-2">
            {[
              { label: 'Bíblia', route: AppRoute.BIBLE, icon: BookOpen },
              { label: 'Lectio Divina', route: AppRoute.LECTIO_DIVINA, icon: Sparkles },
              { label: 'Santos', route: AppRoute.SAINTS, icon: User },
              { label: 'Jornadas', route: AppRoute.JORNADAS, icon: ChevronRight },
            ].map(item => (
              <button
                key={item.route}
                onClick={() => navigate(item.route)}
                className="flex items-center gap-2 p-3 rounded-xl border border-border bg-card hover:border-primary/30 hover:bg-primary/5 transition-all text-left group"
              >
                <item.icon className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                <span className="text-xs font-bold text-foreground">{item.label}</span>
              </button>
            ))}
          </div>
        </motion.div>

        {/* FLOW CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9 }}
          className="text-center space-y-3 pb-8"
        >
          <p className="text-sm font-serif italic text-muted-foreground">
            "Você começou a ouvir… Agora continue."
          </p>
          <Button
            size="lg"
            className="h-14 px-10 rounded-2xl bg-primary text-primary-foreground font-black uppercase tracking-[0.2em] text-sm shadow-xl group"
            onClick={() => navigate(AppRoute.JORNADAS)}
          >
            Iniciar Jornada
            <ChevronRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
          </Button>
        </motion.div>
      </div>
    </>
  );
};

export default LiturgiaPage;
