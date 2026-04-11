import React, { useState, useEffect, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import ShareButton from './ShareButton';
import ReactMarkdown from 'react-markdown';
import { Icons } from '@/constants';
import { Sun, Cloud, RotateCcw, ChevronLeft, ChevronRight, CalendarDays, ChevronDown, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import AudioButton from './AudioButton';


interface Celebration {
  title: string;
  colour: string;
  rank: string;
}

interface LiturgicalDay {
  date: string;
  season: string;
  season_week: number;
  celebrations: Celebration[];
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

const SEASON_NAMES: Record<string, string> = {
  advent: 'Advento',
  christmas: 'Natal',
  lent: 'Quaresma',
  easter: 'Páscoa',
  ordinary: 'Tempo Comum',
};

const COLOUR_MAP: Record<string, string> = {
  green: 'bg-primary ring-primary/20',
  violet: 'bg-primary ring-primary/40',
  white: 'bg-secondary/10 border border-secondary/20 ring-secondary/10',
  red: 'bg-primary/80 ring-primary/20',
  rose: 'bg-secondary/40 ring-secondary/20',
};

const READING_CATEGORIES = {
  primeiraLeitura: {
    label: 'Primeira Leitura',
    numeral: 'I',
    icon: Icons.Bible,
    color: 'text-primary',
    bgColor: 'bg-muted border-border',
  },
  salmo: {
    label: 'Salmo Responsorial',
    numeral: 'Ps',
    icon: Icons.Music,
    color: 'text-primary',
    bgColor: 'bg-muted border-border',
  },
  segundaLeitura: {
    label: 'Segunda Leitura',
    numeral: 'II',
    icon: Icons.BookOpen,
    color: 'text-primary',
    bgColor: 'bg-muted border-border',
  },
  evangelho: {
    label: 'Evangelho',
    numeral: 'Ev',
    icon: Icons.Lectio,
    color: 'text-primary',
    bgColor: 'bg-muted border-border',
  },
};

const ReadingSection: React.FC<{
  catKey: keyof typeof READING_CATEGORIES;
  reference: string;
  title?: string;
  text: string;
  refrain?: string;
  fontBody?: string;
  fontTitle?: string;
  fontPsalm?: string;
  lineSpacing?: string;
  defaultOpen?: boolean;
}> = ({ catKey, reference, title, text, refrain, fontBody = 'text-[15px] md:text-lg', fontTitle = 'text-base md:text-lg', fontPsalm = 'text-lg md:text-xl', lineSpacing = 'leading-[2] md:leading-[2.1]', defaultOpen = true }) => {
  const cat = READING_CATEGORIES[catKey];
  const CatIcon = cat.icon;
  const isPsalm = catKey === 'salmo';
  const isGospel = catKey === 'evangelho';

  const shareText = isPsalm && refrain ? `℟ ${refrain}\n\n${text}` : text;

  return (
    <Collapsible defaultOpen={defaultOpen}>
      <CollapsibleTrigger className={`flex items-center gap-2.5 w-full px-4 py-3 rounded-2xl border transition-all group ${cat.bgColor}`}>
        <div className="p-1.5 rounded-lg bg-white/70 dark:bg-black/20">
          <CatIcon className={`w-4 h-4 ${cat.color}`} />
        </div>
        <div className="flex flex-col items-start flex-1 min-w-0">
          <span className={`text-[10px] font-black uppercase tracking-widest ${cat.color}`}>{cat.label}</span>
          <span className="text-[10px] text-muted-foreground truncate w-full text-left">{reference}</span>
        </div>
        <ChevronDown className="w-4 h-4 text-muted-foreground transition-transform duration-200 group-data-[state=open]:rotate-180" />
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className={`mt-2 rounded-2xl border border-border bg-card p-5 md:p-8 space-y-4`}>
          {title && (
            <p className={`reader-text italic ${fontTitle} text-muted-foreground border-l-2 border-primary/20 pl-5 py-1.5`}>{title}</p>
          )}
          {isPsalm && refrain && (
            <div className="bg-secondary/5 rounded-xl p-4 border border-secondary/20 relative overflow-hidden">
              <p className={`font-display ${fontPsalm} text-primary leading-snug`}>℟ {refrain}</p>
            </div>
          )}
          <div className={`${isGospel ? 'bg-primary/5 p-5 md:p-8 rounded-xl border border-primary/10' : ''}`}>
            <p className={`reader-text ${fontBody} ${lineSpacing} text-primary whitespace-pre-wrap tracking-[0.005em] ${isPsalm ? 'italic' : ''}`}>{text}</p>
          </div>
          <div className="flex justify-end pt-2">
            <ShareButton title={`${cat.label} — ${reference}`} text={shareText.substring(0, 500)} size="sm" variant="button" />
          </div>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
};

type FontSize = 'P' | 'M' | 'G';
type LineSpacingType = 'compact' | 'normal' | 'relaxed';
const FONT_SIZE_KEY = 'cathedra_font_size';
const LINE_SPACING_KEY = 'cathedra_line_spacing';
const FONT_CLASSES: Record<FontSize, { body: string; title: string; psalm: string; gospel: string }> = {
  P: { body: 'text-[14px] md:text-base', title: 'text-sm md:text-base', psalm: 'text-base md:text-lg', gospel: 'text-[14px] md:text-lg' },
  M: { body: 'text-[16px] md:text-lg', title: 'text-base md:text-lg', psalm: 'text-lg md:text-xl', gospel: 'text-[16px] md:text-xl' },
  G: { body: 'text-[18px] md:text-xl', title: 'text-lg md:text-xl', psalm: 'text-xl md:text-2xl', gospel: 'text-[18px] md:text-2xl' },
};
const LINE_SPACING_CLASSES: Record<LineSpacingType, string> = {
  compact: 'leading-[1.6] md:leading-[1.7]',
  normal: 'leading-[2] md:leading-[2.1]',
  relaxed: 'leading-[2.4] md:leading-[2.6]',
};

const DailyLiturgy: React.FC = () => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [meditation, setMeditation] = useState<string | null>(null);
  const [isMeditationLoading, setIsMeditationLoading] = useState(false);
  const [fontSize, setFontSize] = useState<FontSize>(() => {
    try { return (localStorage.getItem(FONT_SIZE_KEY) as FontSize) || 'M'; } catch { return 'M'; }
  });
  const [lineSpacing, setLineSpacing] = useState<LineSpacingType>(() => {
    try { return (localStorage.getItem(LINE_SPACING_KEY) as LineSpacingType) || 'normal'; } catch { return 'normal'; }
  });

  const isToday = selectedDate.toDateString() === new Date().toDateString();

  const { data: liturgy, isLoading: isLiturgyLoading, error: liturgyError, refetch: refetchLiturgy } = useQuery({
    queryKey: ['liturgy-calendar', selectedDate.toDateString()],
    queryFn: async () => {
      const day = selectedDate.getDate();
      const month = selectedDate.getMonth() + 1;
      const year = selectedDate.getFullYear();
      const calAction = isToday ? 'today' : 'date';
      const { data, error } = await supabase.functions.invoke('liturgical-calendar', {
        body: { action: calAction, lang: 'la', calendar: 'general-la', year, month, day }
      });
      if (error) throw error;
      return data as LiturgicalDay;
    },
    staleTime: 1000 * 60 * 60,
  });

  const { data: readings, isLoading: isReadingsLoading, error: readingsError, refetch: refetchReadings } = useQuery({
    queryKey: ['liturgy-readings', selectedDate.toDateString()],
    queryFn: async () => {
      const day = selectedDate.getDate();
      const month = selectedDate.getMonth() + 1;
      const { data, error } = await supabase.functions.invoke('liturgical-calendar', {
        body: { action: 'readings', day, month }
      });
      if (error) throw error;
      return data as LiturgyReadings;
    },
    staleTime: 1000 * 60 * 60,
  });

  const isLoading = isLiturgyLoading || isReadingsLoading;
  const error = (liturgyError || readingsError) ? 'Erro ao carregar dados.' : '';

  useEffect(() => {
    try { localStorage.setItem(FONT_SIZE_KEY, fontSize); } catch {}
  }, [fontSize]);

  useEffect(() => {
    try { localStorage.setItem(LINE_SPACING_KEY, lineSpacing); } catch {}
  }, [lineSpacing]);

  useEffect(() => {
    setMeditation(null);
  }, [selectedDate]);

  const fc = FONT_CLASSES[fontSize];
  const lc = LINE_SPACING_CLASSES[lineSpacing];

  const navigateDay = (offset: number) => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + offset);
    setSelectedDate(d);
  };

  const fetchMeditation = async () => {
    if (!readings?.evangelho?.texto) return;
    setIsMeditationLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('colloquium', {
        body: { 
          messages: [{ role: 'user', content: `Gere uma meditação curta baseada no Evangelho: ${readings.evangelho.referencia} - ${readings.evangelho.texto}` }]
        }
      });
      if (error) throw error;
      // Stream handling simplified for this call
    } catch (err) {
      console.error(err);
    } finally {
      setIsMeditationLoading(false);
    }
  };

  const dateLabel = selectedDate.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <motion.div className="max-w-4xl mx-auto space-y-8 pb-12 px-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4 }}>
      <div className="flex items-center justify-center gap-4">
        <button onClick={() => navigateDay(-1)} className="p-3 rounded-2xl bg-muted hover:bg-primary hover:text-white transition-all text-primary"><ChevronLeft className="w-5 h-5" /></button>
        <div className="text-center min-w-[220px]">
          <p className="text-sm font-black uppercase tracking-widest text-primary capitalize">{dateLabel}</p>
          {!isToday && <button onClick={() => setSelectedDate(new Date())} className="text-[10px] font-black uppercase tracking-widest text-secondary hover:underline mt-1">Hoje</button>}
        </div>
        <button onClick={() => navigateDay(1)} className="p-3 rounded-2xl bg-muted hover:bg-primary hover:text-white transition-all text-primary"><ChevronRight className="w-5 h-5" /></button>
      </div>

      <div className="bg-card border border-border rounded-[2.5rem] p-8 md:p-16 space-y-12 shadow-sm relative overflow-hidden">
        {isLoading ? (
          <div className="flex justify-center py-20"><Loader2 className="w-10 h-10 text-secondary animate-spin" /></div>
        ) : error ? (
          <div className="text-center py-16 space-y-4"><Cloud className="w-12 h-12 text-muted-foreground mx-auto opacity-20" /><p className="text-primary italic font-serif">{error}</p></div>
        ) : (
          <div className="space-y-10">
            <div className="text-center space-y-4 pb-10 border-b border-border">
              <div className="flex flex-col items-center gap-4">
                <AudioButton variant="solid" className="px-8" />
                <h2 className="text-3xl md:text-5xl font-display font-black text-primary tracking-tight leading-tight">{readings?.liturgia || 'Liturgia do Dia'}</h2>
              </div>

              <div className="flex flex-col items-center gap-3">
                <p className="text-sm text-muted-foreground font-serif italic">{readings?.data || liturgy?.date}</p>
                {readings?.cor && <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-muted border border-border"><div className={`w-3 h-3 rounded-full ${COLOUR_MAP[readings.cor.toLowerCase()] || 'bg-muted'}`} /><span className="text-[10px] font-black uppercase tracking-widest text-primary">{readings.cor}</span></div>}
              </div>
            </div>

            <div className="space-y-6">
              {readings?.primeiraLeitura && <ReadingSection catKey="primeiraLeitura" reference={readings.primeiraLeitura.referencia} title={readings.primeiraLeitura.titulo} text={readings.primeiraLeitura.texto} fontBody={fc.body} fontTitle={fc.title} lineSpacing={lc} />}
              {readings?.salmo && <ReadingSection catKey="salmo" reference={readings.salmo.referencia} text={readings.salmo.texto} refrain={readings.salmo.refrao} fontBody={fc.body} fontPsalm={fc.psalm} lineSpacing={lc} />}
              {readings?.segundaLeitura && typeof readings.segundaLeitura === 'object' && <ReadingSection catKey="segundaLeitura" reference={(readings.segundaLeitura as Reading).referencia} title={(readings.segundaLeitura as Reading).titulo} text={(readings.segundaLeitura as Reading).texto} fontBody={fc.body} fontTitle={fc.title} lineSpacing={lc} />}
              {readings?.evangelho && <ReadingSection catKey="evangelho" reference={readings.evangelho.referencia} title={readings.evangelho.titulo} text={readings.evangelho.texto} fontBody={fc.body} fontTitle={fc.title} lineSpacing={lc} />}
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default DailyLiturgy;
