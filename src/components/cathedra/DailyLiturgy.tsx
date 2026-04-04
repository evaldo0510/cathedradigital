import React, { useState, useEffect } from 'react';
import { 
  Heart, 
  Search, 
  ArrowLeft, 
  ChevronRight, 
  BookOpen, 
  Star, 
  Flame, 
  Zap, 
  Sparkles,
  Music,
  Clock,
  Calendar,
  Activity,
  Cross,
  Feather,
  Sun,
  Book,
  Moon,
  Cloud,
  ChevronDown
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

  const categories = ['Todas', ...Array.from(new Set(PRAYERS.map(p => p.category)))];
  const filteredPrayers = prayerFilter === 'Todas' ? PRAYERS : PRAYERS.filter(p => p.category === prayerFilter);

  return (
    <div className="max-w-5xl mx-auto space-y-12 pb-12">
      <div className="text-center space-y-4 pt-4">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-primary/5 border border-primary/10 rounded-full">
          <Star className="w-4 h-4 text-primary" />
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">Hodie</span>
        </div>
        <h1 className="text-4xl md:text-6xl font-serif font-bold text-foreground tracking-tight">Liturgia & Orações</h1>
        <p className="text-lg text-muted-foreground font-serif italic max-w-2xl mx-auto">"Toda a Escritura é inspirada por Deus e útil para ensinar, para repreender, para corrigir e para instruir na justiça."</p>
      </div>

      {/* Tabs */}
      <div className="flex p-1.5 bg-primary/5 rounded-2xl max-w-sm mx-auto shadow-sm">
        {(['liturgia', 'oracoes'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`flex-1 px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
              tab === t ? 'bg-white text-primary shadow-xl' : 'text-muted-foreground hover:text-primary'
            }`}>
            {t === 'liturgia' ? 'Liturgia' : 'Orações'}
          </button>
        ))}
      </div>

      {tab === 'liturgia' ? (
        <div className="space-y-8 animate-in fade-in duration-700">
          <div className="bg-card border border-border rounded-[3rem] p-8 md:p-16 space-y-12 shadow-2xl shadow-black/[0.02] relative overflow-hidden">
            <div className="absolute top-0 right-0 p-12 opacity-[0.02] pointer-events-none">
              <Sun className="w-64 h-64 -mr-16 -mt-16 rotate-12" />
            </div>

            {isLoading ? (
              <div className="space-y-8 py-12">
                <div className="flex flex-col items-center gap-4">
                  <div className="h-4 w-32 bg-primary/10 rounded animate-pulse" />
                  <div className="h-10 w-64 bg-primary/10 rounded animate-pulse" />
                  <div className="h-4 w-40 bg-primary/10 rounded animate-pulse" />
                </div>
                <div className="space-y-6">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="space-y-4">
                      <div className="h-6 w-48 bg-primary/5 rounded animate-pulse" />
                      <div className="h-24 w-full bg-primary/5 rounded animate-pulse" />
                    </div>
                  ))}
                </div>
              </div>
            ) : error ? (
              <div className="text-center py-20 space-y-4">
                <Cloud className="w-16 h-16 text-muted-foreground mx-auto opacity-20" />
                <p className="text-muted-foreground italic font-serif text-lg">{error}</p>
              </div>
            ) : (
              <div className="relative">
                <div className="text-center space-y-6 pb-12 border-b border-border/50">
                  {liturgy && (
                    <div className="flex flex-col items-center gap-2">
                      <span className="text-[10px] font-black uppercase tracking-[0.2em] text-primary/60">
                        {SEASON_NAMES[liturgy.season] || liturgy.season} — Semana {liturgy.season_week}
                      </span>
                      <div className="w-8 h-1 bg-primary/20 rounded-full" />
                    </div>
                  )}
                  <h2 className="text-3xl md:text-5xl font-serif font-bold text-foreground tracking-tight leading-tight">
                    {readings?.liturgia || liturgy?.celebrations?.[0]?.title || 'Liturgia do Dia'}
                  </h2>
                  <div className="flex flex-col items-center gap-4">
                    <p className="text-lg text-muted-foreground font-serif italic">{readings?.data || liturgy?.date}</p>
                    {readings?.cor && (
                      <div className="inline-flex items-center gap-3 px-4 py-2 rounded-2xl bg-primary/5 border border-primary/10">
                        <div className={`w-3 h-3 rounded-full ring-4 ${COLOUR_MAP[readings.cor.toLowerCase()] || 'bg-muted ring-muted/20'}`} />
                        <span className="text-[10px] font-black uppercase tracking-widest text-primary">
                          Cor Litúrgica: {readings.cor}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Readings Section */}
                {readings ? (
                  <div className="space-y-16 pt-12">
                    {/* Primeira Leitura */}
                    <section className="space-y-6">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-primary text-primary-foreground flex items-center justify-center font-serif font-bold text-xl shadow-lg shadow-primary/20 shrink-0">I</div>
                        <div className="space-y-1">
                          <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-primary/40">Primeira Leitura</h3>
                          <p className="text-sm font-bold text-foreground opacity-60 tracking-tight">{readings.primeiraLeitura.referencia}</p>
                        </div>
                      </div>
                      <div className="md:pl-16 space-y-4">
                        <p className="font-serif italic text-xl text-muted-foreground border-l-4 border-primary/20 pl-6 py-2">{readings.primeiraLeitura.titulo}</p>
                        <p className="font-serif leading-relaxed text-xl md:text-2xl text-foreground/90 whitespace-pre-wrap">{readings.primeiraLeitura.texto}</p>
                      </div>
                    </section>

                    {/* Salmo */}
                    <section className="space-y-6">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center font-serif font-bold text-xl shrink-0 border border-primary/20">Ps</div>
                        <div className="space-y-1">
                          <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-primary/40">Salmo Responsorial</h3>
                          <p className="text-sm font-bold text-foreground opacity-60 tracking-tight">{readings.salmo.referencia}</p>
                        </div>
                      </div>
                      <div className="md:pl-16 space-y-6 bg-primary/5 rounded-[2.5rem] p-8 md:p-12 border border-primary/10 relative overflow-hidden">
                        <Music className="absolute -top-3 -right-3 w-10 h-10 text-primary/10 rotate-12" />
                        <div className="space-y-6 text-center md:text-left">
                          <p className="font-serif font-bold text-2xl text-primary leading-tight">R. {readings.salmo.refrao}</p>
                          <p className="font-serif leading-relaxed text-xl md:text-2xl text-foreground/80 whitespace-pre-wrap italic">"{readings.salmo.texto}"</p>
                        </div>
                      </div>
                    </section>

                    {/* Segunda Leitura (if exists) */}
                    {readings.segundaLeitura && typeof readings.segundaLeitura === 'object' && (
                      <section className="space-y-6">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-2xl bg-primary text-primary-foreground flex items-center justify-center font-serif font-bold text-xl shadow-lg shadow-primary/20 shrink-0">II</div>
                          <div className="space-y-1">
                            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-primary/40">Segunda Leitura</h3>
                            <p className="text-sm font-bold text-foreground opacity-60 tracking-tight">{readings.segundaLeitura.referencia}</p>
                          </div>
                        </div>
                        <div className="md:pl-16 space-y-4">
                          <p className="font-serif italic text-xl text-muted-foreground border-l-4 border-primary/20 pl-6 py-2">{readings.segundaLeitura.titulo}</p>
                          <p className="font-serif leading-relaxed text-xl md:text-2xl text-foreground/90 whitespace-pre-wrap">{readings.segundaLeitura.texto}</p>
                        </div>
                      </section>
                    )}

                    {/* Evangelho */}
                    <section className="space-y-6">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-amber-400 text-amber-950 flex items-center justify-center font-serif font-bold text-xl shadow-lg shadow-amber-400/20 shrink-0">Ev</div>
                        <div className="space-y-1">
                          <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-amber-600/60">Evangelho</h3>
                          <p className="text-sm font-bold text-foreground opacity-60 tracking-tight">{readings.evangelho.referencia}</p>
                        </div>
                      </div>
                      <div className="md:pl-16 space-y-6">
                        <p className="font-serif italic text-xl text-muted-foreground border-l-4 border-amber-400/30 pl-6 py-2">{readings.evangelho.titulo}</p>
                        <div className="bg-amber-400/5 p-10 md:p-14 rounded-[3rem] border border-amber-400/10 shadow-xl shadow-amber-400/5">
                          <p className="font-serif leading-relaxed text-2xl md:text-3xl text-foreground/95 whitespace-pre-wrap font-bold text-center">
                            {readings.evangelho.texto}
                          </p>
                        </div>
                      </div>
                    </section>

                    {/* Oração do Dia */}
                    {readings.dia && (
                      <section className="pt-12 border-t border-border/50 space-y-6">
                        <div className="flex items-center gap-3 justify-center md:justify-start">
                          <Sparkles className="w-5 h-5 text-primary/60" />
                          <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-primary/40">Oração do Dia (Coleta)</h3>
                        </div>
                        <div className="p-8 md:p-12 bg-primary/5 rounded-[2.5rem] border border-primary/10 shadow-sm">
                          <p className="font-serif text-lg md:text-xl text-foreground/80 italic leading-relaxed text-center italic leading-relaxed">"{readings.dia}"</p>
                        </div>
                      </section>
                    )}
                  </div>
                ) : (
                  <div className="space-y-8 pt-12">
                    <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-primary/40 text-center">Celebrações de Hoje</h3>
                    <div className="grid gap-4 max-w-2xl mx-auto">
                      {liturgy?.celebrations?.map((c, i) => (
                        <div key={i} className="flex items-center gap-6 p-8 bg-muted/30 rounded-[2rem] border border-border group hover:bg-white hover:shadow-xl transition-all">
                          <div className={`w-12 h-12 rounded-2xl ring-8 shrink-0 flex items-center justify-center shadow-lg ${COLOUR_MAP[c.colour.toLowerCase()] || 'bg-muted ring-muted/10'}`}>
                            <Cross className={`w-6 h-6 ${c.colour.toLowerCase() === 'white' ? 'text-primary' : 'text-white'}`} />
                          </div>
                          <div className="flex-1 space-y-1">
                            <p className="text-xl font-serif font-bold text-foreground group-hover:text-primary transition-colors leading-tight">{c.title}</p>
                            <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-black opacity-60">{c.rank}</p>
                          </div>
                          <span className="text-[8px] font-black uppercase tracking-widest text-primary bg-primary/10 px-3 py-1 rounded-full">{c.colour}</span>
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
        <div className="space-y-8 animate-in fade-in duration-700">
          {/* Prayer category filter */}
          <div className="flex gap-2 flex-wrap justify-center px-4">
            {categories.map(c => (
              <button key={c} onClick={() => setPrayerFilter(c)}
                className={`px-5 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all border ${
                  prayerFilter === c 
                    ? 'bg-primary border-primary text-white shadow-xl' 
                    : 'bg-card border-border text-muted-foreground hover:border-primary/40 hover:text-primary'
                }`}>
                {c}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 px-4">
            {filteredPrayers.map(prayer => (
              <div key={prayer.id} className={`group bg-card border border-border rounded-[2rem] overflow-hidden transition-all hover:shadow-2xl hover:-translate-y-1 ${selectedPrayer === prayer.id ? 'border-primary/40 shadow-xl' : 'hover:border-primary/20'}`}>
                <button
                  onClick={() => setSelectedPrayer(selectedPrayer === prayer.id ? null : prayer.id)}
                  className="w-full flex items-center justify-between p-8 text-left transition-all"
                >
                  <div className="space-y-1">
                    <p className="text-xl font-serif font-bold text-foreground group-hover:text-primary transition-colors leading-tight">{prayer.title}</p>
                    <p className="text-xs text-muted-foreground font-serif italic opacity-60">{prayer.latin}</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="hidden sm:inline-block text-[8px] font-black uppercase tracking-widest text-primary bg-primary/5 px-2 py-1 rounded-lg border border-primary/10">{prayer.category}</span>
                    <div className={`p-2 rounded-xl transition-all ${selectedPrayer === prayer.id ? 'bg-primary text-white rotate-180' : 'bg-muted text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary'}`}>
                      <ChevronDown className="w-4 h-4" />
                    </div>
                  </div>
                </button>
                {selectedPrayer === prayer.id && (
                  <div className="px-8 pb-8 pt-0 animate-in slide-in-from-top-4 duration-500">
                    <div className="p-8 bg-primary/5 rounded-[1.5rem] border border-primary/10 relative">
                      <Sparkles className="absolute top-4 right-4 w-6 h-6 text-primary/10" />
                      <p className="font-serif leading-relaxed text-xl text-foreground/90 whitespace-pre-wrap">{prayer.text}</p>
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