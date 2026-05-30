import React, { useState, useMemo, useCallback, useEffect, lazy, Suspense } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';

import { Icons } from '@/constants';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import SEOHead from '@/components/SEOHead';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { AppRoute } from '@/types';
import { useSaintsToday } from '@/hooks/useSaints';
import { getCachedLiturgy, cacheLiturgy } from '@/lib/offlineCache';
import { LiturgiaSkeleton } from './LiturgiaSkeleton';
import { getTabProps, getTabPanelProps, useTabNavigation } from './TabUtils';
import ContemplativeLayout from './ContemplativeLayout';

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

const PADH_REFLECTIONS = [
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
    className="space-y-lg premium-card p-xl group relative overflow-hidden"
  >
    <div className="absolute top-0 right-0 p-xl opacity-5 group-hover:opacity-10 transition-opacity pointer-events-none">{icon}</div>
    <div className="flex items-center justify-between relative z-10">
      <div className="flex items-center gap-sm">
        <div className="p-xs rounded-premium bg-primary/5 text-primary group-hover:bg-primary group-hover:text-white transition-all shadow-md">{icon}</div>
        <div>
          <h2 className="text-xs font-black uppercase tracking-[0.25em] text-primary">{label}</h2>
          <p className="text-xs font-bold text-secondary/60 uppercase tracking-[0.2em] mt-3xs">{reference}</p>
        </div>
      </div>
    </div>
    {refrain && <div className="bg-secondary/5 rounded-premium p-lg border border-secondary/20 border-l-4 shadow-inner"><p className="text-lg font-serif italic text-primary leading-relaxed antialiased">℟ {refrain}</p></div>}
    <p className="text-lg md:text-xl leading-[1.8] text-primary font-serif whitespace-pre-line selection:bg-secondary/30 antialiased tracking-tight">{text}</p>
    <div className="flex flex-wrap gap-sm pt-lg border-t border-border/40">
      <Button variant="ghost" size="sm" className="rounded-full h-xl px-lg hover:bg-primary hover:text-white transition-all" onClick={onContext}><Icons.Bible className="w-md h-md mr-xs" /> Bíblia</Button>
      <Button variant="secondary" size="sm" className="rounded-full ml-auto h-xl px-xl bg-secondary/10 border-none hover:bg-secondary/20 text-primary shadow-md" onClick={onReflect}><Icons.Lectio className="w-md h-md mr-xs text-secondary" /> Lectio Divina</Button>
    </div>
  </motion.div>
);

const LiturgiaPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { handleKeyDown: handleTabKeyDown } = useTabNavigation();
  const activeTab = searchParams.get('tab') || 'liturgia';
  const tabList = ['liturgia', 'missal', 'calendario'];

  const { profile } = useAuth();
  const [selectedDate, setSelectedDate] = useState(() => new Date());
  const today = selectedDate;
  const [isOfflineData, setIsOfflineData] = useState(false);

  usePrefetchLiturgyCache();

  const dateKey = today.toDateString();

  const goToPrevDay = () => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() - 1);
    setSelectedDate(d);
    setIsOfflineData(false);
  };

  const goToNextDay = () => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + 1);
    if (d <= new Date()) {
      setSelectedDate(d);
      setIsOfflineData(false);
    }
  };

  const isToday = selectedDate.toDateString() === new Date().toDateString();

  const { data: readings, isLoading } = useQuery({
    queryKey: ['liturgy-readings', dateKey],
    queryFn: async () => {
      const cached = await getCachedLiturgy(dateKey);
      const isOfflineMode = localStorage.getItem('cathedra_offline_mode') === 'true';

      if (isOfflineMode) {
        if (cached) {
          setIsOfflineData(true);
          return cached as LiturgyReadings;
        }
        throw new Error('Modo Somente-Cache ativo: Liturgia não disponível offline.');
      }

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

  const padhReflection = useMemo(() => PADH_REFLECTIONS[today.getDate() % PADH_REFLECTIONS.length], [today]);
  const { data: saintsToday = [] } = useSaintsToday();

  const navigateToLectio = (ref?: string) => {
    const q = ref ? `?ref=${encodeURIComponent(ref)}` : '';
    navigate(`${AppRoute.LECTIO_DIVINA}${q}`);
  };

  const formatDate = () => today.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <ContemplativeLayout
      title="Liturgia"
      subtitle="Lex Orandi, Lex Credendi"
      icon={Icons.Liturgy}
      headerActions={
        <div className="bg-muted/40 p-2xs rounded-[2.5rem] border border-border/40 flex gap-2xs overflow-x-auto max-w-full shadow-inner" role="tablist" aria-label="Navegação da Liturgia">
          {[
            { id: 'liturgia', label: 'Liturgia', icon: <Icons.Liturgy className="w-md h-md" /> },
            { id: 'missal', label: 'Missal', icon: <Icons.Cross className="w-md h-md" /> },
            { id: 'calendario', label: 'Calendário', icon: <Icons.Calendar className="w-md h-md" /> }
          ].map((tab, idx) => (
            <Button
              key={tab.id}
              {...getTabProps(`tab-${tab.id}`, `panel-${tab.id}`, activeTab === tab.id, `flex items-center gap-xs px-xl py-sm rounded-full text-sm font-black uppercase tracking-widest transition-all focus-visible:ring-2 focus-visible:ring-primary outline-none ${
                activeTab === tab.id ? 'bg-background shadow-premium-hover text-primary scale-105' : 'text-muted-foreground hover:text-foreground hover:bg-muted/60'
              }`)}
              onClick={() => setSearchParams({ tab: tab.id })}
              onKeyDown={(e) => handleTabKeyDown(e, idx, 3, (newIdx) => setSearchParams({ tab: tabList[newIdx] }), 'tab-')}
            >
              {tab.icon} {tab.label}
            </Button>
          ))}
        </div>
      }
    >
      <SEOHead title="Liturgia do Dia" description="Leituras do dia." path="/liturgia" keywords="liturgia" />
      <div className="desktop-layout">
        <div className="desktop-main px-md">
        <Suspense fallback={<div className="flex justify-center py-3xl"><Icons.Loader2 className="w-xl h-xl text-secondary animate-spin" /></div>}>
          {activeTab === 'liturgia' && (
            <div {...getTabPanelProps('panel-liturgia', 'tab-liturgia', activeTab === 'liturgia', "max-w-2xl mx-auto space-y-xl animate-in fade-in duration-500 outline-none")}>
              <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} className="space-y-md text-center">
                <div className="flex items-center justify-center gap-md">
                  <Button variant="outline" size="icon" onClick={goToPrevDay} aria-label="Dia anterior" className="rounded-full"><Icons.ChevronLeft className="w-md h-md" /></Button>
                  <p className="text-sm font-bold text-primary capitalize min-w-[200px]">{formatDate()}{isToday && <span className="ml-xs text-secondary">(Hoje)</span>}</p>
                  <Button variant="outline" size="icon" onClick={goToNextDay} disabled={isToday} aria-label="Próximo dia" className="rounded-full"><Icons.ChevronRight className="w-md h-md" /></Button>
                </div>
                {isOfflineData && <div className="flex items-center justify-center gap-xs text-xs font-black uppercase tracking-widest text-muted-foreground bg-muted/50 rounded-premium px-md py-xs mt-md mx-auto w-fit"><Icons.WifiOff className="w-sm h-sm" /> <span>Modo Offline</span></div>}
              </motion.div>

              {profile?.diocese && (
                <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-secondary/5 border border-secondary/20 rounded-premium p-md flex items-center justify-between group">
                  <div className="flex items-center gap-sm">
                    <div className="p-xs rounded-premium bg-secondary/10 text-secondary"><Icons.Church className="w-md h-md" /></div>
                    <div><p className="text-xs font-black uppercase tracking-widest text-secondary/60">Sua Diocese</p><h3 className="text-sm font-bold text-primary">{profile.diocese}</h3></div>
                  </div>
                  <div className="text-right"><p className="text-xs font-medium text-muted-foreground uppercase tracking-widest">Estado</p><p className="text-xs font-bold text-primary">{profile.estado}</p></div>
                </motion.div>
              )}

              {isLoading && <LiturgiaSkeleton />}
              {readings && (
                <div className="space-y-xl">
                  {readings.primeiraLeitura && <ReadingCard label="Primeira Leitura" icon={<Icons.Bible className="w-md h-md" />} reference={readings.primeiraLeitura.referencia} text={readings.primeiraLeitura.texto} onContext={() => navigate(parseRefToRoute(readings.primeiraLeitura.referencia))} onReflect={() => navigateToLectio(readings.primeiraLeitura.referencia)} delay={0.1} />}
                  {readings.salmo && <ReadingCard label="Salmo Responsorial" icon={<Icons.Music className="w-md h-md" />} reference={readings.salmo.referencia} text={readings.salmo.texto} refrain={readings.salmo.refrao} onContext={() => navigate(AppRoute.BIBLE)} onReflect={() => navigateToLectio(readings.salmo.referencia)} delay={0.2} />}
                  {readings.segundaLeitura && typeof readings.segundaLeitura !== 'string' && <ReadingCard label="Segunda Leitura" icon={<Icons.Bible className="w-md h-md" />} reference={readings.segundaLeitura.referencia} text={readings.segundaLeitura.texto} onContext={() => navigate(parseRefToRoute((readings.segundaLeitura as Reading).referencia))} onReflect={() => navigateToLectio((readings.segundaLeitura as Reading).referencia)} delay={0.3} />}
                  {readings.evangelho && <ReadingCard label="Evangelho" icon={<Icons.Flame className="w-md h-md" />} reference={readings.evangelho.referencia} text={readings.evangelho.texto} onContext={() => navigate(parseRefToRoute(readings.evangelho.referencia))} onReflect={() => navigateToLectio(readings.evangelho.referencia)} delay={0.4} />}
                </div>
              )}

              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="bg-primary text-white rounded-[2rem] p-xl text-center space-y-lg shadow-premium-hover">
                <Icons.Zap className="w-xl h-xl text-secondary mx-auto" />
                <p className="text-xs font-black uppercase tracking-[0.4em] opacity-60">Reflexão do Dia</p>
                <p className="text-xl md:text-2xl font-serif italic leading-relaxed">"{padhReflection}"</p>
              </motion.div>

              {saintsToday.length > 0 && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }} className="bg-muted/30 border border-border rounded-[2rem] p-xl flex flex-col items-center text-center space-y-md">
                  <div className="w-3xl h-3xl rounded-premium overflow-hidden border-2 border-secondary p-2xs shadow-premium shadow-secondary/10"><img src={saintsToday[0].image} alt={saintsToday[0].name} className="w-full h-full object-cover rounded-full" /></div>
                  <div className="space-y-2xs">
                    <p className="text-xs font-black uppercase tracking-[0.3em] text-secondary">{saintsToday.length > 1 ? 'Santos do Dia' : 'Santo do Dia'}</p>
                    <h3 className="text-xl font-display font-black text-primary">{saintsToday.map(s => s.name).join(' e ')}</h3>
                  </div>
                  <Button variant="ghost" size="sm" className="text-muted-foreground hover:bg-primary/5 h-xl" onClick={() => navigate(AppRoute.SAINTS)}>Conhecer História <Icons.ChevronRight className="w-md h-md ml-xs" /></Button>
                </motion.div>
              )}
            </div>
          )}
          {activeTab === 'missal' && <div id="panel-missal" role="tabpanel" aria-labelledby="tab-missal" className="animate-in fade-in slide-in-from-bottom-md duration-500 outline-none" tabIndex={0}><MissalPage /></div>}
          {activeTab === 'calendario' && <div id="panel-calendario" role="tabpanel" aria-labelledby="tab-calendario" className="animate-in fade-in slide-in-from-bottom-md duration-500 outline-none" tabIndex={0}><LiturgicalCalendarPage /></div>}
        </Suspense>
        </div>
        
        <aside className="desktop-aside space-y-lg hidden xl:block">
          <div className="desktop-card bg-secondary/5 border-secondary/20"><h3 className="text-premium-small font-black uppercase tracking-widest text-secondary mb-sm">Liturgia das Horas</h3><p className="text-xs text-muted-foreground leading-relaxed italic">Una-se à oração universal da Igreja. Santifique cada hora do seu dia através da meditação das leituras.</p></div>
          {saintsToday.length > 0 && (
            <div className="desktop-card">
              <h3 className="text-premium-small font-black uppercase tracking-widest text-primary mb-md">Santos de Hoje</h3>
              <div className="space-y-md">
                {saintsToday.slice(0, 2).map(s => (
                  <div key={s.id} className="flex items-center gap-sm group cursor-pointer" onClick={() => navigate(`/santos/${s.id}`)}>
                    <img src={s.image} alt={s.name} className="w-xl h-xl rounded-full object-cover border border-border group-hover:border-primary transition-all" />
                    <div><p className="text-xs font-bold text-foreground leading-tight">{s.name}</p><p className="text-xs text-muted-foreground uppercase font-medium">{s.title}</p></div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </aside>
      </div>
    </ContemplativeLayout>
  );
};

export default LiturgiaPage;
