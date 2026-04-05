import React, { useState, useEffect } from 'react';
import ShareButton from './ShareButton';
import ReactMarkdown from 'react-markdown';
import { 
  Star, 
  Sparkles,
  Music,
  Cross,
  Sun,
  Cloud,
  ChevronDown,
  Brain
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface Celebration {
  title: string;
  colour: string;
  rank: string;
  rank_num?: number;
}

interface LiturgicalDay {
  date: string;
  season: string;
  season_week: number;
  celebrations: Celebration[];
  weekday?: string;
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

const PRAYERS = [
  { id: '1', title: 'Pai Nosso', latin: 'Pater Noster', text: 'Pai nosso que estais no céu, santificado seja o vosso nome. Venha a nós o vosso reino. Seja feita a vossa vontade, assim na terra como no céu. O pão nosso de cada dia nos dai hoje. Perdoai-nos as nossas ofensas, assim como nós perdoamos a quem nos tem ofendido. E não nos deixeis cair em tentação, mas livrai-nos do mal. Amém.', category: 'Essencial' },
  { id: '2', title: 'Ave Maria', latin: 'Ave Maria', text: 'Ave Maria, cheia de graça, o Senhor é convosco. Bendita sois vós entre as mulheres, e bendito é o fruto do vosso ventre, Jesus. Santa Maria, Mãe de Deus, rogai por nós pecadores, agora e na hora da nossa morte. Amém.', category: 'Essencial' },
  { id: '3', title: 'Glória ao Pai', latin: 'Gloria Patri', text: 'Glória ao Pai, ao Filho e ao Espírito Santo. Como era no princípio, agora e sempre. Amém.', category: 'Essencial' },
  { id: '4', title: 'Credo Apostólico', latin: 'Symbolum Apostolorum', text: 'Creio em Deus Pai todo-poderoso, criador do céu e da terra. E em Jesus Cristo, seu único Filho, nosso Senhor, que foi concebido pelo poder do Espírito Santo, nasceu da Virgem Maria, padeceu sob Pôncio Pilatos, foi crucificado, morto e sepultado. Desceu à mansão dos mortos; ressuscitou ao terceiro dia; subiu aos céus; está sentado à direita de Deus Pai todo-poderoso, de onde há de vir a julgar os vivos e os mortos. Creio no Espírito Santo, na santa Igreja Católica, na comunhão dos santos, na remissão dos pecados, na ressurreição da carne, na vida eterna. Amém.', category: 'Essencial' },
  { id: '5', title: 'Salve Rainha', latin: 'Salve Regina', text: 'Salve, Rainha, Mãe de misericórdia, vida, doçura, esperança nossa, salve! A vós bradamos, os degredados filhos de Eva. A vós suspiramos, gemendo e chorando neste vale de lágrimas. Eia, pois, advogada nossa, esses vossos olhos misericordiosos a nós volvei. E depois deste desterro, mostrai-nos Jesus, bendito fruto do vosso ventre. Ó clemente, ó piedosa, ó doce sempre Virgem Maria. Rogai por nós, santa Mãe de Deus, para que sejamos dignos das promessas de Cristo. Amém.', category: 'Mariana' },
  { id: '6', title: 'Ato de Contrição', latin: 'Actus Contritionis', text: 'Meu Deus, eu me arrependo de todo o coração de vos ter ofendido, porque sois infinitamente bom e amável e o pecado vos desagrada. Proponho firmemente, com o auxílio da vossa graça, não mais vos ofender e fugir das ocasiões de pecado. Amém.', category: 'Penitencial' },
  { id: '7', title: 'Oração de São Miguel', latin: 'Sancte Michael', text: 'São Miguel Arcanjo, defendei-nos no combate, sede o nosso refúgio contra as maldades e ciladas do demônio. Ordene-lhe Deus, instantemente o pedimos, e vós, príncipe da milícia celeste, pelo divino poder, precipitai no inferno a satanás e aos outros espíritos malignos que vagueiam pelo mundo para perdição das almas. Amém.', category: 'Proteção' },
  { id: '8', title: 'Angelus', latin: 'Angelus Domini', text: 'O Anjo do Senhor anunciou a Maria. E ela concebeu do Espírito Santo. Ave Maria... Eis aqui a serva do Senhor. Faça-se em mim segundo a vossa palavra. Ave Maria... E o Verbo se fez carne. E habitou entre nós. Ave Maria... Rogai por nós, Santa Mãe de Deus. Para que sejamos dignos das promessas de Cristo. Derramai, Senhor, a vossa graça em nossas almas, para que nós, que pelo anúncio do Anjo conhecemos a Encarnação de Cristo, vosso Filho, pela sua Paixão e Cruz sejamos levados à glória da Ressurreição. Por Cristo, nosso Senhor. Amém.', category: 'Devocional' },
  { id: '9', title: 'Vinde Espírito Santo', latin: 'Veni Sancte Spiritus', text: 'Vinde, Espírito Santo, enchei os corações dos vossos fiéis e acendei neles o fogo do vosso amor. Enviai o vosso Espírito e tudo será criado e renovareis a face da terra. Oremos: Ó Deus, que instruístes os corações dos vossos fiéis com a luz do Espírito Santo, fazei que apreciemos retamente todas as coisas segundo o mesmo Espírito e gozemos sempre da sua consolação. Por Cristo, Senhor nosso. Amém.', category: 'Espírito Santo' },
  { id: '10', title: 'Oração de São Bento', latin: 'Oratio Sancti Benedicti', text: 'A Cruz sagrada seja a minha luz, não seja o dragão o meu guia. Retira-te, satanás, nunca me aconselhes coisas vãs. É mau o que tu me ofereces, bebe tu mesmo o teu veneno. Amém.', category: 'Proteção' },
  { id: '11', title: 'Alma de Cristo', latin: 'Anima Christi', text: 'Alma de Cristo, santificai-me. Corpo de Cristo, salvai-me. Sangue de Cristo, inebriai-me. Água do lado de Cristo, lavai-me. Paixão de Cristo, confortai-me. Ó bom Jesus, ouvi-me. Dentro das vossas chagas, escondei-me. Não permitais que me separe de Vós. Do espírito maligno, defendei-me. Na hora da minha morte, chamai-me e mandai-me ir para Vós, para que com os vossos Santos Vos louve, por todos os séculos dos séculos. Amém.', category: 'Eucarística' },
];

/* ─── Reading Block ─── */
const ReadingBlock: React.FC<{
  label: string;
  numeral: string;
  reference: string;
  title: string;
  text: string;
  accent?: 'primary' | 'gold';
  fontBody?: string;
  fontTitle?: string;
  lineSpacing?: string;
}> = ({ label, numeral, reference, title, text, accent = 'primary', fontBody = 'text-[15px] md:text-lg', fontTitle = 'text-base md:text-lg', lineSpacing = 'leading-[2] md:leading-[2.1]' }) => {
  const isGold = accent === 'gold';
  return (
    <section className="space-y-5">
      <div className="flex items-center gap-4">
        <div className={`w-11 h-11 rounded-xl flex items-center justify-center font-display text-sm tracking-wider shadow-md shrink-0 ${
          isGold ? 'bg-primary text-primary-foreground shadow-primary/20' : 'bg-accent text-accent-foreground shadow-accent/20'
        }`}>
          {numeral}
        </div>
        <div>
          <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">{label}</h3>
          <p className="text-sm font-semibold text-foreground/60 mt-0.5">{reference}</p>
        </div>
      </div>
      <div className="ml-0 md:ml-[3.75rem] space-y-4">
        <p className={`reader-text italic ${fontTitle} text-muted-foreground border-l-2 border-primary/20 pl-5 py-1.5`}>{title}</p>
        <p className={`reader-text ${fontBody} ${lineSpacing} text-foreground/90 whitespace-pre-wrap tracking-[0.005em]`}>{text}</p>
      </div>
    </section>
  );
};

/* ─── Psalm Block ─── */
const PsalmBlock: React.FC<{
  reference: string;
  refrain: string;
  text: string;
  fontPsalm?: string;
  fontBody?: string;
  lineSpacing?: string;
}> = ({ reference, refrain, text, fontPsalm = 'text-lg md:text-xl', fontBody = 'text-[15px] md:text-lg', lineSpacing = 'leading-[2] md:leading-[2.1]' }) => (
  <section className="space-y-5">
    <div className="flex items-center gap-4">
      <div className="w-11 h-11 rounded-xl bg-secondary text-primary flex items-center justify-center font-display text-sm tracking-wider border border-border shrink-0">
        Ps
      </div>
      <div>
        <h3 className="text-[9px] font-black uppercase tracking-[0.25em] text-muted-foreground">Salmo Responsorial</h3>
        <p className="text-xs font-semibold text-foreground/60 mt-0.5">{reference}</p>
      </div>
    </div>
    <div className="ml-0 md:ml-[3.75rem] bg-secondary/50 rounded-2xl p-5 md:p-8 border border-border relative overflow-hidden">
      <Music className="absolute -top-2 -right-2 w-8 h-8 text-primary/5 rotate-12" />
      <p className={`font-display ${fontPsalm} text-primary leading-snug mb-5`}>℟ {refrain}</p>
      <p className={`reader-text ${fontBody} ${lineSpacing} text-foreground/80 whitespace-pre-wrap italic tracking-[0.005em]`}>{text}</p>
    </div>
  </section>
);

/* ─── Gospel Block ─── */
const GospelBlock: React.FC<{
  reference: string;
  title: string;
  text: string;
  fontGospel?: string;
  fontTitle?: string;
  lineSpacing?: string;
}> = ({ reference, title, text, fontGospel = 'text-[16px] md:text-xl', fontTitle = 'text-base md:text-lg', lineSpacing = 'leading-[2] md:leading-[2.1]' }) => (
  <section className="space-y-5">
    <div className="flex items-center gap-4">
      <div className="w-11 h-11 rounded-xl bg-primary text-primary-foreground flex items-center justify-center font-display text-sm tracking-wider shadow-md shadow-primary/20 shrink-0">
        Ev
      </div>
      <div>
        <h3 className="text-[9px] font-black uppercase tracking-[0.25em] text-primary">Evangelho</h3>
        <p className="text-xs font-semibold text-foreground/60 mt-0.5">{reference}</p>
      </div>
    </div>
    <div className="ml-0 md:ml-[3.75rem] space-y-4">
      <p className={`reader-text italic ${fontTitle} text-muted-foreground border-l-2 border-primary/30 pl-5 py-1.5`}>{title}</p>
      <div className="bg-primary/5 p-5 md:p-10 rounded-2xl border border-primary/10">
        <p className={`reader-text ${fontGospel} ${lineSpacing} text-foreground/95 whitespace-pre-wrap text-center tracking-[0.005em]`}>{text}</p>
      </div>
    </div>
  </section>
);

type FontSize = 'P' | 'M' | 'G';
type LineSpacing = 'compact' | 'normal' | 'relaxed';
const FONT_SIZE_KEY = 'cathedra_font_size';
const LINE_SPACING_KEY = 'cathedra_line_spacing';
const FONT_CLASSES: Record<FontSize, { body: string; title: string; psalm: string; gospel: string }> = {
  P: { body: 'text-[14px] md:text-base', title: 'text-sm md:text-base', psalm: 'text-base md:text-lg', gospel: 'text-[14px] md:text-lg' },
  M: { body: 'text-[16px] md:text-lg', title: 'text-base md:text-lg', psalm: 'text-lg md:text-xl', gospel: 'text-[16px] md:text-xl' },
  G: { body: 'text-[18px] md:text-xl', title: 'text-lg md:text-xl', psalm: 'text-xl md:text-2xl', gospel: 'text-[18px] md:text-2xl' },
};
const LINE_SPACING_CLASSES: Record<LineSpacing, string> = {
  compact: 'leading-[1.6] md:leading-[1.7]',
  normal: 'leading-[2] md:leading-[2.1]',
  relaxed: 'leading-[2.4] md:leading-[2.6]',
};

const DailyLiturgy: React.FC = () => {
  const [liturgy, setLiturgy] = useState<LiturgicalDay | null>(null);
  const [readings, setReadings] = useState<LiturgyReadings | null>(null);
  const [meditation, setMeditation] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isMeditationLoading, setIsMeditationLoading] = useState(false);
  const [error, setError] = useState('');
  const [tab, setTab] = useState<'liturgia' | 'oracoes'>('liturgia');
  const [selectedPrayer, setSelectedPrayer] = useState<string | null>(null);
  const [prayerFilter, setPrayerFilter] = useState('Todas');
  const [fontSize, setFontSize] = useState<FontSize>(() => {
    try { return (localStorage.getItem(FONT_SIZE_KEY) as FontSize) || 'M'; } catch { return 'M'; }
  });
  const [lineSpacing, setLineSpacing] = useState<LineSpacing>(() => {
    try { return (localStorage.getItem(LINE_SPACING_KEY) as LineSpacing) || 'normal'; } catch { return 'normal'; }
  });

  useEffect(() => {
    try { localStorage.setItem(FONT_SIZE_KEY, fontSize); } catch {}
  }, [fontSize]);

  useEffect(() => {
    try { localStorage.setItem(LINE_SPACING_KEY, lineSpacing); } catch {}
  }, [lineSpacing]);

  const fc = FONT_CLASSES[fontSize];
  const lc = LINE_SPACING_CLASSES[lineSpacing];

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const [calRes, readRes] = await Promise.all([
          supabase.functions.invoke('liturgical-calendar', {
            body: { action: 'today', lang: 'la', calendar: 'general-la' }
          }),
          supabase.functions.invoke('liturgical-calendar', {
            body: { action: 'readings' }
          })
        ]);

        if (calRes.data) setLiturgy(calRes.data);
        if (readRes.data) setReadings(readRes.data);

        if (!calRes.data && !readRes.data) {
          setError('Não foi possível carregar a liturgia do dia.');
        }
      } catch (err) {
        console.error('Error fetching liturgy:', err);
        setError('Erro ao carregar dados da liturgia.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

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
            } catch (e) {
              // Ignore parse errors for partial chunks
            }
          }
        }
      }
    } catch (err) {
      console.error('Error fetching meditation:', err);
      setError('Erro ao gerar meditação.');
    } finally {
      setIsMeditationLoading(false);
    }
  };

  const categories = ['Todas', ...Array.from(new Set(PRAYERS.map(p => p.category)))];
  const filteredPrayers = prayerFilter === 'Todas' ? PRAYERS : PRAYERS.filter(p => p.category === prayerFilter);

  return (
    <div className="max-w-4xl mx-auto space-y-10 pb-12">
      {/* Header */}
      <div className="text-center space-y-3 pt-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary/10 rounded-full">
          <Star className="w-3.5 h-3.5 text-primary" />
          <span className="text-[9px] font-black uppercase tracking-[0.2em] text-primary">Hodie</span>
        </div>
        <h1 className="text-3xl md:text-5xl font-display font-bold text-foreground tracking-tight">Liturgia & Orações</h1>
        <p className="text-base text-muted-foreground font-serif italic max-w-xl mx-auto leading-relaxed">
          "Toda a Escritura é inspirada por Deus e útil para ensinar, para repreender, para corrigir e para instruir na justiça."
        </p>
      </div>

      {/* Tabs */}
      <div className="flex p-1 bg-secondary rounded-xl max-w-xs mx-auto">
        {(['liturgia', 'oracoes'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`flex-1 px-5 py-2.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${
              tab === t ? 'bg-card text-primary shadow-md' : 'text-muted-foreground hover:text-primary'
            }`}>
            {t === 'liturgia' ? 'Liturgia' : 'Orações'}
          </button>
        ))}
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
            { key: 'compact' as LineSpacing, icon: '≡' },
            { key: 'normal' as LineSpacing, icon: '☰' },
            { key: 'relaxed' as LineSpacing, icon: '⋮' },
          ]).map(({ key, icon }) => (
            <button key={key} onClick={() => setLineSpacing(key)}
              className={`w-8 h-8 rounded-lg text-sm font-bold transition-all ${
                lineSpacing === key ? 'bg-primary text-primary-foreground shadow-md' : 'bg-secondary text-muted-foreground hover:text-primary border border-border'
              }`}>
              {icon}
            </button>
          ))}
        </div>
      </div>

      {tab === 'liturgia' ? (
        <div className="space-y-6 animate-in fade-in duration-500">
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
            ) : error ? (
              <div className="text-center py-16 space-y-3">
                <Cloud className="w-12 h-12 text-muted-foreground mx-auto opacity-20" />
                <p className="text-muted-foreground italic font-serif">{error}</p>
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
        </div>
      ) : (
        /* ─── Prayers Tab ─── */
        <div className="space-y-6 animate-in fade-in duration-500">
          <div className="flex gap-2 flex-wrap justify-center px-4">
            {categories.map(c => (
              <button key={c} onClick={() => setPrayerFilter(c)}
                className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all border ${
                  prayerFilter === c 
                    ? 'bg-primary border-primary text-primary-foreground shadow-md' 
                    : 'bg-card border-border text-muted-foreground hover:border-primary/40 hover:text-primary'
                }`}>
                {c}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 px-4">
            {filteredPrayers.map(prayer => (
              <div key={prayer.id} className={`group bg-card border rounded-xl overflow-hidden transition-all hover:shadow-lg ${
                selectedPrayer === prayer.id ? 'border-primary/40 shadow-md' : 'border-border hover:border-primary/20'
              }`}>
                <button
                  onClick={() => setSelectedPrayer(selectedPrayer === prayer.id ? null : prayer.id)}
                  className="w-full flex items-center justify-between p-5 text-left transition-all"
                >
                  <div>
                    <p className="font-display text-base font-bold text-foreground group-hover:text-primary transition-colors leading-tight">{prayer.title}</p>
                    <p className="text-xs text-muted-foreground font-serif italic mt-0.5">{prayer.latin}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="hidden sm:inline-block text-[8px] font-black uppercase tracking-widest text-primary bg-primary/5 px-2 py-0.5 rounded border border-primary/10">{prayer.category}</span>
                    <div className={`p-1.5 rounded-lg transition-all ${
                      selectedPrayer === prayer.id ? 'bg-primary text-primary-foreground rotate-180' : 'bg-secondary text-muted-foreground group-hover:text-primary'
                    }`}>
                      <ChevronDown className="w-4 h-4" />
                    </div>
                  </div>
                </button>
                {selectedPrayer === prayer.id && (
                  <div className="px-5 pb-5 pt-0 animate-in slide-in-from-top-4 duration-300">
                    <div className="p-5 bg-secondary/50 rounded-xl border border-border">
                      <p className={`reader-text ${lc} ${fc.body} text-foreground/90 whitespace-pre-wrap`}>{prayer.text}</p>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default DailyLiturgy;
