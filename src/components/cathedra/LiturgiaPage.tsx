import React, { useState, useMemo, useCallback, useEffect, lazy, Suspense } from 'react';
import { useNavigate, useSearchParams, useParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';

import { Icons } from '@/constants';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
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
import { jsPDF } from 'jspdf';
import { Calendar as CalendarIcon, Heart, FileDown, Filter, List, Check } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format, startOfMonth, endOfMonth, eachDayOfInterval } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useFavorites } from '@/hooks/useFavorites';
import { getLiturgicalPeriods } from '@/lib/liturgy';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from 'sonner';

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

interface Reading {
  referencia: string;
  titulo: string;
  texto: string;
}

interface LiturgyReadings {
  data: string;
  liturgia: string;
  cor: string;
  dia: string; // Oratio / Coleta
  antifonas?: {
    entrada?: string;
    comunhao?: string;
  };
  oferendas?: string;
  comunhao?: string; // Oração depois da comunhão
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

const getLiturgicalColorInfo = (cor: string) => {
  const c = cor?.toLowerCase() || '';
  if (c.includes('branco')) return { hex: '#FFFFFF', name: 'Branco', image: 'https://liturgiadiaria.edicoescnbb.com.br/estolas/branco.png' };
  if (c.includes('verde')) return { hex: '#22C55E', name: 'Verde', image: 'https://liturgiadiaria.edicoescnbb.com.br/estolas/verde.png' };
  if (c.includes('roxo')) return { hex: '#A855F7', name: 'Roxo', image: 'https://liturgiadiaria.edicoescnbb.com.br/estolas/roxo.png' };
  if (c.includes('vermelho')) return { hex: '#EF4444', name: 'Vermelho', image: 'https://liturgiadiaria.edicoescnbb.com.br/estolas/vermelho.png' };
  if (c.includes('rosa')) return { hex: '#EC4899', name: 'Rosa', image: 'https://liturgiadiaria.edicoescnbb.com.br/estolas/rosa.png' };
  if (c.includes('preto')) return { hex: '#000000', name: 'Preto', image: 'https://liturgiadiaria.edicoescnbb.com.br/estolas/preto.png' };
  return { hex: '#FFFFFF', name: 'Branco', image: 'https://liturgiadiaria.edicoescnbb.com.br/estolas/branco.png' };
};

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
    className="space-y-6 bg-card border border-border rounded-[2.5rem] p-8 md:p-10 shadow-sm hover:shadow-md transition-all group relative overflow-hidden"
  >
    <div className="absolute top-0 right-0 p-10 opacity-[0.03] group-hover:opacity-[0.07] transition-opacity pointer-events-none scale-150 transform-gpu">{icon}</div>
    <div className="flex items-center justify-between relative z-10">
      <div className="flex flex-col gap-1">
        <h2 className="text-sm font-black uppercase tracking-[0.2em] text-primary/40 flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-primary/20" />
          {label}
        </h2>
        <p className="text-xl md:text-2xl font-display font-black text-primary tracking-tight">{reference}</p>
      </div>
    </div>
    {refrain && (
      <div className="bg-secondary/5 rounded-3xl p-8 border border-secondary/10 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-1 h-full bg-secondary/40" />
        <p className="text-xl md:text-2xl font-serif italic text-primary leading-relaxed antialiased">
          <span className="text-secondary font-bold mr-2">℟.</span> {refrain}
        </p>
      </div>
    )}
    <p className="text-lg md:text-2xl leading-[1.7] text-primary/90 font-serif whitespace-pre-line selection:bg-secondary/30 antialiased tracking-tight">
      {text}
    </p>
    <div className="flex flex-wrap items-center gap-4 pt-8 border-t border-border/40 mt-4">
      <Button variant="ghost" size="sm" className="rounded-2xl text-[10px] font-black uppercase tracking-widest h-12 px-8 hover:bg-primary hover:text-white transition-all border border-border/50" onClick={onContext}>
        <Icons.Bible className="w-4 h-4 mr-2" /> Bíblia
      </Button>
      <Button variant="secondary" size="sm" className="rounded-2xl text-[10px] font-black uppercase tracking-widest ml-auto h-12 px-10 bg-secondary/10 border-none hover:bg-secondary/20 text-primary shadow-sm" onClick={onReflect}>
        <Icons.Lectio className="w-4 h-4 mr-2 text-secondary" /> Lectio Divina
      </Button>
    </div>
  </motion.div>
);

const LiturgyPrayerCard: React.FC<{
  label: string;
  text: string;
  delay: number;
}> = ({ label, text, delay }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5, delay }}
    className="p-10 bg-muted/20 border border-border/50 rounded-[2.5rem] space-y-4 shadow-inner"
  >
    <div className="flex items-center gap-3">
      <div className="w-1.5 h-1.5 rounded-full bg-secondary/40" />
      <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-primary/40">{label}</h3>
    </div>
    <p className="text-lg md:text-xl font-serif italic text-primary/70 leading-relaxed antialiased selection:bg-secondary/20">
      {text}
    </p>
  </motion.div>
);

const hasContent = (text: string | null | undefined) => !!text && text.trim().length > 0;

const LiturgiaPage: React.FC = () => {
  const navigate = useNavigate();
  const { date: routeDate } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const { handleKeyDown: handleTabKeyDown } = useTabNavigation();
  const queryClient = useQueryClient();
  const activeTab = searchParams.get('tab') || 'liturgia';
  const tabList = ['liturgia', 'missal', 'calendario'];

  const { profile } = useAuth();
  const { toggleFavorite, isFavorite } = useFavorites();
  
  const [selectedDate, setSelectedDate] = useState(() => {
    if (routeDate) {
      const d = new Date(routeDate + "T12:00:00");
      if (!isNaN(d.getTime())) return d;
    }
    return new Date();
  });

  const today = selectedDate;
  const [isOfflineData, setIsOfflineData] = useState(false);
  const [showMonthList, setShowMonthList] = useState(false);
  const [isMonthViewOpen, setIsMonthViewOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isExportingMonth, setIsExportingMonth] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [activeCelebrationIndex, setActiveCelebrationIndex] = useState(0);

  useEffect(() => {
    if (routeDate) {
      const d = new Date(routeDate + "T12:00:00");
      if (!isNaN(d.getTime()) && d.toDateString() !== selectedDate.toDateString()) {
        setSelectedDate(d);
      }
    }
  }, [routeDate]);

  const dateKey = today.toDateString();

  const goToPrevDay = () => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() - 1);
    const dateStr = format(d, 'yyyy-MM-dd');
    navigate(`${AppRoute.LITURGIA}/${dateStr}${location.search}`);
    setIsOfflineData(false);
  };

  const goToNextDay = () => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + 1);
    const dateStr = format(d, 'yyyy-MM-dd');
    navigate(`${AppRoute.LITURGIA}/${dateStr}${location.search}`);
    setIsOfflineData(false);
  };

  const { data: monthData, isLoading: isLoadingMonth } = useQuery({
    queryKey: ['liturgical-month', today.getFullYear(), today.getMonth()],
    queryFn: async () => {
      const { data } = await supabase.functions.invoke('liturgical-calendar', {
        body: { action: 'month', year: today.getFullYear(), month: today.getMonth() + 1 }
      });
      
      if (!Array.isArray(data)) return [];
      
      // Deduplicate by date and internal celebrations by title
      const uniqueDays = new Map();
      data.forEach((day: any) => {
        if (!uniqueDays.has(day.date)) {
          const uniqueCelebs = [];
          const seenTitles = new Set();
          day.celebrations?.forEach((c: any) => {
            if (!seenTitles.has(c.title)) {
              uniqueCelebs.push(c);
              seenTitles.add(c.title);
            }
          });
          uniqueDays.set(day.date, { ...day, celebrations: uniqueCelebs });
        }
      });
      return Array.from(uniqueDays.values());
    },
    enabled: isMonthViewOpen || searchQuery.length > 0,
    staleTime: 1000 * 60 * 60 * 24,
  });

  const { data: dayCelebrations } = useQuery({
    queryKey: ['liturgical-day-celebrations', dateKey],
    queryFn: async () => {
      const { data } = await supabase.functions.invoke('liturgical-calendar', {
        body: { 
          action: 'date', 
          year: today.getFullYear(), 
          month: today.getMonth() + 1, 
          day: today.getDate() 
        }
      });

      if (data && data.celebrations) {
        const uniqueCelebs = [];
        const seenTitles = new Set();
        data.celebrations.forEach((c: any) => {
          if (!seenTitles.has(c.title)) {
            uniqueCelebs.push(c);
            seenTitles.add(c.title);
          }
        });
        return { ...data, celebrations: uniqueCelebs };
      }
      return data;
    },
    staleTime: 1000 * 60 * 60 * 24,
  });

  useEffect(() => {
    setActiveCelebrationIndex(0);
  }, [dateKey]);

  const liturgicalPeriods = useMemo(() => getLiturgicalPeriods(today.getFullYear()), [today.getFullYear()]);

  const filteredMonthDays = useMemo(() => {
    if (!searchQuery || !Array.isArray(monthData)) return [];
    const q = searchQuery.toLowerCase();
    return monthData.filter((day: any) => {
      return day.celebrations?.some((c: any) => c.title?.toLowerCase().includes(q));
    });
  }, [monthData, searchQuery]);

  const downloadMonth = async () => {
    setIsDownloading(true);
    try {
      const start = startOfMonth(today);
      const end = endOfMonth(today);
      const days = eachDayOfInterval({ start, end });
      
      let count = 0;
      for (const d of days) {
        const key = d.toDateString();
        const cached = await getCachedLiturgy(key);
        if (!cached) {
          const { data } = await supabase.functions.invoke('liturgical-calendar', {
            body: { action: 'readings', day: d.getDate(), month: d.getMonth() + 1 }
          });
          if (data) await cacheLiturgy(key, data as LiturgyReadings);
        }
        count++;
      }
      toast.success(`${count} liturgias baixadas para acesso offline.`);
    } catch (err) {
      toast.error('Erro ao baixar período');
    } finally {
      setIsDownloading(false);
    }
  };

  const exportMonthPDF = async () => {
    setIsExportingMonth(true);
    try {
      const doc = new jsPDF();
      const margin = 20;
      const start = startOfMonth(today);
      const end = endOfMonth(today);
      const days = eachDayOfInterval({ start, end });

      doc.setFontSize(22);
      doc.setTextColor(30, 58, 138);
      doc.text(`Liturgia Consolidada: ${format(today, 'MMMM yyyy', { locale: ptBR })}`, margin, 20);

      for (const d of days) {
        doc.addPage();
        let y = 20;
        const key = d.toDateString();
        let readingsData = await getCachedLiturgy(key);
        
        if (!readingsData) {
          const { data } = await supabase.functions.invoke('liturgical-calendar', {
            body: { action: 'readings', day: d.getDate(), month: d.getMonth() + 1 }
          });
          readingsData = data as LiturgyReadings;
        }

        if (readingsData) {
          doc.setFontSize(16);
          doc.setTextColor(0, 0, 0);
          doc.text(format(d, 'dd/MM/yyyy - EEEE', { locale: ptBR }), margin, y);
          y += 10;
          doc.setFontSize(12);
          doc.setTextColor(100, 100, 100);
          doc.text((readingsData as any).liturgia, margin, y);
          y += 15;

          const addSection = (title: string, ref: string, text: string) => {
            if (y > 240) { doc.addPage(); y = 20; }
            doc.setFontSize(14); doc.setFont("helvetica", "bold"); doc.setTextColor(30, 58, 138);
            doc.text(title, margin, y); y += 7;
            doc.setFontSize(10); doc.setFont("helvetica", "italic"); doc.setTextColor(150, 150, 150);
            doc.text(ref, margin, y); y += 8;
            doc.setFont("helvetica", "normal"); doc.setFontSize(11); doc.setTextColor(0, 0, 0);
            const splitText = doc.splitTextToSize(text, 170);
            doc.text(splitText, margin, y);
            y += (splitText.length * 6) + 12;
          };

          const r = readingsData as any;
          if (r.primeiraLeitura) addSection("1ª Leitura", r.primeiraLeitura.referencia, r.primeiraLeitura.texto);
          if (r.evangelho) addSection("Evangelho", r.evangelho.referencia, r.evangelho.texto);
        }
      }

      doc.save(`liturgia-${format(today, 'yyyy-MM')}.pdf`);
      toast.success('PDF consolidado gerado!');
    } catch (err) {
      toast.error('Erro ao exportar mês');
    } finally {
      setIsExportingMonth(false);
    }
  };

  const exportToPDF = async () => {
    if (!readings) return;
    try {
      const doc = new jsPDF();
      const margin = 20;
      let y = margin;

      doc.setFontSize(22);
      doc.setTextColor(30, 58, 138); // primary color
      doc.text("Cathedra Digital", margin, y);
      y += 10;
      
      doc.setFontSize(16);
      doc.setTextColor(0, 0, 0);
      doc.text(`Liturgia do Dia: ${formatDate()}`, margin, y);
      y += 10;
      doc.setFontSize(12);
      doc.setTextColor(100, 100, 100);
      doc.text(readings.liturgia, margin, y);
      y += 15;

      const addReading = (title: string, ref: string, text: string) => {
        if (y > 240) { doc.addPage(); y = margin; }
        doc.setFontSize(14);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(30, 58, 138);
        doc.text(title, margin, y);
        y += 7;
        doc.setFontSize(10);
        doc.setFont("helvetica", "italic");
        doc.setTextColor(150, 150, 150);
        doc.text(ref, margin, y);
        y += 8;
        doc.setFont("helvetica", "normal");
        doc.setFontSize(11);
        doc.setTextColor(0, 0, 0);
        const splitText = doc.splitTextToSize(text, 170);
        doc.text(splitText, margin, y);
        y += (splitText.length * 6) + 12;
      };

      if (readings.primeiraLeitura) addReading("Primeira Leitura", readings.primeiraLeitura.referencia, readings.primeiraLeitura.texto);
      if (readings.salmo) addReading("Salmo Responsorial", readings.salmo.referencia, readings.salmo.refrao + "\n\n" + readings.salmo.texto);
      if (readings.segundaLeitura && typeof readings.segundaLeitura !== 'string') addReading("Segunda Leitura", readings.segundaLeitura.referencia, readings.segundaLeitura.texto);
      if (readings.evangelho) addReading("Evangelho", readings.evangelho.referencia, readings.evangelho.texto);

      doc.save(`cathedra-liturgia-${format(today, 'yyyy-MM-dd')}.pdf`);
      toast.success('PDF gerado com sucesso!');
    } catch (err) {
      console.error('PDF error:', err);
      toast.error('Erro ao gerar PDF');
    }
  };

  const toggleFavoriteDay = () => {
    if (!readings) return;
    const currentPeriod = liturgicalPeriods.find(p => p.date <= today)?.name || 'Tempo Comum';
    toggleFavorite({
      type: 'liturgy',
      title: `Liturgia - ${format(today, 'dd/MM/yyyy')}`,
      content: readings.liturgia,
      metadata: {
        date: format(today, 'yyyy-MM-dd'),
        year: today.getFullYear().toString(),
        period: currentPeriod
      }
    } as any);
    toast.success(isFavorite('liturgy', `Liturgia - ${format(today, 'dd/MM/yyyy')}`) ? 'Removido dos favoritos' : 'Adicionado aos favoritos');
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
    <>
      <SEOHead title="Liturgia do Dia" description="Leituras do dia." path="/liturgia" keywords="liturgia" />
      <div className="desktop-layout py-10">
        <div className="desktop-main px-4">
        <div className="flex justify-center mb-12">
          <div className="bg-muted/40 p-1.5 rounded-[2.5rem] border border-border/40 flex gap-1 overflow-x-auto max-w-full shadow-inner" role="tablist" aria-label="Navegação da Liturgia">
            {[
              { id: 'liturgia', label: 'Liturgia', icon: <Icons.Liturgy className="w-4 h-4" /> },
              { id: 'missal', label: 'Missal', icon: <Icons.Cross className="w-4 h-4" /> },
              { id: 'calendario', label: 'Calendário', icon: <Icons.Calendar className="w-4 h-4" /> }
            ].map((tab, idx) => (
              <button
                key={tab.id}
                {...getTabProps(`tab-${tab.id}`, `panel-${tab.id}`, activeTab === tab.id, `flex items-center gap-2 px-10 py-3 rounded-full text-sm font-black uppercase tracking-widest transition-all focus-visible:ring-2 focus-visible:ring-primary outline-none ${
                  activeTab === tab.id ? 'bg-background shadow-xl text-primary scale-105' : 'text-muted-foreground hover:text-foreground hover:bg-muted/60'
                }`)}
                onClick={() => setSearchParams({ tab: tab.id })}
                onKeyDown={(e) => handleTabKeyDown(e, idx, 3, (newIdx) => setSearchParams({ tab: tabList[newIdx] }), 'tab-')}
              >
                {tab.icon} {tab.label}
              </button>
            ))}
          </div>
        </div>

        <Suspense fallback={<div className="flex justify-center py-20"><Icons.Loader2 className="w-10 h-10 text-secondary animate-spin" /></div>}>
          {activeTab === 'liturgia' && (
            <div {...getTabPanelProps('panel-liturgia', 'tab-liturgia', activeTab === 'liturgia', "max-w-2xl mx-auto space-y-10 animate-in fade-in duration-500 outline-none")}>
              <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} className="space-y-4 text-center">
                <h1 className="text-3xl md:text-5xl font-display font-black text-primary tracking-tight">Liturgia do Dia</h1>
                {dayCelebrations?.celebrations?.[activeCelebrationIndex] && (
                  <motion.p 
                    key={activeCelebrationIndex}
                    initial={{ opacity: 0 }} 
                    animate={{ opacity: 1 }} 
                    className="text-lg font-serif italic text-primary/60"
                  >
                    {dayCelebrations.celebrations[activeCelebrationIndex].title}
                  </motion.p>
                )}
                <div className="flex items-center justify-center gap-4">
                  <button onClick={goToPrevDay} className="p-3 rounded-2xl bg-muted hover:bg-primary hover:text-white transition-all text-primary focus-visible:ring-2 focus-visible:ring-primary outline-none" aria-label="Dia anterior"><Icons.ChevronLeft className="w-5 h-5" /></button>
                  <p className="text-sm font-bold text-primary capitalize min-w-[200px]">{formatDate()}{isToday && <span className="ml-2 text-secondary">(Hoje)</span>}</p>
                  <button onClick={goToNextDay} className="p-3 rounded-2xl bg-muted hover:bg-primary hover:text-white transition-all text-primary focus-visible:ring-2 focus-visible:ring-primary outline-none" aria-label="Próximo dia"><Icons.ChevronRight className="w-5 h-5" /></button>
                </div>

                {dayCelebrations?.celebrations?.length > 1 && (
                  <div className="flex justify-center mt-6">
                    <div className="bg-muted/30 p-1.5 rounded-2xl border border-border/40 flex gap-1 shadow-inner max-w-full overflow-x-auto">
                      {dayCelebrations.celebrations.map((celeb: any, idx: number) => (
                        <button
                          key={`${celeb.title}-${idx}`}
                          onClick={() => setActiveCelebrationIndex(idx)}
                          className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${
                            activeCelebrationIndex === idx 
                              ? 'bg-background shadow-md text-primary scale-105' 
                              : 'text-muted-foreground hover:text-foreground'
                          }`}
                        >
                          {celeb.title}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div className="max-w-md mx-auto w-full px-4 mt-8">
                  <div className="relative group">
                    <Icons.Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                    <input 
                      type="text"
                      placeholder="Buscar celebrações no mês..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-12 pr-4 h-12 rounded-2xl border border-border/50 bg-muted/20 focus:bg-background focus:ring-2 focus:ring-primary/20 outline-none transition-all text-sm font-medium"
                    />
                  </div>
                </div>

                {searchQuery && (
                  <div className="max-w-2xl mx-auto w-full px-4 mb-8 mt-4">
                    <Card className="rounded-3xl border-primary/20 bg-primary/5 overflow-hidden shadow-sm">
                      <div className="p-4 border-b border-border/20 flex items-center justify-between">
                        <span className="text-[10px] font-black uppercase tracking-widest text-primary">Resultados da Busca</span>
                        <Button variant="ghost" size="sm" onClick={() => setSearchQuery('')} className="h-8 text-[9px] font-black uppercase">Limpar</Button>
                      </div>
                      <div className="max-h-60 overflow-y-auto p-2 space-y-2">
                        {isLoadingMonth ? (
                          <div className="flex justify-center py-4"><Icons.Loader2 className="w-5 h-5 animate-spin text-primary" /></div>
                        ) : filteredMonthDays.length > 0 ? (
                          filteredMonthDays.map((day: any) => (
                            <button 
                              key={day.date}
                              onClick={() => {
                                const d = new Date(day.date + "T12:00:00");
                                setSelectedDate(d);
                                setSearchQuery('');
                                navigate(`${AppRoute.LITURGIA}/${day.date}`);
                              }}
                              className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-background transition-colors text-left"
                            >
                              <div className="flex items-center gap-3">
                                <div className="text-center min-w-[32px]">
                                  <p className="text-sm font-bold text-primary">{format(new Date(day.date + "T12:00:00"), 'dd')}</p>
                                </div>
                                <p className="text-xs font-bold text-foreground/80 line-clamp-1">
                                  {day.celebrations?.[0]?.title} {day.celebrations?.length > 1 && `(+${day.celebrations.length - 1})`}
                                </p>
                              </div>
                              <Icons.ChevronRight className="w-3 h-3 text-muted-foreground" />
                            </button>
                          ))
                        ) : (
                          <p className="text-center py-4 text-xs text-muted-foreground">Nenhuma celebração encontrada.</p>
                        )}
                      </div>
                    </Card>
                  </div>
                )}

                <div className="flex flex-wrap items-center justify-center gap-3">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="rounded-xl h-11 px-4 gap-2 border-border/50 hover:bg-muted/50 transition-all">
                        <CalendarIcon className="w-4 h-4 text-primary" />
                        <span className="text-[10px] font-black uppercase tracking-widest hidden sm:inline">Ir para Data</span>
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="center">
                      <Calendar
                        mode="single"
                        selected={selectedDate}
                        onSelect={(d) => {
                          if (d) {
                            const dateStr = format(d, 'yyyy-MM-dd');
                            setSelectedDate(d);
                            navigate(`${AppRoute.LITURGIA}/${dateStr}`);
                          }
                        }}
                        initialFocus
                        locale={ptBR}
                        className="rounded-3xl border-none p-4"
                      />
                    </PopoverContent>
                  </Popover>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" className="rounded-xl h-11 px-4 gap-2 border-border/50 hover:bg-muted/50 transition-all">
                        <Filter className="w-4 h-4 text-primary" />
                        <span className="text-[10px] font-black uppercase tracking-widest hidden sm:inline">Períodos</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="center" className="w-56 rounded-3xl p-3 shadow-2xl border-border/40 bg-background/95 backdrop-blur-xl">
                      <DropdownMenuLabel className="text-[10px] font-black uppercase tracking-widest p-2 opacity-50">Saltar para Período</DropdownMenuLabel>
                      <DropdownMenuSeparator className="bg-border/40" />
                      {liturgicalPeriods.map((period) => (
                        <DropdownMenuItem 
                          key={period.name}
                          onClick={() => {
                            setSelectedDate(period.date);
                            toast.info(`Navegando para o início do ${period.name}`);
                          }}
                          className="rounded-2xl p-3 cursor-pointer flex items-center justify-between hover:bg-primary/5 transition-colors group"
                        >
                          <span className="text-xs font-bold text-foreground/80 group-hover:text-primary transition-colors">{period.name}</span>
                          <div className={`w-2.5 h-2.5 rounded-full ring-4 ring-background shadow-sm ${
                            period.color === 'roxo' ? 'bg-purple-500' :
                            period.color === 'branco' ? 'bg-slate-300' :
                            period.color === 'vermelho' ? 'bg-red-500' : 'bg-green-500'
                          }`} />
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>

                  <Dialog open={isMonthViewOpen} onOpenChange={setIsMonthViewOpen}>
                    <DialogTrigger asChild>
                      <Button variant="outline" className="rounded-xl h-11 px-4 gap-2 border-border/50 hover:bg-muted/50 transition-all">
                        <List className="w-4 h-4 text-primary" />
                        <span className="text-[10px] font-black uppercase tracking-widest hidden sm:inline">Ver Mês</span>
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl max-h-[80vh] rounded-[2.5rem] p-0 overflow-hidden border-border/40 shadow-2xl">
                      <DialogHeader className="p-8 pb-4 bg-muted/30">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                          <DialogTitle className="text-2xl font-serif font-bold text-primary flex items-center gap-3">
                            <Icons.Calendar className="w-6 h-6" />
                            Leituras de {format(today, 'MMMM yyyy', { locale: ptBR })}
                          </DialogTitle>
                          <div className="flex gap-2">
                            <Button 
                              variant="outline" 
                              size="sm" 
                              onClick={downloadMonth}
                              disabled={isDownloading}
                              className="rounded-xl h-10 px-4 text-[9px] font-black uppercase tracking-widest gap-2"
                            >
                              {isDownloading ? <Icons.Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Icons.Download className="w-3.5 h-3.5" />}
                              Baixar Mês
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              onClick={exportMonthPDF}
                              disabled={isExportingMonth}
                              className="rounded-xl h-10 px-4 text-[9px] font-black uppercase tracking-widest gap-2"
                            >
                              {isExportingMonth ? <Icons.Loader2 className="w-3.5 h-3.5 animate-spin" /> : <FileDown className="w-3.5 h-3.5" />}
                              PDF Mensal
                            </Button>
                          </div>
                        </div>
                      </DialogHeader>
                      <ScrollArea className="h-full max-h-[60vh] p-8 pt-0">
                        <div className="space-y-3 pb-8">
                          {isLoadingMonth ? (
                            <div className="flex flex-col items-center justify-center py-20 space-y-4">
                              <Icons.Loader2 className="w-8 h-8 text-primary animate-spin" />
                              <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Sincronizando calendário...</p>
                            </div>
                          ) : Array.isArray(monthData) ? (
                            monthData.map((day: any) => {
                              const date = new Date(day.date + "T12:00:00");
                              const isDaySelected = date.toDateString() === today.toDateString();
                              return (
                                <button 
                                  key={day.date}
                                  onClick={() => {
                                    setSelectedDate(date);
                                    setIsMonthViewOpen(false);
                                    navigate(`${AppRoute.LITURGIA}/${day.date}`);
                                  }}
                                  className={`w-full flex items-center justify-between p-4 rounded-2xl border transition-all text-left group
                                    ${isDaySelected ? 'bg-primary/5 border-primary shadow-sm' : 'border-border/40 bg-card hover:border-primary/30 hover:bg-muted/30'}
                                  `}
                                >
                                  <div className="flex items-center gap-4">
                                    <div className="text-center min-w-[40px]">
                                      <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">{format(date, 'eee', { locale: ptBR })}</p>
                                      <p className="text-lg font-bold text-primary leading-none">{format(date, 'dd')}</p>
                                    </div>
                                    <div className="h-8 w-px bg-border/40" />
                                    <div>
                                      <p className="text-sm font-bold text-foreground/80 line-clamp-1 group-hover:text-primary transition-colors">
                                        {day.celebrations?.[0]?.title} {day.celebrations?.length > 1 && `(+${day.celebrations.length - 1})`}
                                      </p>
                                      <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground opacity-60">
                                        {day.season || 'Tempo Comum'}
                                      </p>
                                    </div>
                                  </div>
                                  <Icons.ChevronRight className="w-4 h-4 text-muted-foreground group-hover:translate-x-1 transition-transform" />
                                </button>
                              );
                            })
                          ) : (
                            <p className="text-center py-10 text-muted-foreground">Não foi possível carregar as leituras do mês.</p>
                          )}
                        </div>
                      </ScrollArea>
                    </DialogContent>
                  </Dialog>

                  <Button 
                    variant="outline" 
                    className="rounded-xl h-11 px-4 gap-2 border-border/50 hover:bg-muted/50 transition-all"
                    onClick={exportToPDF}
                    disabled={!readings || isLoading}
                  >
                    <FileDown className="w-4 h-4 text-primary" />
                    <span className="text-[10px] font-black uppercase tracking-widest hidden sm:inline">Exportar PDF</span>
                  </Button>

                  <Button 
                    variant="outline" 
                    className={`rounded-xl h-11 px-4 gap-2 border-border/50 transition-all ${isFavorite('liturgy', `Liturgia - ${format(today, 'dd/MM/yyyy')}`) ? 'bg-primary/5 border-primary/40 text-primary' : 'hover:bg-muted/50'}`}
                    onClick={toggleFavoriteDay}
                    disabled={!readings || isLoading}
                  >
                    <Heart className={`w-4 h-4 ${isFavorite('liturgy', `Liturgia - ${format(today, 'dd/MM/yyyy')}`) ? 'fill-current' : 'text-primary'}`} />
                    <span className="text-[10px] font-black uppercase tracking-widest hidden sm:inline">Favoritar</span>
                  </Button>
                </div>

                {isOfflineData && <div className="flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest text-muted-foreground bg-muted/50 rounded-full px-4 py-2 mt-4 mx-auto w-fit"><Icons.WifiOff className="w-3.5 h-3.5" /> <span>Modo Offline</span></div>}
              </motion.div>

              {profile?.diocese && (
                <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-secondary/5 border border-secondary/20 rounded-2xl p-4 flex items-center justify-between group">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-secondary/10 text-secondary"><Icons.Church className="w-5 h-5" /></div>
                    <div><p className="text-[10px] font-black uppercase tracking-widest text-secondary/60">Sua Diocese</p><h3 className="text-sm font-bold text-primary">{profile.diocese}</h3></div>
                  </div>
                  <div className="text-right"><p className="text-[9px] font-medium text-muted-foreground uppercase tracking-widest">Estado</p><p className="text-xs font-bold text-primary">{profile.estado}</p></div>
                </motion.div>
              )}

              {isLoading && <LiturgiaSkeleton />}
              {readings && (
                <div className="space-y-8">
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-card border border-border rounded-[2.5rem] p-8 flex flex-col items-center text-center space-y-6 shadow-sm overflow-hidden relative"
                  >
                    <div className="absolute top-0 left-0 w-full h-1.5" style={{ backgroundColor: getLiturgicalColorInfo(readings.cor).hex }} />
                    <div className="flex flex-col items-center gap-4">
                      <div className="relative group">
                        <div className="absolute inset-0 bg-primary/5 rounded-full blur-2xl group-hover:bg-primary/10 transition-all scale-150" />
                        <img 
                          src={getLiturgicalColorInfo(readings.cor).image} 
                          alt={`Estola ${readings.cor}`}
                          className="w-20 h-20 object-contain relative z-10 drop-shadow-xl"
                        />
                      </div>
                      <div className="space-y-2">
                        <p className="text-[10px] font-black uppercase tracking-[0.4em] text-primary/40">Ciclo Litúrgico</p>
                        <h3 className="text-xl md:text-2xl font-display font-black text-primary leading-tight max-w-md">{readings.liturgia}</h3>
                        <div className="flex items-center justify-center gap-2 mt-2">
                          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: getLiturgicalColorInfo(readings.cor).hex }} />
                          <span className="text-[10px] font-black uppercase tracking-widest text-primary/60">{readings.cor}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                      <div className="px-5 py-2 rounded-2xl bg-primary/5 border border-primary/10 shadow-sm">
                        <p className="text-[11px] font-black text-primary uppercase tracking-widest">
                          {readings.primeiraLeitura?.referencia}
                        </p>
                      </div>
                      {readings.salmo && (
                         <div className="px-5 py-2 rounded-2xl bg-primary/5 border border-primary/10 shadow-sm">
                          <p className="text-[11px] font-black text-primary uppercase tracking-widest">
                            {readings.salmo.referencia}
                          </p>
                        </div>
                      )}
                      {readings.segundaLeitura && (
                        <div className="px-5 py-2 rounded-2xl bg-primary/5 border border-primary/10 shadow-sm">
                          <p className="text-[11px] font-black text-primary uppercase tracking-widest">
                            {typeof readings.segundaLeitura === 'string' ? readings.segundaLeitura : readings.segundaLeitura.referencia}
                          </p>
                        </div>
                      )}
                      <div className="px-5 py-2 rounded-2xl bg-primary/5 border border-primary/10 shadow-sm">
                        <p className="text-[11px] font-black text-primary uppercase tracking-widest">
                          {readings.evangelho?.referencia}
                        </p>
                      </div>
                    </div>
                  </motion.div>

                  {hasContent(readings.antifonas?.entrada) && <LiturgyPrayerCard label="Antífona de Entrada" text={readings.antifonas!.entrada!} delay={0.05} />}
                  {hasContent(readings.dia) && <LiturgyPrayerCard label="Oração do Dia" text={readings.dia!} delay={0.08} />}

                  {readings.primeiraLeitura && <ReadingCard label="Primeira Leitura" icon={<Icons.Bible className="w-5 h-5" />} reference={readings.primeiraLeitura.referencia} text={readings.primeiraLeitura.texto} onContext={() => navigate(parseRefToRoute(readings.primeiraLeitura.referencia))} onReflect={() => navigateToLectio(readings.primeiraLeitura.referencia)} delay={0.1} />}
                  {readings.salmo && <ReadingCard label="Salmo Responsorial" icon={<Icons.Music className="w-5 h-5" />} reference={readings.salmo.referencia} text={readings.salmo.texto} refrain={readings.salmo.refrao} onContext={() => navigate(AppRoute.BIBLE)} onReflect={() => navigateToLectio(readings.salmo.referencia)} delay={0.2} />}
                  {readings.segundaLeitura && typeof readings.segundaLeitura !== 'string' && <ReadingCard label="Segunda Leitura" icon={<Icons.Bible className="w-5 h-5" />} reference={readings.segundaLeitura.referencia} text={readings.segundaLeitura.texto} onContext={() => navigate(parseRefToRoute((readings.segundaLeitura as Reading).referencia))} onReflect={() => navigateToLectio((readings.segundaLeitura as Reading).referencia)} delay={0.3} />}
                  {readings.evangelho && <ReadingCard label="Evangelho" icon={<Icons.Flame className="w-5 h-5" />} reference={readings.evangelho.referencia} text={readings.evangelho.texto} onContext={() => navigate(parseRefToRoute(readings.evangelho.referencia))} onReflect={() => navigateToLectio(readings.evangelho.referencia)} delay={0.4} />}

                  {hasContent(readings.oferendas) && <LiturgyPrayerCard label="Oração sobre as Oferendas" text={readings.oferendas!} delay={0.45} />}
                  {hasContent(readings.antifonas?.comunhao) && <LiturgyPrayerCard label="Antífona da Comunhão" text={readings.antifonas!.comunhao!} delay={0.48} />}
                  {hasContent(readings.comunhao) && <LiturgyPrayerCard label="Oração depois da Comunhão" text={readings.comunhao!} delay={0.5} />}
                </div>
              )}

              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="bg-primary text-white rounded-[2rem] p-10 text-center space-y-6 shadow-2xl">
                <Icons.Zap className="w-8 h-8 text-secondary mx-auto" />
                <p className="text-[10px] font-black uppercase tracking-[0.4em] opacity-60">Reflexão do Dia</p>
                <p className="text-xl md:text-2xl font-serif italic leading-relaxed">"{padhReflection}"</p>
              </motion.div>

              {saintsToday.length > 0 && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }} className="bg-muted/30 border border-border rounded-[2rem] p-8 flex flex-col items-center text-center space-y-4">
                  <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-secondary p-1 shadow-lg shadow-secondary/10"><img src={saintsToday[0].image} alt={saintsToday[0].name} className="w-full h-full object-cover rounded-full" /></div>
                  <div className="space-y-1">
                    <p className="text-[9px] font-black uppercase tracking-[0.3em] text-secondary">{saintsToday.length > 1 ? 'Santos do Dia' : 'Santo do Dia'}</p>
                    <h3 className="text-xl font-display font-black text-primary">{saintsToday.map(s => s.name).join(' e ')}</h3>
                  </div>
                  <Button variant="ghost" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:bg-primary/5 h-10" onClick={() => navigate(AppRoute.SAINTS)}>Conhecer História <Icons.ChevronRight className="w-4 h-4 ml-2" /></Button>
                </motion.div>
              )}
            </div>
          )}
          {activeTab === 'missal' && <div id="panel-missal" role="tabpanel" aria-labelledby="tab-missal" className="animate-in fade-in slide-in-from-bottom-4 duration-500 outline-none" tabIndex={0}><MissalPage /></div>}
          {activeTab === 'calendario' && <div id="panel-calendario" role="tabpanel" aria-labelledby="tab-calendario" className="animate-in fade-in slide-in-from-bottom-4 duration-500 outline-none" tabIndex={0}><LiturgicalCalendarPage /></div>}
        </Suspense>
        </div>
        
        <aside className="desktop-aside space-y-6 hidden xl:block">
          <div className="desktop-card bg-secondary/5 border-secondary/20"><h3 className="text-[11px] font-black uppercase tracking-widest text-secondary mb-3">Liturgia das Horas</h3><p className="text-xs text-muted-foreground leading-relaxed italic">Una-se à oração universal da Igreja. Santifique cada hora do seu dia através da meditação das leituras.</p></div>
          {saintsToday.length > 0 && (
            <div className="desktop-card">
              <h3 className="text-[11px] font-black uppercase tracking-widest text-primary mb-4">Santos de Hoje</h3>
              <div className="space-y-4">
                {saintsToday.slice(0, 2).map(s => (
                  <div key={s.id} className="flex items-center gap-3 group cursor-pointer" onClick={() => navigate(`/santos/${s.id}`)}>
                    <img src={s.image} alt={s.name} className="w-10 h-10 rounded-full object-cover border border-border group-hover:border-primary transition-all" />
                    <div><p className="text-[10px] font-bold text-foreground leading-tight">{s.name}</p><p className="text-[8px] text-muted-foreground uppercase font-medium">{s.title}</p></div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </aside>
      </div>
    </>
  );
};

export default LiturgiaPage;
