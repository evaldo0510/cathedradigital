import React, { useState, useMemo } from 'react';
import { Icons } from '../../constants';

interface Dogma {
  id: number;
  title: string;
  definition: string;
  source: string;
  year: number;
  category: string;
}

const CATEGORIES = ['Todos', 'Deus', 'Cristologia', 'Mariologia', 'Eclesiologia', 'Sacramentos', 'Escatologia', 'Antropologia'];

const DOGMAS: Dogma[] = [
  { id: 1, title: 'Existência de Deus', definition: 'A existência de Deus pode ser conhecida com certeza pela luz natural da razão humana, a partir das coisas criadas.', source: 'Concílio Vaticano I, Dei Filius', year: 1870, category: 'Deus' },
  { id: 2, title: 'Santíssima Trindade', definition: 'Há em Deus três Pessoas divinas: Pai, Filho e Espírito Santo. Cada uma das três Pessoas possui a essência divina inteira.', source: 'Concílio de Nicéia / Constantinopla', year: 325, category: 'Deus' },
  { id: 3, title: 'Criação ex nihilo', definition: 'Deus criou todas as coisas do nada (ex nihilo), livremente e por bondade.', source: 'Concílio Lateranense IV', year: 1215, category: 'Deus' },
  { id: 4, title: 'Divindade de Cristo', definition: 'Jesus Cristo é verdadeiro Deus e verdadeiro homem, com duas naturezas — divina e humana — unidas na única Pessoa do Verbo.', source: 'Concílio de Calcedônia', year: 451, category: 'Cristologia' },
  { id: 5, title: 'Encarnação do Verbo', definition: 'O Verbo se fez carne e habitou entre nós. O Filho de Deus assumiu a natureza humana no seio da Virgem Maria.', source: 'Concílio de Éfeso / Nicéia', year: 431, category: 'Cristologia' },
  { id: 6, title: 'Redenção pela Cruz', definition: 'Cristo morreu na cruz para a redenção de todos os homens, oferecendo-se como sacrifício ao Pai para a remissão dos pecados.', source: 'Concílio de Trento', year: 1545, category: 'Cristologia' },
  { id: 7, title: 'Ressurreição de Cristo', definition: 'Ao terceiro dia, Cristo ressuscitou dentre os mortos com seu próprio corpo glorificado.', source: 'Símbolo dos Apóstolos / Nicéia', year: 325, category: 'Cristologia' },
  { id: 8, title: 'Ascensão ao Céu', definition: 'Quarenta dias após a Ressurreição, Cristo subiu aos Céus em corpo e alma e está sentado à direita do Pai.', source: 'Símbolo Niceno-Constantinopolitano', year: 381, category: 'Cristologia' },
  { id: 9, title: 'Imaculada Conceição', definition: 'A Virgem Maria, no primeiro instante de sua conceição, foi preservada imune de toda mancha do pecado original.', source: 'Pio IX, Ineffabilis Deus', year: 1854, category: 'Mariologia' },
  { id: 10, title: 'Virgindade Perpétua de Maria', definition: 'Maria foi virgem antes, durante e depois do parto de Jesus Cristo.', source: 'Concílio de Latrão (649)', year: 649, category: 'Mariologia' },
  { id: 11, title: 'Maternidade Divina', definition: 'Maria é verdadeiramente Mãe de Deus (Theotókos), pois gerou segundo a carne o Verbo de Deus feito carne.', source: 'Concílio de Éfeso', year: 431, category: 'Mariologia' },
  { id: 12, title: 'Assunção de Maria', definition: 'A Virgem Maria, terminado o curso da vida terrena, foi assunta em corpo e alma à glória celestial.', source: 'Pio XII, Munificentissimus Deus', year: 1950, category: 'Mariologia' },
  { id: 13, title: 'Presença Real na Eucaristia', definition: 'Na Eucaristia, o pão e o vinho são convertidos no Corpo e Sangue de Cristo (transubstanciação). Cristo está verdadeira, real e substancialmente presente.', source: 'Concílio de Trento', year: 1551, category: 'Sacramentos' },
  { id: 14, title: 'Sete Sacramentos', definition: 'Os sacramentos da Nova Lei foram todos instituídos por Jesus Cristo e são sete: Batismo, Confirmação, Eucaristia, Penitência, Unção dos Enfermos, Ordem e Matrimônio.', source: 'Concílio de Trento', year: 1547, category: 'Sacramentos' },
  { id: 15, title: 'Necessidade do Batismo', definition: 'O Batismo é necessário para a salvação, ao menos em desejo (in voto), pois é a porta de entrada na Igreja e confere a graça santificante.', source: 'Concílio de Trento', year: 1547, category: 'Sacramentos' },
  { id: 16, title: 'Pecado Original', definition: 'Pelo pecado de Adão, todos os homens nascem em estado de pecado original, privados da graça santificante.', source: 'Concílio de Trento', year: 1546, category: 'Antropologia' },
  { id: 17, title: 'Imortalidade da Alma', definition: 'A alma humana é imortal e subsiste após a morte do corpo, aguardando a ressurreição final.', source: 'Concílio Lateranense V', year: 1513, category: 'Antropologia' },
  { id: 18, title: 'Livre-arbítrio', definition: 'O homem possui livre-arbítrio, pelo qual pode cooperar ou resistir à graça divina.', source: 'Concílio de Trento', year: 1547, category: 'Antropologia' },
  { id: 19, title: 'Infalibilidade Papal', definition: 'O Romano Pontífice, quando fala ex cathedra em matéria de fé e moral, goza de infalibilidade, assistido pelo Espírito Santo.', source: 'Concílio Vaticano I, Pastor Aeternus', year: 1870, category: 'Eclesiologia' },
  { id: 20, title: 'Primado de Pedro', definition: 'Cristo constituiu São Pedro como chefe visível de toda a Igreja, conferindo-lhe o primado de jurisdição. Este primado é transmitido aos seus sucessores, os Bispos de Roma.', source: 'Concílio Vaticano I', year: 1870, category: 'Eclesiologia' },
  { id: 21, title: 'A Igreja como Corpo de Cristo', definition: 'A Igreja é o Corpo Místico de Cristo, do qual Ele é a Cabeça e os fiéis são os membros.', source: 'Pio XII, Mystici Corporis', year: 1943, category: 'Eclesiologia' },
  { id: 22, title: 'Comunhão dos Santos', definition: 'Existe uma comunhão espiritual entre os fiéis na terra, as almas no purgatório e os bem-aventurados no céu.', source: 'Símbolo dos Apóstolos', year: 390, category: 'Eclesiologia' },
  { id: 23, title: 'Existência do Purgatório', definition: 'Existe o purgatório, onde as almas dos justos que morreram com pecados veniais ou penas temporais são purificadas antes de entrar no céu.', source: 'Concílio de Florença / Trento', year: 1439, category: 'Escatologia' },
  { id: 24, title: 'Ressurreição dos Mortos', definition: 'No último dia, todos os mortos ressuscitarão com seus próprios corpos para o juízo final.', source: 'Símbolo Niceno-Constantinopolitano', year: 381, category: 'Escatologia' },
  { id: 25, title: 'Juízo Final', definition: 'No fim dos tempos, Cristo virá em glória para julgar os vivos e os mortos, dando a cada um segundo as suas obras.', source: 'Símbolo Niceno / Atanasiano', year: 325, category: 'Escatologia' },
  { id: 26, title: 'Existência do Inferno', definition: 'O inferno existe e as almas dos que morrem em pecado mortal são condenadas às penas eternas.', source: 'Concílio de Florença / Trento', year: 1439, category: 'Escatologia' },
  { id: 27, title: 'Existência do Céu', definition: 'Os bem-aventurados gozam no céu da visão beatífica de Deus, face a face, numa felicidade eterna e perfeita.', source: 'Bento XII, Benedictus Deus', year: 1336, category: 'Escatologia' },
];

const CATEGORY_COLORS: Record<string, string> = {
  'Deus': 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300',
  'Cristologia': 'bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-300',
  'Mariologia': 'bg-sky-100 text-sky-800 dark:bg-sky-900/30 dark:text-sky-300',
  'Sacramentos': 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
  'Eclesiologia': 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300',
  'Escatologia': 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300',
  'Antropologia': 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300',
};

const DogmasPage: React.FC = () => {
  const [category, setCategory] = useState('Todos');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const filtered = useMemo(() => {
    let list = DOGMAS;
    if (category !== 'Todos') list = list.filter(d => d.category === category);
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      list = list.filter(d =>
        d.title.toLowerCase().includes(q) ||
        d.definition.toLowerCase().includes(q) ||
        d.source.toLowerCase().includes(q)
      );
    }
    return list;
  }, [category, searchQuery]);

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary/10 rounded-full">
          <Icons.Star className="w-4 h-4 text-primary" />
          <span className="text-[9px] font-black uppercase tracking-[0.2em] text-primary">Depositum Fidei</span>
        </div>
        <h1 className="text-3xl md:text-5xl font-serif font-bold text-foreground">Dogmas da Fé Católica</h1>
        <p className="text-muted-foreground font-serif italic max-w-xl mx-auto">
          Verdades divinamente reveladas, definidas solenemente pela Igreja como parte do depósito da fé.
        </p>
      </div>

      {/* Search */}
      <div className="max-w-md mx-auto relative">
        <Icons.Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
          placeholder="Buscar dogma, definição ou concílio..."
          className="w-full pl-11 pr-4 py-3 rounded-2xl border border-border bg-card text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
        />
      </div>

      {/* Category tabs */}
      <div className="flex gap-2 justify-center flex-wrap">
        {CATEGORIES.map(cat => (
          <button key={cat} onClick={() => setCategory(cat)}
            className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
              category === cat ? 'bg-foreground text-background shadow-lg' : 'bg-card border border-border text-muted-foreground hover:text-foreground'
            }`}>
            {cat}
          </button>
        ))}
      </div>

      {/* Stats */}
      <div className="flex justify-center gap-6 text-center">
        <div>
          <p className="text-2xl font-serif font-bold text-foreground">{filtered.length}</p>
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Dogmas</p>
        </div>
        <div>
          <p className="text-2xl font-serif font-bold text-foreground">{new Set(filtered.map(d => d.category)).size}</p>
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Categorias</p>
        </div>
      </div>

      {/* Dogmas list */}
      <div className="space-y-3">
        {filtered.map(dogma => (
          <div key={dogma.id}
            className="bg-card border border-border rounded-2xl overflow-hidden transition-all hover:border-primary/30">
            <button
              onClick={() => setExpandedId(expandedId === dogma.id ? null : dogma.id)}
              className="w-full text-left p-6 flex items-start gap-4"
            >
              <span className="text-2xl font-serif font-bold text-primary/30 shrink-0 w-8">{dogma.id}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest ${CATEGORY_COLORS[dogma.category] || 'bg-muted text-muted-foreground'}`}>
                    {dogma.category}
                  </span>
                  <span className="text-[10px] text-muted-foreground">{dogma.year}</span>
                </div>
                <h3 className="text-base font-bold text-foreground">{dogma.title}</h3>
                {expandedId !== dogma.id && (
                  <p className="text-sm text-muted-foreground line-clamp-1 mt-1">{dogma.definition}</p>
                )}
              </div>
              <Icons.ArrowDown className={`w-4 h-4 text-muted-foreground shrink-0 transition-transform ${expandedId === dogma.id ? 'rotate-180' : ''}`} />
            </button>
            {expandedId === dogma.id && (
              <div className="px-6 pb-6 pl-[4.5rem] space-y-3 border-t border-border pt-4">
                <p className="text-foreground/90 leading-relaxed font-serif">{dogma.definition}</p>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-black uppercase tracking-widest text-primary">Fonte:</span>
                  <span className="text-sm text-muted-foreground">{dogma.source} ({dogma.year})</span>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default DogmasPage;
