import React, { useState, useEffect, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import ShareButton from './ShareButton';
import ReactMarkdown from 'react-markdown';
import { 
  Sparkles,
  Music,
  Cross,
  Sun,
  Cloud,
  Brain,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  CalendarDays,
  ChevronDown,
  BookOpen,
  ScrollText,
  Flame,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

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
  green: 'bg-emerald-500 ring-emerald-500/20',
  violet: 'bg-violet-600 ring-violet-600/20',
  white: 'bg-slate-100 border border-slate-300 ring-slate-100/20',
  red: 'bg-red-600 ring-red-600/20',
  rose: 'bg-pink-400 ring-pink-400/20',
};

/* ─── Reading categories (Bible-style) ─── */
const READING_CATEGORIES = {
  primeiraLeitura: {
    label: 'Primeira Leitura',
    numeral: 'I',
    icon: ScrollText,
    color: 'text-amber-600',
    bgColor: 'bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800',
  },
  salmo: {
    label: 'Salmo Responsorial',
    numeral: 'Ps',
    icon: Music,
    color: 'text-sky-600',
    bgColor: 'bg-sky-50 dark:bg-sky-950/30 border-sky-200 dark:border-sky-800',
  },
  segundaLeitura: {
    label: 'Segunda Leitura',
    numeral: 'II',
    icon: BookOpen,
    color: 'text-indigo-600',
    bgColor: 'bg-indigo-50 dark:bg-indigo-950/30 border-indigo-200 dark:border-indigo-800',
  },
  evangelho: {
    label: 'Evangelho',
    numeral: 'Ev',
    icon: Flame,
    color: 'text-rose-600',
    bgColor: 'bg-rose-50 dark:bg-rose-950/30 border-rose-200 dark:border-rose-800',
  },
};

/* ─── Collapsible Reading Section (Bible-style) ─── */
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

  return (
    <Collapsible defaultOpen={defaultOpen}>
      <CollapsibleTrigger className={`flex items-center gap-2.5 w-full px-4 py-3 rounded-xl border transition-all group ${cat.bgColor}`}>
        <div className="p-1.5 rounded-lg bg-white/70 dark:bg-black/20">
          <CatIcon className={`w-4 h-4 ${cat.color}`} />
        </div>
        <div className="flex flex-col items-start flex-1 min-w-0">
          <span className={`text-xs font-black uppercase tracking-widest ${cat.color}`}>{cat.label}</span>
          <span className="text-[10px] text-muted-foreground truncate w-full text-left">{reference}</span>
        </div>
        <ChevronDown className="w-4 h-4 text-muted-foreground transition-transform duration-200 group-data-[state=open]:rotate-180" />
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className={`mt-2 rounded-2xl border border-border bg-card p-5 md:p-8 space-y-4 ${isGospel ? 'border-rose-200/50 dark:border-rose-800/30' : ''}`}>
          {title && (
            <p className={`reader-text italic ${fontTitle} text-muted-foreground border-l-2 ${isGospel ? 'border-rose-300 dark:border-rose-700' : 'border-primary/20'} pl-5 py-1.5`}>{title}</p>
          )}
          {isPsalm && refrain && (
            <div className="bg-sky-50/50 dark:bg-sky-950/20 rounded-xl p-4 border border-sky-200/50 dark:border-sky-800/30 relative overflow-hidden">
              <Music className="absolute -top-2 -right-2 w-8 h-8 text-sky-500/5 rotate-12" />
              <p className={`font-display ${fontPsalm} text-sky-600 dark:text-sky-400 leading-snug`}>℟ {refrain}</p>
            </div>
          )}
          {isGospel ? (
            <div className="bg-rose-50/30 dark:bg-rose-950/10 p-5 md:p-8 rounded-xl border border-rose-200/30 dark:border-rose-800/20">
              <p className={`reader-text text-[16px] md:text-xl ${lineSpacing} text-foreground/95 whitespace-pre-wrap text-center tracking-[0.005em]`}>{text}</p>
            </div>
          ) : (
            <p className={`reader-text ${fontBody} ${lineSpacing} text-foreground/90 whitespace-pre-wrap tracking-[0.005em] ${isPsalm ? 'italic text-foreground/80' : ''}`}>{text}</p>
          )}
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
    staleTime: 1000 * 60 * 60, // 1 hour
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
    staleTime: 1000 * 60 * 60, // 1 hour
  });

  const isLoading = isLiturgyLoading || isReadingsLoading;
  const error = (liturgyError || readingsError) ? 'Erro ao carregar dados da liturgia.' : '';

  const fetchData = useCallback(() => {
    refetchLiturgy();
    refetchReadings();
  }, [refetchLiturgy, refetchReadings]);

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
          messages: [
            { 
              role: 'user', 
              content: `Gere uma Meditação Diária espiritual, curta e profunda, baseada no Evangelho do dia: ${readings.evangelho.referencia} - ${readings.evangelho.texto}. 
              A meditação deve ser escrita num tom orante e teológico (como um Santo Padre da Igreja), dividida em:
              1. Reflexão (um parágrafo curto)
              2. Propósito Prático para o dia
              3. Uma oração final curta.
              Use Markdown para formatação.`
            }
          ] 
        }
      });

      if (error) throw error;

      const reader = data.getReader();
      const decoder = new TextDecoder();
      let fullText = '';
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const dataStr = line.substring(6).trim();
            if (dataStr === '[DONE]') continue;
            try {
              const json = JSON.parse(dataStr);
              const content = json.choices[0]?.delta?.content || '';
              fullText += content;
              setMeditation(fullText);
            } catch {
              // Ignore parse errors for partial chunks
            }
          }
        }
      }
    } catch (err) {
      console.error('Error fetching meditation:', err);
    } finally {
      setIsMeditationLoading(false);
    }
  };

  const dateLabel = selectedDate.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <motion.div className="max-w-4xl mx-auto space-y-6 pb-12" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4 }}>

      {/* Date Navigator */}
      <div className="flex items-center justify-center gap-3">
        <button onClick={() => navigateDay(-1)} className="p-2 rounded-xl bg-secondary border border-border hover:bg-primary/10 transition-all" aria-label="Dia anterior">
          <ChevronLeft className="w-5 h-5 text-foreground" />
        </button>
        <div className="text-center min-w-[200px]">
          <p className="text-sm font-serif capitalize text-foreground">{dateLabel}</p>
          {!isToday && (
            <button onClick={() => setSelectedDate(new Date())} className="text-[9px] font-black uppercase tracking-widest text-primary hover:underline flex items-center gap-1 mx-auto mt-1">
              <CalendarDays className="w-3 h-3" /> Hoje
            </button>
          )}
        </div>
        <button onClick={() => navigateDay(1)} className="p-2 rounded-xl bg-secondary border border-border hover:bg-primary/10 transition-all" aria-label="Próximo dia">
          <ChevronRight className="w-5 h-5 text-foreground" />
        </button>
      </div>

      {/* Font Size & Line Spacing Toggle */}
      <div className="flex items-center justify-center gap-4 flex-wrap">
        <div className="flex items-center gap-2">
          <span className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground">Fonte</span>
          {(['P', 'M', 'G'] as FontSize[]).map(s => (
            <button key={s} onClick={() => setFontSize(s)}
              className={`w-8 h-8 rounded-lg text-xs font-bold transition-all ${
                fontSize === s ? 'bg-primary text-primary-foreground shadow-md' : 'bg-secondary text-muted-foreground hover:text-primary border border-border'
              }`}>
              {s}
            </button>
          ))}
        </div>
        <div className="w-px h-5 bg-border" />
        <div className="flex items-center gap-2">
          <span className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground">Espaço</span>
          {([
            { key: 'compact' as LineSpacingType, icon: '≡' },
            { key: 'normal' as LineSpacingType, icon: '☰' },
            { key: 'relaxed' as LineSpacingType, icon: '⋮' },
          ]).map(({ key, icon }) => (
            <button key={key} onClick={() => setLineSpacing(key)}
              className={`w-8 h-8 rounded-lg text-sm font-bold transition-all ${
                lineSpacing === key ? 'bg-primary text-primary-foreground shadow-md' : 'bg-secondary text-muted-foreground hover:text-primary border border-border'
              }`}>
              {icon}
            </button>
          ))}
        </div>
        {(fontSize !== 'M' || lineSpacing !== 'normal') && (
          <>
            <div className="w-px h-5 bg-border" />
            <button
              onClick={() => { setFontSize('M'); setLineSpacing('normal'); }}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[9px] font-bold uppercase tracking-widest text-muted-foreground hover:text-primary bg-secondary border border-border hover:border-primary/40 transition-all"
            >
              <RotateCcw className="w-3 h-3" />
              Reset
            </button>
          </>
        )}
      </div>

      {/* Main Content */}
      <div className="bg-card border border-border rounded-2xl p-6 md:p-12 space-y-10 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-[0.02] pointer-events-none">
          <Sun className="w-48 h-48 -mr-12 -mt-12 rotate-12" />
        </div>

        {isLoading ? (
          <div className="space-y-6 py-8">
            <div className="flex flex-col items-center gap-3">
              <div className="h-3 w-28 bg-muted rounded animate-pulse" />
              <div className="h-8 w-56 bg-muted rounded animate-pulse" />
              <div className="h-3 w-36 bg-muted rounded animate-pulse" />
            </div>
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="space-y-3">
                <div className="h-5 w-40 bg-muted rounded animate-pulse" />
                <div className="h-20 w-full bg-muted rounded animate-pulse" />
              </div>
            ))}
          </div>
        ) : error && !readings ? (
          <div className="text-center py-16 space-y-3">
            <Cloud className="w-12 h-12 text-muted-foreground mx-auto opacity-20" />
            <p className="text-muted-foreground italic font-serif">{error}</p>
            <button onClick={() => fetchData()} className="text-xs font-bold text-primary hover:underline">
              Tentar novamente
            </button>
          </div>
        ) : (
          <div className="relative">
            {/* Liturgy Header */}
            <div className="text-center space-y-4 pb-8 border-b border-border">
              {liturgy && (
                <span className="text-[9px] font-black uppercase tracking-[0.25em] text-muted-foreground">
                  {SEASON_NAMES[liturgy.season] || liturgy.season} · Semana {liturgy.season_week}
                </span>
              )}
              <h2 className="text-2xl md:text-4xl font-display font-bold text-foreground tracking-tight leading-tight">
                {readings?.liturgia || liturgy?.celebrations?.[0]?.title || 'Liturgia do Dia'}
              </h2>
              <div className="flex flex-col items-center gap-3">
                <p className="text-sm text-muted-foreground font-serif italic">{readings?.data || liturgy?.date}</p>
                {readings?.cor && (
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-secondary border border-border">
                    <div className={`w-2.5 h-2.5 rounded-full ring-2 ${COLOUR_MAP[readings.cor.toLowerCase()] || 'bg-muted ring-muted/20'}`} />
                    <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">
                      {readings.cor}
                    </span>
                  </div>
                )}
                <ShareButton
                  title={readings?.liturgia || 'Liturgia do Dia'}
                  text={`${readings?.liturgia || 'Liturgia do Dia'} — ${readings?.data || ''} — Cathedra Digital`}
                  variant="button"
                />
              </div>
            </div>

            {/* Readings */}
            {readings ? (
              <div className="space-y-12 pt-10">
                <ReadingBlock
                  label="Primeira Leitura"
                  numeral="I"
                  reference={readings.primeiraLeitura.referencia}
                  title={readings.primeiraLeitura.titulo}
                  text={readings.primeiraLeitura.texto}
                  fontBody={fc.body}
                  fontTitle={fc.title}
                  lineSpacing={lc}
                />

                <PsalmBlock
                  reference={readings.salmo.referencia}
                  refrain={readings.salmo.refrao}
                  text={readings.salmo.texto}
                  fontPsalm={fc.psalm}
                  fontBody={fc.body}
                  lineSpacing={lc}
                />

                {readings.segundaLeitura && typeof readings.segundaLeitura === 'object' && (
                  <ReadingBlock
                    label="Segunda Leitura"
                    numeral="II"
                    reference={readings.segundaLeitura.referencia}
                    title={readings.segundaLeitura.titulo}
                    text={readings.segundaLeitura.texto}
                    fontBody={fc.body}
                    fontTitle={fc.title}
                    lineSpacing={lc}
                  />
                )}

                <GospelBlock
                  reference={readings.evangelho.referencia}
                  title={readings.evangelho.titulo}
                  text={readings.evangelho.texto}
                  fontGospel={fc.gospel}
                  fontTitle={fc.title}
                  lineSpacing={lc}
                />

                {/* AI Meditation */}
                <section className="pt-10 border-t border-border space-y-6">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-xl bg-accent text-accent-foreground flex items-center justify-center shadow-md shadow-accent/20 shrink-0">
                        <Brain className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="text-[9px] font-black uppercase tracking-[0.25em] text-muted-foreground">Meditação Diária</h3>
                        <p className="text-xs text-foreground/50">Nexus Theologicus</p>
                      </div>
                    </div>
                    
                    {!meditation && !isMeditationLoading && (
                      <button 
                        onClick={fetchMeditation}
                        className="px-5 py-2 bg-accent text-accent-foreground rounded-lg text-[10px] font-black uppercase tracking-widest hover:opacity-90 transition-all shadow-sm flex items-center gap-2 self-start md:self-center"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        Gerar Meditação
                      </button>
                    )}
                  </div>

                  {isMeditationLoading ? (
                    <div className="bg-secondary/50 p-6 md:p-10 rounded-2xl border border-border space-y-3">
                      <div className="flex items-center gap-2 mb-4">
                        <div className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" />
                        <div className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce [animation-delay:0.2s]" />
                        <div className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce [animation-delay:0.4s]" />
                        <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground ml-2">Meditando...</span>
                      </div>
                      <div className="h-4 bg-muted rounded animate-pulse w-full" />
                      <div className="h-4 bg-muted rounded animate-pulse w-[90%]" />
                      <div className="h-4 bg-muted rounded animate-pulse w-[95%]" />
                    </div>
                  ) : meditation ? (
                    <div className="bg-secondary/30 p-6 md:p-10 rounded-2xl border border-border relative overflow-hidden">
                      <div className="absolute top-0 right-0 p-6 opacity-[0.03] pointer-events-none">
                        <Brain className="w-24 h-24 rotate-12" />
                      </div>
                      <div className="prose dark:prose-invert max-w-none reader-text prose-p:text-base prose-p:leading-[1.9] prose-headings:font-display prose-headings:font-bold prose-p:text-foreground/90 prose-strong:text-primary">
                        <ReactMarkdown>{meditation}</ReactMarkdown>
                      </div>
                      <div className="mt-6 pt-6 border-t border-border flex items-center justify-between">
                        <p className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground/40 italic">
                          Gerado por Colloquium AI
                        </p>
                        <button 
                          onClick={() => { setMeditation(null); fetchMeditation(); }}
                          className="text-[9px] font-black uppercase tracking-widest text-primary hover:text-primary/80 transition-colors"
                        >
                          Regerar
                        </button>
                      </div>
                    </div>
                  ) : null}
                </section>

                {/* Collect Prayer */}
                {readings.dia && (
                  <section className="pt-10 border-t border-border space-y-4">
                    <div className="flex items-center gap-2 justify-center md:justify-start">
                      <Sparkles className="w-4 h-4 text-primary/40" />
                      <h3 className="text-[9px] font-black uppercase tracking-[0.25em] text-muted-foreground">Oração do Dia</h3>
                    </div>
                    <div className="p-6 md:p-8 bg-secondary/50 rounded-2xl border border-border">
                      <p className="reader-text text-base md:text-lg text-foreground/80 italic leading-[1.9] text-center">"{readings.dia}"</p>
                    </div>
                  </section>
                )}
              </div>
            ) : (
              <div className="space-y-6 pt-10">
                <h3 className="text-[9px] font-black uppercase tracking-[0.25em] text-muted-foreground text-center">Celebrações de Hoje</h3>
                <div className="grid gap-3 max-w-2xl mx-auto">
                  {liturgy?.celebrations?.map((c, i) => (
                    <div key={i} className="flex items-center gap-4 p-5 bg-secondary/30 rounded-xl border border-border group hover:bg-card hover:shadow-md transition-all">
                      <div className={`w-10 h-10 rounded-lg ring-4 shrink-0 flex items-center justify-center shadow ${COLOUR_MAP[c.colour.toLowerCase()] || 'bg-muted ring-muted/10'}`}>
                        <Cross className={`w-5 h-5 ${c.colour.toLowerCase() === 'white' ? 'text-primary' : 'text-white'}`} />
                      </div>
                      <div className="flex-1">
                        <p className="font-serif font-bold text-foreground group-hover:text-primary transition-colors leading-tight">{c.title}</p>
                        <p className="text-[9px] text-muted-foreground uppercase tracking-widest font-black mt-0.5">{c.rank}</p>
                      </div>
                      <span className="text-[8px] font-black uppercase tracking-widest text-primary bg-primary/10 px-2 py-0.5 rounded-full">{c.colour}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default DailyLiturgy;
