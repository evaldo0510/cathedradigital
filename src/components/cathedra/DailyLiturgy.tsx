import React, { useState, useEffect } from 'react';
import { Icons } from '../../constants';
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
  green: 'bg-emerald-500',
  violet: 'bg-violet-600',
  white: 'bg-amber-100 border border-amber-300',
  red: 'bg-red-600',
  rose: 'bg-pink-400',
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
];

const DailyLiturgy: React.FC = () => {
  const [liturgy, setLiturgy] = useState<LiturgicalDay | null>(null);
  const [readings, setReadings] = useState<LiturgyReadings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
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
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary/10 rounded-full">
          <Icons.Star className="w-4 h-4 text-primary" />
          <span className="text-[9px] font-black uppercase tracking-[0.2em] text-primary">Hodie</span>
        </div>
        <h1 className="text-3xl md:text-5xl font-serif font-bold text-foreground">Liturgia & Orações</h1>
        <p className="text-muted-foreground font-serif italic">O dia litúrgico e as orações da tradição católica.</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 justify-center">
        {(['liturgia', 'oracoes'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
              tab === t ? 'bg-foreground text-background shadow-lg' : 'bg-card border border-border text-muted-foreground hover:text-foreground'
            }`}>
            {t === 'liturgia' ? 'Liturgia do Dia' : 'Orações'}
          </button>
        ))}
      </div>

      {tab === 'liturgia' ? (
        <div className="space-y-6">
          <div className="bg-card border border-border rounded-3xl p-8 md:p-12 space-y-8">
            {isLoading ? (
              <div className="space-y-4 py-8">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="h-6 bg-muted rounded animate-pulse" style={{ width: `${50 + Math.random() * 50}%` }} />
                ))}
              </div>
            ) : error ? (
              <p className="text-muted-foreground italic text-center py-12">{error}</p>
            ) : (
              <>
                <div className="text-center space-y-4 pb-8 border-b border-border">
                  {liturgy && (
                    <p className="text-[9px] font-black uppercase tracking-[0.2em] text-primary">
                      {SEASON_NAMES[liturgy.season] || liturgy.season} — Semana {liturgy.season_week}
                    </p>
                  )}
                  <h2 className="text-2xl md:text-3xl font-serif font-bold text-foreground">
                    {readings?.liturgia || liturgy?.celebrations?.[0]?.title || 'Liturgia do Dia'}
                  </h2>
                  <p className="text-sm text-muted-foreground italic">{readings?.data || liturgy?.date}</p>
                  {readings?.cor && (
                    <div className="flex justify-center gap-2">
                      <span className="text-[10px] font-black uppercase tracking-widest text-primary bg-primary/10 px-3 py-1 rounded-full">
                        Cor: {readings.cor}
                      </span>
                    </div>
                  )}
                </div>

                {/* Readings Section */}
                {readings ? (
                  <div className="space-y-12">
                    {/* Primeira Leitura */}
                    <section className="space-y-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs">I</div>
                        <h3 className="text-sm font-black uppercase tracking-widest text-muted-foreground">Primeira Leitura ({readings.primeiraLeitura.referencia})</h3>
                      </div>
                      <div className="pl-11 space-y-2">
                        <p className="font-serif italic text-muted-foreground">{readings.primeiraLeitura.titulo}</p>
                        <p className="reader-text text-foreground/90 leading-relaxed text-xl md:text-2xl whitespace-pre-wrap">{readings.primeiraLeitura.texto}</p>
                      </div>
                    </section>

                    {/* Salmo */}
                    <section className="space-y-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs">Ps</div>
                        <h3 className="text-sm font-black uppercase tracking-widest text-muted-foreground">Salmo Responsorial ({readings.salmo.referencia})</h3>
                      </div>
                      <div className="pl-11 space-y-4">
                        <p className="font-serif font-bold text-primary italic">R. {readings.salmo.refrao}</p>
                        <p className="reader-text text-foreground/90 leading-relaxed text-xl md:text-2xl whitespace-pre-wrap italic">{readings.salmo.texto}</p>
                      </div>
                    </section>

                    {/* Segunda Leitura (if exists) */}
                    {readings.segundaLeitura && typeof readings.segundaLeitura === 'object' && (
                      <section className="space-y-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs">II</div>
                          <h3 className="text-sm font-black uppercase tracking-widest text-muted-foreground">Segunda Leitura ({readings.segundaLeitura.referencia})</h3>
                        </div>
                        <div className="pl-11 space-y-2">
                          <p className="font-serif italic text-muted-foreground">{readings.segundaLeitura.titulo}</p>
                          <p className="reader-text text-foreground/90 leading-relaxed text-xl md:text-2xl whitespace-pre-wrap">{readings.segundaLeitura.texto}</p>
                        </div>
                      </section>
                    )}

                    {/* Evangelho */}
                    <section className="space-y-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs">Ev</div>
                        <h3 className="text-sm font-black uppercase tracking-widest text-muted-foreground">Evangelho ({readings.evangelho.referencia})</h3>
                      </div>
                      <div className="pl-11 space-y-2">
                        <p className="font-serif italic text-muted-foreground">{readings.evangelho.titulo}</p>
                        <p className="reader-text text-foreground/90 leading-relaxed text-xl md:text-2xl whitespace-pre-wrap font-bold">{readings.evangelho.texto}</p>
                      </div>
                    </section>

                    {/* Oração do Dia */}
                    {readings.dia && (
                      <section className="pt-8 border-t border-border space-y-4">
                        <h3 className="text-sm font-black uppercase tracking-widest text-muted-foreground">Oração do Dia (Coleta)</h3>
                        <div className="p-6 bg-muted/30 rounded-2xl border border-border">
                          <p className="reader-text text-foreground/80 italic leading-relaxed">{readings.dia}</p>
                        </div>
                      </section>
                    )}
                  </div>
                ) : (
                  <div className="space-y-4">
                    <h3 className="text-xs font-black uppercase tracking-widest text-muted-foreground">Celebrações</h3>
                    {liturgy?.celebrations?.map((c, i) => (
                      <div key={i} className="flex items-start gap-4 p-4 bg-muted/50 rounded-2xl border border-border">
                        <div className={`w-4 h-4 rounded-full mt-1 shrink-0 ${COLOUR_MAP[c.colour] || 'bg-muted'}`} />
                        <div className="flex-1">
                          <p className="font-bold text-foreground">{c.title}</p>
                          <p className="text-sm text-muted-foreground">{c.rank}</p>
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-widest text-primary bg-primary/10 px-2 py-1 rounded-lg">{c.colour}</span>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Prayer category filter */}
          <div className="flex gap-2 flex-wrap justify-center">
            {categories.map(c => (
              <button key={c} onClick={() => setPrayerFilter(c)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                  prayerFilter === c ? 'bg-primary text-primary-foreground' : 'bg-card border border-border text-muted-foreground hover:text-foreground'
                }`}>
                {c}
              </button>
            ))}
          </div>

          <div className="grid gap-4">
            {filteredPrayers.map(prayer => (
              <div key={prayer.id} className="bg-card border border-border rounded-2xl overflow-hidden">
                <button
                  onClick={() => setSelectedPrayer(selectedPrayer === prayer.id ? null : prayer.id)}
                  className="w-full flex items-center justify-between p-5 text-left hover:bg-muted/50 transition-all"
                >
                  <div>
                    <p className="font-bold text-foreground">{prayer.title}</p>
                    <p className="text-xs text-muted-foreground italic">{prayer.latin}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black uppercase tracking-widest text-primary bg-primary/10 px-2 py-1 rounded-lg">{prayer.category}</span>
                    <Icons.ArrowDown className={`w-4 h-4 text-muted-foreground transition-transform ${selectedPrayer === prayer.id ? 'rotate-180' : ''}`} />
                  </div>
                </button>
                {selectedPrayer === prayer.id && (
                  <div className="px-5 pb-5 pt-0">
                    <div className="p-5 bg-muted/50 rounded-xl border border-border">
                      <p className="reader-text text-foreground/90 leading-[2] text-sm">{prayer.text}</p>
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